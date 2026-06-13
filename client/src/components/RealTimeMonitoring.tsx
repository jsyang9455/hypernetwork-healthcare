import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RealTimeChart } from "./charts/RealTimeChart";
import { Heart, Droplets, Activity, Brain, Bed, ArrowUpDown, Thermometer, Clock, Wind } from "lucide-react";
import { HealthData, BedMovementData } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface RealTimeMonitoringProps {
  healthData: HealthData | null;
  bedMovementData: BedMovementData | null;
  healthHistory: number[];
  isInBed: boolean;
}

export function RealTimeMonitoring({ 
  healthData, 
  bedMovementData, 
  healthHistory, 
  isInBed 
}: RealTimeMonitoringProps) {
  const { t, language } = useLanguage();
  
  const getStressLevel = (level: string) => {
    switch (level) {
      case '낮음': return { value: 25, color: 'bg-health-green' };
      case '보통': return { value: 50, color: 'bg-health-yellow' };
      case '높음': return { value: 75, color: 'bg-health-red' };
      default: return { value: 0, color: 'bg-gray-500' };
    }
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp > 38.5) return '고열';
    if (temp > 37.5) return '발열';
    if (temp < 35.0) return '저체온';
    return '정상';
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Health Monitoring */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('health', 'realTimeHealth')}</h3>
          <Heart className="w-6 h-6 text-health-red animate-pulse-slow" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Heart Rate */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('health', 'heartRate')}</p>
                <p className="text-2xl font-bold text-health-red">
                  {healthData?.heartRate || 0}
                </p>
                <p className="text-xs text-gray-500">{t('health', 'bpm')}</p>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-health-red animate-pulse-slow" />
              </div>
            </div>

          </div>

          {/* Blood Pressure */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('health', 'bloodPressure')}</p>
                <p className="text-2xl font-bold text-health-blue">
                  {healthData ? `${healthData.bloodPressureSystolic}/${healthData.bloodPressureDiastolic}` : '0/0'}
                </p>
                <p className="text-xs text-gray-500">{t('health', 'mmHg')}</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Droplets className="w-6 h-6 text-health-blue" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Progress 
                value={healthData ? Math.min(100, (healthData.bloodPressureSystolic / 160) * 100) : 0} 
                className="flex-1"
              />
              <span className="ml-2 text-xs text-gray-500">{t('common', 'normal')}</span>
            </div>
          </div>

          {/* Body Temperature */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('health', 'bodyTemperature')}</p>
                <p className="text-2xl font-bold text-red-600">
                  {healthData?.bodyTemperature?.toFixed(1) || '0.0'}°C
                </p>
                <p className="text-xs text-gray-500">{t('health', 'bodyTemperature')}</p>
              </div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Thermometer className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Progress 
                value={healthData ? Math.min(100, Math.max(0, ((healthData.bodyTemperature - 35) / 4) * 100)) : 0} 
                className="flex-1"
              />
              <span className="ml-2 text-xs text-gray-500">
                {healthData ? getTemperatureStatus(healthData.bodyTemperature) : t('common', 'normal')}
              </span>
            </div>
          </div>

          {/* Respiratory Rate */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('health', 'respiratoryRate')}</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="text-respiratory-rate-realtime">
                  {healthData?.respiratoryRate || 0}
                </p>
                <p className="text-xs text-gray-500">{t('health', 'bpm')}</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Wind className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Progress 
                value={healthData ? Math.min(100, Math.max(0, ((healthData.respiratoryRate - 8) / 20) * 100)) : 0} 
                className="flex-1"
              />
              <span className="ml-2 text-xs text-gray-500">
                {healthData && healthData.respiratoryRate > 20 ? t('health', 'tachypneaWarning') : 
                 healthData && healthData.respiratoryRate < 12 ? t('health', 'bradypneaWarning') : t('common', 'normal')}
              </span>
            </div>
          </div>

          {/* Steps - Always visible */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('health', 'steps')}</p>
                <p className="text-2xl font-bold text-health-green" data-testid="text-steps-realtime">
                  {healthData?.steps?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500">steps</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-health-green" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Progress 
                value={healthData ? Math.min(100, (healthData.steps / 10000) * 100) : 0} 
                className="flex-1"
              />
              <span className="ml-2 text-xs text-gray-500">
                {healthData ? Math.round((healthData.steps / 10000) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Stress Level */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('health', 'stressLevel')}</p>
                <p className="text-2xl font-bold text-health-yellow">
                  {healthData?.stressLevel || t('health', 'low')}
                </p>
                <p className="text-xs text-gray-500">{t('health', 'level')}</p>
              </div>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-health-yellow" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Progress 
                value={healthData ? getStressLevel(healthData.stressLevel).value : 0} 
                className="flex-1"
              />
              <span className="ml-2 text-xs text-gray-500">{t('health', 'good')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Bed Movement Monitoring */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('bedMovement', 'realTimeBedMovement')}</h3>
          <Bed className="w-6 h-6 text-health-blue" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Movement Intensity */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('bedMovement', 'movementIntensity')}</p>
                <p className="text-2xl font-bold text-health-blue">
                  {bedMovementData?.movementIntensity || 0}
                </p>
                <p className="text-xs text-gray-500">%</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowUpDown className="w-6 h-6 text-health-blue" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Progress 
                value={bedMovementData?.movementIntensity || 0} 
                className="flex-1"
              />
              <span className="ml-2 text-xs text-gray-500">{t('common', 'normal')}</span>
            </div>
          </div>

          {/* Mobility Score */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('bedMovement', 'mobilityScore')}</p>
                <p className="text-2xl font-bold text-health-green">
                  {bedMovementData?.mobilityScore || 0}
                </p>
                <p className="text-xs text-gray-500">{t('bedMovement', 'points')}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-health-green" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Progress 
                value={bedMovementData?.mobilityScore || 0} 
                className="flex-1"
              />
              <span className="ml-2 text-xs text-gray-500">{t('bedMovement', 'excellent')}</span>
            </div>
          </div>

          {/* Current Position */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('bedMovement', 'currentPosition')}</p>
                <p className="text-2xl font-bold text-purple-600">
                  {bedMovementData?.position || t('bedMovement', 'unknown')}
                </p>
                <p className="text-xs text-gray-500">Position</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Bed className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Badge variant="outline" className="text-xs">
                {isInBed ? t('bedMovement', 'inBed') : t('bedMovement', 'outOfBed')}
              </Badge>
            </div>
          </div>

          {/* Last Movement */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('bedMovement', 'lastMovement')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {bedMovementData?.timestamp ? new Date(bedMovementData.timestamp).toLocaleTimeString() : (language === 'ko' ? '없음' : 'None')}
                </p>
                <p className="text-xs text-gray-500">Time</p>
              </div>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center">
              <Badge variant="outline" className="text-xs">
                {bedMovementData?.timestamp ? t('bedMovement', 'recorded') : t('bedMovement', 'noRecord')}
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
