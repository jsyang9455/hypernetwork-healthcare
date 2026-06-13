import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, User, Heart, Bed, Activity, Calendar, Phone, Mail, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RealTimeChart } from "@/components/charts/RealTimeChart";
import { HealthPredictionChart } from "@/components/HealthPredictionChart";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useLanguage } from "@/contexts/LanguageContext";
import { User as UserType, HealthData, BedMovementData } from "@shared/schema";

export default function MemberDetail() {
  const [match, params] = useRoute("/member/:id");
  const [, setLocation] = useLocation();
  const userId = params?.id ? parseInt(params.id) : null;
  const [healthHistory, setHealthHistory] = useState<number[]>([]);
  const [bedMovementHistory, setBedMovementHistory] = useState<number[]>([]);
  const [currentHealthData, setCurrentHealthData] = useState<HealthData | null>(null);
  const [currentBedMovementData, setCurrentBedMovementData] = useState<BedMovementData | null>(null);
  const [healthDataHistory, setHealthDataHistory] = useState<HealthData[]>([]);

  const { t, language, setLanguage } = useLanguage();

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: healthStats } = useQuery({
    queryKey: ["/api/users", userId, "health/weekly"],
    enabled: !!userId,
  });

  const { data: bedMovementStats } = useQuery({
    queryKey: ["/api/users", userId, "bedmovement/weekly"],
    enabled: !!userId,
  });

  const { data: healthHistoryData } = useQuery<HealthData[]>({
    queryKey: ["/api/users", userId, "health/history"],
    enabled: !!userId,
  });

  const currentUser = users.find(u => u.id === userId);

  const { connectionStatus } = useWebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

  useEffect(() => {
    if (connectionStatus !== 'connected' || !userId) return;

    const loadInitialData = async () => {
      try {
        const healthResponse = await fetch(`/api/users/${userId}/health/latest`);
        const bedMovementResponse = await fetch(`/api/users/${userId}/bedmovement/latest`);
        const healthHistoryResponse = await fetch(`/api/users/${userId}/health/history?limit=50`);
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setCurrentHealthData(healthData);
          setHealthHistory(prev => [...prev.slice(-19), healthData.heartRate]);
        }
        
        if (bedMovementResponse.ok) {
          const bedMovementData = await bedMovementResponse.json();
          setCurrentBedMovementData(bedMovementData);
          setBedMovementHistory(prev => [...prev.slice(-19), bedMovementData.movementIntensity]);
        }

        if (healthHistoryResponse.ok) {
          const historyData = await healthHistoryResponse.json();
          setHealthDataHistory(historyData);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();

    const interval = setInterval(loadInitialData, 5000);

    return () => clearInterval(interval);
  }, [userId, connectionStatus]);

  useEffect(() => {
    if (healthHistoryData) {
      setHealthDataHistory(healthHistoryData);
    }
  }, [healthHistoryData]);

  if (!match || !userId || !currentUser) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('member', 'memberNotFound')}</h2>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common', 'goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const getHealthStatus = () => {
    if (!currentHealthData) return t('common', 'noData');
    
    if (currentHealthData.bodyTemperature > 38.5) return t('health', 'highFeverDanger');
    if (currentHealthData.bodyTemperature > 37.5) return t('health', 'feverWarning');
    if (currentHealthData.bodyTemperature < 35.0) return t('health', 'hypothermiaDanger');
    
    if (currentHealthData.heartRate > 100) return t('health', 'tachycardiaDanger');
    if (currentHealthData.heartRate > 80) return t('common', 'warning');
    if (currentHealthData.heartRate < 50) return t('health', 'bradycardiaWarning');
    
    if (currentHealthData.respiratoryRate > 20) return t('health', 'tachypneaWarning');
    if (currentHealthData.respiratoryRate < 12) return t('health', 'bradypneaWarning');
    
    if (currentHealthData.bloodPressureSystolic > 140 || currentHealthData.bloodPressureDiastolic > 90) return t('health', 'hypertensionWarning');
    
    return t('common', 'normal');
  };

  const getBedMovementStatus = () => {
    if (!currentBedMovementData) return t('common', 'noData');
    if (currentBedMovementData.movementIntensity > 80) return t('health', 'excessiveMovement');
    if (currentBedMovementData.mobilityScore < 30) return t('health', 'reducedMobility');
    return t('common', 'normal');
  };

  const getPositionTranslation = (position: string | undefined) => {
    if (!position) return t('bedMovement', 'unknown');
    const positionLower = position.toLowerCase();
    if (positionLower === '누움' || positionLower === 'lying') return t('bedMovement', 'lying');
    if (positionLower === '앉음' || positionLower === 'sitting') return t('bedMovement', 'sitting');
    if (positionLower === '서있음' || positionLower === 'standing') return t('bedMovement', 'standing');
    return position;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('member', 'backToDashboard')}
          </Button>
          
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={language === 'ko' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('ko')}
            >
              {t('common', 'korean')}
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
            >
              {t('common', 'english')}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{currentUser.name}</h1>
            <p className="text-muted-foreground">{currentUser.username}</p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('member', 'basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('member', 'email')}</span>
              <span>{currentUser.emergencyContact || t('member', 'notRegistered')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('member', 'contact')}</span>
              <span>{currentUser.doctorContact || t('member', 'notRegistered')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('member', 'ageYears')}</span>
              <span>{currentUser.age || t('member', 'notSet')}{currentUser.age ? t('member', 'age') : ''}</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('member', 'gender')}</span>
              <span>{currentUser.gender || t('member', 'notSet')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('member', 'bedNumber')}</span>
              <span>{currentUser.bedLocation || t('member', 'notAssigned')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('member', 'emergencyContact')}</span>
              <span>{currentUser.emergencyContact || t('member', 'notSet')}</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t('member', 'medicalConditions')}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentUser.medicalConditions && currentUser.medicalConditions.length > 0 ? (
                  currentUser.medicalConditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {condition}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs">{t('member', 'none')}</Badge>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t('member', 'medications')}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentUser.medications && currentUser.medications.length > 0 ? (
                  currentUser.medications.map((medication, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {medication}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs">{t('member', 'none')}</Badge>
                )}
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open(`/location-tracking/${userId}`, '_blank')}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              {t('location', 'checkLocationRecord')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/rehabilitation-management/${userId}`)}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              {t('member', 'rehabilitationManagement')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              {t('health', 'healthStatus')}
              <Badge variant={getHealthStatus() === t('common', 'normal') ? "default" : getHealthStatus().includes(t('common', 'warning')) ? "secondary" : "destructive"}>
                {getHealthStatus()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentHealthData ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">{t('common', 'item')}</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">{t('common', 'value')}</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-900">{t('common', 'status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('health', 'heartRate')}</td>
                        <td className="px-4 py-3 text-right text-red-500 font-bold text-lg">
                          {currentHealthData.heartRate || 0} {t('health', 'bpm')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            (currentHealthData.heartRate || 0) > 100 
                              ? 'bg-red-100 text-red-800' 
                              : (currentHealthData.heartRate || 0) > 90 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(currentHealthData.heartRate || 0) > 100 ? t('common', 'danger') : (currentHealthData.heartRate || 0) > 90 ? t('common', 'warning') : t('common', 'normal')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('health', 'bloodPressure')}</td>
                        <td className="px-4 py-3 text-right text-blue-500 font-bold text-lg">
                          {currentHealthData.bloodPressureSystolic || 0}/{currentHealthData.bloodPressureDiastolic || 0} {t('health', 'mmHg')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            (currentHealthData.bloodPressureSystolic || 0) > 140 
                              ? 'bg-red-100 text-red-800' 
                              : (currentHealthData.bloodPressureSystolic || 0) > 130 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(currentHealthData.bloodPressureSystolic || 0) > 140 ? t('common', 'danger') : (currentHealthData.bloodPressureSystolic || 0) > 130 ? t('common', 'warning') : t('common', 'normal')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('health', 'bodyTemperature')}</td>
                        <td className="px-4 py-3 text-right text-red-400 font-bold text-lg">
                          {currentHealthData.bodyTemperature || 0}°C
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            (currentHealthData.bodyTemperature || 0) > 37.5 || (currentHealthData.bodyTemperature || 0) < 36.0
                              ? 'bg-red-100 text-red-800' 
                              : (currentHealthData.bodyTemperature || 0) > 37.2 || (currentHealthData.bodyTemperature || 0) < 36.2
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(currentHealthData.bodyTemperature || 0) > 37.5 || (currentHealthData.bodyTemperature || 0) < 36.0 ? t('common', 'danger') : (currentHealthData.bodyTemperature || 0) > 37.2 || (currentHealthData.bodyTemperature || 0) < 36.2 ? t('common', 'warning') : t('common', 'normal')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('health', 'steps')}</td>
                        <td className="px-4 py-3 text-right text-green-500 font-bold text-lg">
                          {currentHealthData.steps || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {t('common', 'info')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('health', 'stressLevel')}</td>
                        <td className="px-4 py-3 text-right text-orange-500 font-bold text-lg">
                          {currentHealthData.stressLevel || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            {t('health', 'monitoringInProgress')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('health', 'respiratoryRate')}</td>
                        <td className="px-4 py-3 text-right text-purple-500 font-bold text-lg" data-testid="text-respiratory-rate-detail">
                          {currentHealthData.respiratoryRate || 0} {t('health', 'bpm')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            (currentHealthData.respiratoryRate || 0) > 20 || (currentHealthData.respiratoryRate || 0) < 12
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(currentHealthData.respiratoryRate || 0) > 20 ? t('health', 'tachypneaWarning') : (currentHealthData.respiratoryRate || 0) < 12 ? t('health', 'bradypneaWarning') : t('common', 'normal')}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">{t('health', 'heartRateTrend')}</h4>
                  <div className="h-64 bg-white border rounded-lg p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={healthHistory.slice(-10).map((value, index) => ({
                          time: `${String(index + 1).padStart(2, '0')}${t('common', 'minutesAgo')}`,
                          heartRate: value,
                          status: value > 100 ? 'danger' : value > 90 ? 'warning' : 'normal'
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="heartRateAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: '#d0d0d0' }}
                        />
                        <YAxis 
                          domain={[50, 120]} 
                          tick={{ fontSize: 12 }}
                          axisLine={{ stroke: '#d0d0d0' }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`${value} ${t('health', 'bpm')}`, t('health', 'heartRate')]}
                          labelFormatter={(label: any) => `${t('common', 'time')}: ${label}`}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Area 
                          type="monotone"
                          dataKey="heartRate" 
                          stroke="#ef4444"
                          strokeWidth={3}
                          fill="url(#heartRateAreaGradient)"
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t('health', 'loadingHealthData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-blue-500" />
              {t('bedMovement', 'bedStatus')}
              <Badge variant={getBedMovementStatus() === t('common', 'normal') ? "default" : "secondary"}>
                {getBedMovementStatus()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentBedMovementData ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-900">{t('common', 'item')}</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-900">{t('common', 'value')}</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-900">{t('common', 'status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('bedMovement', 'currentPosition')}</td>
                        <td className="px-4 py-3 text-right text-blue-500 font-bold text-lg">
                          {getPositionTranslation(currentBedMovementData.position)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {t('bedMovement', 'active')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('bedMovement', 'movementIntensity')}</td>
                        <td className="px-4 py-3 text-right text-green-500 font-bold text-lg">
                          {currentBedMovementData.movementIntensity || 0}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            (currentBedMovementData.movementIntensity || 0) < 25 
                              ? 'bg-red-100 text-red-800' 
                              : (currentBedMovementData.movementIntensity || 0) < 35 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(currentBedMovementData.movementIntensity || 0) < 25 ? t('common', 'danger') : (currentBedMovementData.movementIntensity || 0) < 35 ? t('common', 'warning') : t('common', 'normal')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('bedMovement', 'mobilityScore')}</td>
                        <td className="px-4 py-3 text-right text-orange-500 font-bold text-lg">
                          {currentBedMovementData.mobilityScore || 0}{t('bedMovement', 'points')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            (currentBedMovementData.mobilityScore || 0) < 75 
                              ? 'bg-red-100 text-red-800' 
                              : (currentBedMovementData.mobilityScore || 0) < 85 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(currentBedMovementData.mobilityScore || 0) < 75 ? t('common', 'danger') : (currentBedMovementData.mobilityScore || 0) < 85 ? t('common', 'warning') : t('common', 'normal')}
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{t('bedMovement', 'locationStatus')}</td>
                        <td className="px-4 py-3 text-right text-purple-500 font-bold text-lg">
                          {currentBedMovementData.isInBed ? t('bedMovement', 'inBed') : t('bedMovement', 'outOfBed')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            currentBedMovementData.isInBed 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {currentBedMovementData.isInBed ? t('bedMovement', 'resting') : t('bedMovement', 'active')}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">{t('bedMovement', 'movementIntensityTrend')}</h4>
                  <div className="h-64 bg-white border rounded-lg p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bedMovementHistory.slice(-10).map((value, index) => ({
                        time: `${String(index + 1).padStart(2, '0')}${t('common', 'minutesAgo')}`,
                        movementIntensity: value,
                        status: value < 25 ? 'danger' : value < 35 ? 'warning' : 'normal'
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value: any) => [`${value}%`, t('bedMovement', 'movementIntensity')]}
                          labelFormatter={(label: any) => `${t('common', 'time')}: ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="movementIntensity" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#1d4ed8' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bed className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t('bedMovement', 'loadingBedData')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <HealthPredictionChart 
          healthHistory={healthDataHistory}
          userId={userId}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('health', 'weeklyHealthStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            {healthStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t('analytics', 'avgHeartRate')}</div>
                    <div className="text-2xl font-bold">75 {t('health', 'bpm')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('analytics', 'avgBloodPressure')}</div>
                    <div className="text-2xl font-bold">120/80 {t('health', 'mmHg')}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t('health', 'totalSteps')}</div>
                    <div className="text-2xl font-bold">2,450</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('health', 'avgStress')}</div>
                    <div className="text-2xl font-bold">{t('health', 'low')}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('health', 'loadingStats')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('bedMovement', 'weeklyBedStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            {bedMovementStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t('bedMovement', 'avgMovementIntensity')}</div>
                    <div className="text-2xl font-bold">25%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('bedMovement', 'avgMobilityScore')}</div>
                    <div className="text-2xl font-bold">78</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{t('bedMovement', 'outOfBedTime')}</div>
                    <div className="text-2xl font-bold">6{t('common', 'hours')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{t('bedMovement', 'activityScore')}</div>
                    <div className="text-2xl font-bold">82</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t('health', 'loadingStats')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
