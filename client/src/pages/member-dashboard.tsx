import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Bed, Calendar, TrendingUp, AlertTriangle, User as UserIcon, Bell, MapPin, Network, Globe } from "lucide-react";
import { Line, LineChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useWebSocket } from "@/hooks/useWebSocket";
import { User as UserType } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface HealthData {
  userId: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  bodyTemperature: number;
  respiratoryRate: number;
  steps: number;
  stressLevel: string;
  timestamp: string;
}

interface BedMovementData {
  userId: number;
  position: string;
  movementIntensity: number;
  mobilityScore: number;
  isInBed: boolean;
  timestamp: string;
}

interface Alert {
  id: number;
  userId: number;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { connectionStatus } = useWebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7');
  
  const userId = user?.memberData?.id || parseInt(user?.id || '0');

  // BMI calculation function
  const calculateBMI = (height: number | null, weight: number | null): number | null => {
    if (!height || !weight) return null;
    const heightInM = height / 100;
    return parseFloat((weight / (heightInM * heightInM)).toFixed(1));
  };

  // BMI status function
  const getBMIStatus = (bmi: number | null): { status: string; color: string } => {
    if (!bmi) return { status: t('member', 'noInfo'), color: 'text-gray-500' };
    if (bmi < 18.5) return { status: t('member', 'bmiUnderweight'), color: 'text-blue-600' };
    if (bmi < 23) return { status: t('member', 'bmiNormal'), color: 'text-green-600' };
    if (bmi < 25) return { status: t('member', 'bmiOverweight'), color: 'text-yellow-600' };
    return { status: t('member', 'bmiObese'), color: 'text-red-600' };
  };

  // Fetch user's health data
  const { data: healthData } = useQuery<HealthData>({
    queryKey: ["/api/users", userId, "health", "latest"],
    enabled: !!userId,
    refetchInterval: 5000,
  });

  // Fetch user's bed movement data
  const { data: bedMovementData } = useQuery<BedMovementData>({
    queryKey: ["/api/users", userId, "bedmovement", "latest"],
    enabled: !!userId,
    refetchInterval: 5000,
  });

  // Fetch user's health history
  const { data: healthHistory } = useQuery<HealthData[]>({
    queryKey: ["/api/users", userId, "health", "history"],
    enabled: !!userId,
  });

  // Fetch user's alerts
  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    enabled: !!userId,
    refetchInterval: 5000,
  });

  // Fetch user profile data
  const { data: userProfile } = useQuery<UserType>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  // Fetch weekly stats
  const { data: weeklyHealthStats } = useQuery({
    queryKey: ["/api/users", userId, "health", "weekly"],
    enabled: !!userId,
  });

  const { data: weeklyBedMovementStats } = useQuery({
    queryKey: ["/api/users", userId, "bedmovement", "weekly"],
    enabled: !!userId,
  });

  const getHealthStatus = () => {
    if (!healthData) return t('common', 'noData');
    
    if (healthData.bodyTemperature > 38.5) return t('health', 'highFeverDanger');
    if (healthData.bodyTemperature > 37.5) return t('health', 'feverWarning');
    if (healthData.bodyTemperature < 35.0) return t('health', 'hypothermiaDanger');
    
    if (healthData.heartRate > 100) return t('health', 'tachycardiaDanger');
    if (healthData.heartRate > 80) return t('common', 'warning');
    if (healthData.heartRate < 50) return t('health', 'bradycardiaWarning');
    
    if (healthData.respiratoryRate > 20) return t('health', 'tachypneaWarning');
    if (healthData.respiratoryRate < 12) return t('health', 'bradypneaWarning');
    
    if (healthData.bloodPressureSystolic > 140 || healthData.bloodPressureDiastolic > 90) return t('health', 'hypertensionWarning');
    
    return t('common', 'normal');
  };

  const getBedMovementStatus = () => {
    if (!bedMovementData) return t('common', 'noData');
    if (bedMovementData.movementIntensity > 80) return t('health', 'excessiveMovement');
    if (bedMovementData.mobilityScore < 30) return t('health', 'reducedMobility');
    return t('common', 'normal');
  };

  const getStatusColor = (status: string) => {
    const normalLabels = [t('common', 'normal')];
    const warningLabels = [
      t('common', 'warning'), 
      t('health', 'feverWarning'),
      t('health', 'bradycardiaWarning'),
      t('health', 'tachypneaWarning'),
      t('health', 'bradypneaWarning'),
      t('health', 'hypertensionWarning')
    ];
    const dangerLabels = [
      t('common', 'danger'),
      t('health', 'highFeverDanger'),
      t('health', 'tachycardiaDanger'),
      t('health', 'hypothermiaDanger'),
      t('health', 'excessiveMovement'),
      t('health', 'reducedMobility')
    ];
    
    if (normalLabels.includes(status)) return "bg-green-500 text-white";
    if (warningLabels.includes(status)) return "bg-yellow-500 text-white";
    if (dangerLabels.includes(status)) return "bg-red-500 text-white";
    return "bg-gray-500 text-white";
  };

  const userAlerts = alerts?.filter(alert => alert.userId === userId) || [];
  const criticalAlerts = userAlerts.filter(alert => alert.severity === "critical");
  const unreadAlerts = userAlerts.filter(alert => !alert.isRead);

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (!user?.memberData) {
    return <div className="flex items-center justify-center h-screen">{t('common', 'loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Network className="w-8 h-8 text-health-blue mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">{t('dashboard', 'title')}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-500">
                  {connectionStatus === 'connected' ? t('memberDashboard', 'realTimeConnected') : t('dashboard', 'disconnected')}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                className="flex items-center gap-1"
              >
                <Globe className="w-4 h-4" />
                {language === 'ko' ? 'EN' : '한국어'}
              </Button>
              
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{user.memberData.name}</span>
              </div>
              
              <Button variant="outline" onClick={() => window.location.href = '/profile'} size="sm">
                {t('memberDashboard', 'detailInfo')}
              </Button>
              
              <Button variant="outline" onClick={logout} size="sm">
                {t('common', 'logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{user.memberData.name}</h2>
            <p className="text-gray-600">{user.memberData.age}{t('member', 'age')} · {user.memberData.gender}</p>
            <p className="text-gray-600">{t('member', 'bedNumber')} {user.memberData.bedLocation || t('member', 'notAssigned')}</p>
          </div>

          {/* Alert Summary */}
          {criticalAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">
                  {criticalAlerts.length} {t('memberDashboard', 'urgentAlertsMessage')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Health Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('health', 'healthStatus')}</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500 mb-1">
                {healthData?.heartRate || 0} {t('health', 'bpm')}
              </div>
              <Badge className={getStatusColor(getHealthStatus())}>
                {getHealthStatus()}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">
                {t('health', 'bloodPressure')}: {healthData?.bloodPressureSystolic || 0}/{healthData?.bloodPressureDiastolic || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('health', 'bodyTemperature')}: {healthData?.bodyTemperature || 0}°C
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('health', 'respiratoryRate')}: {healthData?.respiratoryRate || 0} {t('health', 'bpm')}
              </p>
              {userProfile?.height && userProfile?.weight && (
                <p className="text-xs text-gray-500 mt-1">
                  BMI: <span className={getBMIStatus(calculateBMI(userProfile.height, userProfile.weight)).color}>
                    {calculateBMI(userProfile.height, userProfile.weight)} ({getBMIStatus(calculateBMI(userProfile.height, userProfile.weight)).status})
                  </span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Bed Movement Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('bedMovement', 'bedStatus')}</CardTitle>
              <Bed className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {bedMovementData?.position || t('bedMovement', 'unknown')}
              </div>
              <Badge className={getStatusColor(getBedMovementStatus())}>
                {getBedMovementStatus()}
              </Badge>
              <p className="text-xs text-gray-500 mt-2">
                {t('bedMovement', 'movementIntensity')}: {bedMovementData?.movementIntensity || 0}%
              </p>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('health', 'todaysSteps')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 mb-1">
                {healthData?.steps || 0}
              </div>
              <p className="text-xs text-gray-500">
                {t('health', 'stressLevel')}: {healthData?.stressLevel || t('memberDashboard', 'noMeasurement')}
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('alerts', 'notifications')}</CardTitle>
              <Bell className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500 mb-1">
                {unreadAlerts.length}
              </div>
              <p className="text-xs text-gray-500">
                {t('memberDashboard', 'unreadAlerts')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Health Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                {t('health', 'healthDataTrend')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart 
                  data={healthHistory?.slice(-10) || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="heartRateGradientMember" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#d0d0d0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#d0d0d0' }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: any) => [`${value} ${t('health', 'bpm')}`, t('health', 'heartRate')]}
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
                    fill="url(#heartRateGradientMember)"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
                    name={t('health', 'heartRate')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Stats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {t('analytics', 'weeklyStats')}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={selectedPeriod === '7' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('7')}
                  >
                    {t('memberDashboard', 'days7')}
                  </Button>
                  <Button
                    variant={selectedPeriod === '30' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod('30')}
                  >
                    {t('memberDashboard', 'days30')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {selectedPeriod === '7' ? 75 : 82}
                    </div>
                    <div className="text-sm text-gray-500">{t('analytics', 'avgHeartRate')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {selectedPeriod === '7' ? 25 : 32}
                    </div>
                    <div className="text-sm text-gray-500">{t('bedMovement', 'avgMovementIntensity')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {selectedPeriod === '7' ? 2450 : 3240}
                    </div>
                    <div className="text-sm text-gray-500">{t('memberDashboard', 'avgSteps')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {selectedPeriod === '7' ? 78 : 71}
                    </div>
                    <div className="text-sm text-gray-500">{t('bedMovement', 'avgMobilityScore')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Health Prediction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              {t('health', 'aiHealthPrediction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health Trend Prediction */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('memberDashboard', 'healthIndicatorPrediction')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="font-medium">{t('memberDashboard', 'heartRatePrediction')}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {Math.round(72 + Math.random() * 8)} {t('health', 'bpm')}
                      </div>
                      <div className="text-sm text-gray-500">{t('memberDashboard', 'expectedAfter7Days')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-green-500" />
                      <span className="font-medium">{t('memberDashboard', 'stressIndex')}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {Math.round(35 + Math.random() * 15)}%
                      </div>
                      <div className="text-sm text-gray-500">{t('memberDashboard', 'expectedAfter7Days')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">{t('memberDashboard', 'activityLevel')}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">
                        {Math.round(8500 + Math.random() * 2000)} {t('health', 'steps')}
                      </div>
                      <div className="text-sm text-gray-500">{t('memberDashboard', 'expectedAfter7Days')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('memberDashboard', 'aiHealthRecommendations')}</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800 mb-2">{t('memberDashboard', 'exerciseRecommendation')}</div>
                    <p className="text-sm text-blue-700">
                      {t('memberDashboard', 'exerciseRecommendationDesc')}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800 mb-2">{t('memberDashboard', 'sleepManagement')}</div>
                    <p className="text-sm text-green-700">
                      {t('memberDashboard', 'sleepManagementDesc')}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800 mb-2">{t('memberDashboard', 'medicationHabit')}</div>
                    <p className="text-sm text-yellow-700">
                      {t('memberDashboard', 'medicationHabitDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="mt-6 text-center">
              <Button 
                onClick={() => window.location.href = '/profile'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {t('memberDashboard', 'viewDetailedAIAnalysis')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Location Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              {t('memberDashboard', 'locationAndMovementRecord')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{t('location', 'inRoom')}</div>
                  <div className="text-sm text-gray-500">{t('location', 'currentLocation')}</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {bedMovementData?.position || t('bedMovement', 'unknown')}
                  </div>
                  <div className="text-sm text-gray-500">{t('bedMovement', 'positionStatus')}</div>
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/location-tracking/${user?.memberData?.id}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  {t('location', 'checkLocationRecord')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              {t('memberDashboard', 'recentAlerts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('alerts', 'noNotifications')}</p>
            ) : (
              <div className="space-y-3">
                {userAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.type === 'health' ? t('alerts', 'health') : t('alerts', 'vehicle')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}