import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Network, Heart, Bed, User as UserIcon, Phone, Mail, Calendar, ArrowLeft, Download, FileText, MapPin, Globe } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { User, HealthData } from "@shared/schema";

interface BedMovementData {
  userId: number;
  position: string;
  movementIntensity: number;
  mobilityScore: number;
  isInBed: boolean;
  timestamp: string;
}

export default function MemberProfile() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const userId = user?.memberData?.id || parseInt(user?.id || '0');

  // BMI calculation function
  const calculateBMI = (height: number | null, weight: number | null): number | null => {
    if (!height || !weight) return null;
    const heightInM = height / 100;
    return parseFloat((weight / (heightInM * heightInM)).toFixed(1));
  };

  // BMI status function
  const getBMIStatus = (bmi: number | null): { status: string; color: string } => {
    if (!bmi) return { status: t('common', 'noData'), color: 'text-gray-500' };
    if (bmi < 18.5) return { status: 'Underweight', color: 'text-blue-600' };
    if (bmi < 23) return { status: t('common', 'normal'), color: 'text-green-600' };
    if (bmi < 25) return { status: 'Overweight', color: 'text-yellow-600' };
    return { status: 'Obese', color: 'text-red-600' };
  };

  // Fetch user profile data
  const { data: userProfile } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

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

  // Fetch user's bed movement history
  const { data: bedMovementHistory } = useQuery<BedMovementData[]>({
    queryKey: ["/api/users", userId, "bedmovement", "history"],
    enabled: !!userId,
  });

  // Generate AI health prediction data
  const generateHealthPrediction = () => {
    const baseData = healthHistory?.slice(-7) || [];
    const predictions = [];
    
    for (let i = 1; i <= 7; i++) {
      const lastData = baseData[baseData.length - 1];
      if (lastData) {
        // Simple linear regression simulation
        const trend = baseData.length > 1 ? 
          (lastData.heartRate - baseData[0].heartRate) / baseData.length : 0;
        
        const predictedHeartRate = Math.max(60, Math.min(100, lastData.heartRate + trend * i));
        const predictedSteps = Math.max(1000, Math.min(15000, lastData.steps + (Math.random() - 0.5) * 1000));
        const predictedStress = Math.max(10, Math.min(80, 
          lastData.stressLevel === 'low' ? 20 : 
          lastData.stressLevel === 'medium' ? 40 : 60
        ));
        
        predictions.push({
          day: i,
          heartRate: Math.round(predictedHeartRate),
          steps: Math.round(predictedSteps),
          stressLevel: Math.round(predictedStress),
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString()
        });
      }
    }
    
    return predictions;
  };

  const healthPredictions = generateHealthPrediction();

  const getHealthStatus = (): { key: string; category: 'health' | 'common' } => {
    if (!healthData) return { key: 'noData', category: 'common' };
    
    // 체온 기준 우선 판단
    if (healthData.bodyTemperature > 38.5) return { key: 'highFeverDanger', category: 'health' };
    if (healthData.bodyTemperature > 37.5) return { key: 'feverWarning', category: 'health' };
    if (healthData.bodyTemperature < 35.0) return { key: 'hypothermiaDanger', category: 'health' };
    
    // 심박수 기준 판단
    if (healthData.heartRate > 100) return { key: 'tachycardiaDanger', category: 'health' };
    if (healthData.heartRate > 80) return { key: 'warning', category: 'common' };
    if (healthData.heartRate < 50) return { key: 'bradycardiaWarning', category: 'health' };
    
    // 호흡수 기준 판단
    if (healthData.respiratoryRate > 20) return { key: 'tachypneaWarning', category: 'health' };
    if (healthData.respiratoryRate < 12) return { key: 'bradypneaWarning', category: 'health' };
    
    // 혈압 기준 판단
    if (healthData.bloodPressureSystolic > 140 || healthData.bloodPressureDiastolic > 90) return { key: 'hypertensionWarning', category: 'health' };
    
    return { key: 'normal', category: 'common' };
  };

  const getBedMovementStatus = (): { key: string; category: 'health' | 'common' } => {
    if (!bedMovementData) return { key: 'noData', category: 'common' };
    if (bedMovementData.movementIntensity > 80) return { key: 'excessiveMovement', category: 'health' };
    if (bedMovementData.mobilityScore < 30) return { key: 'reducedMobility', category: 'health' };
    return { key: 'normal', category: 'common' };
  };

  const getStatusColor = (status: { key: string; category: 'health' | 'common' }): string => {
    const statusKey = status.key;
    if (statusKey === 'normal') return "bg-green-500 text-white";
    if (['warning', 'feverWarning', 'bradycardiaWarning', 'tachypneaWarning', 'bradypneaWarning', 'hypertensionWarning'].includes(statusKey)) return "bg-yellow-500 text-white";
    if (['danger', 'highFeverDanger', 'tachycardiaDanger', 'hypothermiaDanger', 'excessiveMovement', 'reducedMobility'].includes(statusKey)) return "bg-red-500 text-white";
    return "bg-gray-500 text-white";
  };

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const generatePDFReport = async () => {
    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate image dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 40) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 20;
      
      // Add the full content as image (this preserves Korean text)
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Add simple header text using basic ASCII characters
      pdf.setFontSize(8);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US')} | User: ${currentUser.name}`, 10, 10);
      
      // Add footer
      pdf.setFontSize(8);
      pdf.text('하이퍼네트워크 헬스케어 시스템', 10, pdfHeight - 10);
      
      pdf.save(`HealthReport_${currentUser.name}_${new Date().toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!user?.memberData) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  const currentUser = userProfile || user.memberData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Network className="w-8 h-8 text-health-blue mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">{t('login', 'title')}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
                <Globe className="w-5 h-5 text-gray-500" />
                <Button 
                  variant={language === 'ko' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ko')}
                  className="text-xs"
                >
                  {t('common', 'korean')}
                </Button>
                <Button 
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                  className="text-xs"
                >
                  {t('common', 'english')}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
              </div>
              
              <Button 
                variant="outline" 
                onClick={generatePDFReport} 
                disabled={isGeneratingPDF}
                size="sm"
                className="flex items-center gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    {t('member', 'generating')}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t('member', 'downloadPDF')}
                  </>
                )}
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('member', 'backToDashboard')}
            </Button>
            
            <div className="flex items-center gap-2">

              
              <Button
                variant="outline"
                onClick={() => setLocation('/member-rehabilitation-report')}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {t('rehabilitation', 'history')}
              </Button>
              <Button 
                variant="outline" 
                onClick={generatePDFReport} 
                disabled={isGeneratingPDF}
                className="flex items-center gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    {t('member', 'generatingPDF')}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    {t('member', 'healthReportDownload')}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold">{currentUser.name}</h1>
            <p className="text-gray-600">{currentUser.username}</p>
          </div>
        </div>

        {/* PDF Content Wrapper */}
        <div ref={reportRef} className="bg-white">
          {/* Basic Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                {t('member', 'basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">{t('member', 'email')}</span>
                <span>{currentUser.username}@example.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">{t('member', 'contact')}</span>
                <span>{currentUser.emergencyContact || t('member', 'notRegistered')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">{t('member', 'age')}</span>
                <span>{currentUser.age || t('member', 'notSet')}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('member', 'gender')}</span>
                <span>{currentUser.gender || t('member', 'notSet')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">{t('member', 'bedNumber')}</span>
                <span>{currentUser.bedLocation || t('member', 'notAssigned')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('member', 'emergencyContact')}</span>
                <span>{currentUser.emergencyContact || t('member', 'notSet')}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('member', 'height')}</span>
                <span>{currentUser.height ? `${currentUser.height}cm` : t('member', 'notSet')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('member', 'weight')}</span>
                <span>{currentUser.weight ? `${currentUser.weight}kg` : t('member', 'notSet')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t('member', 'bmi')}</span>
                <span className={getBMIStatus(calculateBMI(currentUser.height, currentUser.weight)).color}>
                  {calculateBMI(currentUser.height, currentUser.weight) || t('member', 'cannotCalculate')} 
                  {calculateBMI(currentUser.height, currentUser.weight) && 
                    ` (${getBMIStatus(calculateBMI(currentUser.height, currentUser.weight)).status})`
                  }
                </span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">{t('member', 'medicalConditions')}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentUser.medicalConditions && currentUser.medicalConditions.length > 0 ? (
                    currentUser.medicalConditions.map((condition: string, index: number) => (
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
                <span className="text-sm text-gray-500">{t('member', 'medications')}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentUser.medications && currentUser.medications.length > 0 ? (
                    currentUser.medications.map((medication: string, index: number) => (
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
          </CardContent>
        </Card>

        {/* Real-time Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                {t('health', 'healthStatus')}
                {(() => {
                  const healthStatus = getHealthStatus();
                  const statusText = healthStatus.category === 'health' 
                    ? t('health', healthStatus.key as any)
                    : t('common', healthStatus.key as any);
                  return (
                    <Badge className={getStatusColor(healthStatus)}>
                      {statusText}
                    </Badge>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{healthData.heartRate || 0}</div>
                      <div className="text-sm text-gray-500">{t('health', 'heartRate')} ({t('health', 'bpm')})</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {healthData.bloodPressureSystolic || 0}/{healthData.bloodPressureDiastolic || 0}
                      </div>
                      <div className="text-sm text-gray-500">{t('health', 'bloodPressure')}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{healthData.bodyTemperature || 0}°C</div>
                      <div className="text-sm text-gray-500">{t('health', 'bodyTemperature')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500" data-testid="text-respiratory-rate">{healthData.respiratoryRate || 0} {t('health', 'bpm')}</div>
                      <div className="text-sm text-gray-500">{t('health', 'respiratoryRate')}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{healthData.steps || 0}</div>
                      <div className="text-sm text-gray-500">{t('health', 'todaysSteps')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">{healthData.stressLevel || t('common', 'noData')}</div>
                      <div className="text-sm text-gray-500">{t('health', 'stressLevel')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('health', 'loadingHealthData')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bed Movement Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-blue-500" />
                {t('bedMovement', 'bedStatus')}
                {(() => {
                  const bedStatus = getBedMovementStatus();
                  const statusText = bedStatus.category === 'health' 
                    ? t('health', bedStatus.key as any)
                    : t('common', bedStatus.key as any);
                  return (
                    <Badge className={getStatusColor(bedStatus)}>
                      {statusText}
                    </Badge>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bedMovementData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{bedMovementData.position || t('bedMovement', 'unknown')}</div>
                      <div className="text-sm text-gray-500">{t('bedMovement', 'currentPosition')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{bedMovementData.movementIntensity || 0}%</div>
                      <div className="text-sm text-gray-500">{t('bedMovement', 'movementIntensity')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{bedMovementData.mobilityScore || 0}</div>
                      <div className="text-sm text-gray-500">{t('bedMovement', 'mobilityScore')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">
                        {bedMovementData.isInBed ? t('bedMovement', 'inBed') : t('bedMovement', 'outOfBed')}
                      </div>
                      <div className="text-sm text-gray-500">{t('bedMovement', 'locationStatus')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('bedMovement', 'loadingBedData')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-500" />
                {t('location', 'locationRecord')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {t('location', 'dailyMovementDescription')}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(`/location-tracking/${userId}`, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {t('location', 'checkLocationRecord')}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{t('location', 'inRoom')}</div>
                    <div className="text-sm text-gray-500">{t('location', 'currentLocation')}</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {bedMovementData?.position || t('bedMovement', 'unknown')}
                    </div>
                    <div className="text-sm text-gray-500">{t('bedMovement', 'positionStatus')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Health History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('health', 'healthDataTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={healthHistory?.slice(-10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name={t('health', 'heartRate')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bed Movement History Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('bedMovement', 'bedDataTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bedMovementHistory?.slice(-10) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="movementIntensity" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name={t('bedMovement', 'movementIntensity')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mobilityScore" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name={t('bedMovement', 'mobilityScore')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI Health Prediction */}
        <Card>
          <CardHeader>
            <CardTitle>{t('health', 'aiHealthPrediction')}</CardTitle>
            <p className="text-sm text-gray-500">
              {t('health', 'predictionDescription')}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={healthPredictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={t('health', 'predictedHeartRate')}
                />
                <Line 
                  type="monotone" 
                  dataKey="steps" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={t('health', 'predictedSteps')}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{t('health', 'personalizedHealthForecast')}</h4>
                <p className="text-sm text-blue-800">
                  {language === 'ko' ? 
                    `현재 건강 패턴 분석 결과, 심박수 ${healthData?.heartRate || 75}회/분, 체온 ${healthData?.bodyTemperature ? healthData.bodyTemperature.toFixed(1) : '36.5'}°C로 향후 7일간 안정적인 건강 상태가 예상됩니다. 침대 패턴과 바이탈 사인을 통한 개인화된 건강 관리 권장사항을 제공합니다.`
                    : `Based on current health pattern analysis with heart rate ${healthData?.heartRate || 75} bpm and body temperature ${healthData?.bodyTemperature ? healthData.bodyTemperature.toFixed(1) : '36.5'}°C, stable health status is expected for the next 7 days. Personalized health management recommendations are provided based on bed patterns and vital signs.`
                  }
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">{t('health', 'activityImprovement')}</h4>
                  <p className="text-sm text-green-700">
                    {language === 'ko' ? 
                      `현재 이동성 점수 ${bedMovementData?.mobilityScore || 85}점 기준, 일일 가벼운 스트레칭 15분과 침상 내 운동으로 근력 유지 효과를 높일 수 있습니다.`
                      : `With current mobility score of ${bedMovementData?.mobilityScore || 85} points, daily light stretching (15 min) and in-bed exercises can enhance strength maintenance.`
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">{t('health', 'sleepPattern')}</h4>
                  <p className="text-sm text-yellow-700">
                    {language === 'ko' ? 
                      `침대 분석 결과, 양질의 휴식을 위해 취침 전 30분 안정 시간을 확보하면 스트레스 지수 개선이 예상됩니다.`
                      : `Bed analysis suggests maintaining a 30-minute quiet time before sleep to improve stress index and sleep quality.`
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">{t('health', 'temperatureManagement')}</h4>
                  <p className="text-sm text-purple-700">
                    {language === 'ko' ? 
                      `현재 체온 ${healthData?.bodyTemperature ? healthData.bodyTemperature.toFixed(1) : '36.5'}°C - 정상 범위 유지 중입니다.`
                      : `Current body temperature ${healthData?.bodyTemperature ? healthData.bodyTemperature.toFixed(1) : '36.5'}°C - maintaining normal range.`
                    }
                  </p>
                </div>
                
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">{t('health', 'comprehensiveHealthEvaluation')}</h4>
                  <p className="text-sm text-red-700">
                    {t('health', 'overallHealthScore')} <span className="font-bold">
                      {Math.min(100, Math.max(60, 
                        (healthData?.heartRate && healthData.heartRate > 50 && healthData.heartRate < 100 ? 25 : 15) +
                        (healthData?.bodyTemperature && healthData.bodyTemperature > 36.0 && healthData.bodyTemperature < 37.5 ? 25 : 15) +
                        ((bedMovementData?.mobilityScore || 80) > 70 ? 25 : 15) +
                        (healthData?.stressLevel === 'low' ? 25 : healthData?.stressLevel === 'medium' ? 15 : 10)
                      ))}/100</span> ({healthData && bedMovementData ? t('health', 'good') : t('health', 'monitoringInProgress')})
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}