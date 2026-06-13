import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeeklyAnalyticsProps {
  healthStats: any;
  bedMovementStats: any;
}

export function WeeklyAnalytics({ healthStats, bedMovementStats }: WeeklyAnalyticsProps) {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7');
  const [refreshKey, setRefreshKey] = useState(0);

  const generateMiniChart = (color: string, values: number[]) => (
    <div className="mt-4 h-16 flex items-end space-x-1">
      {values.map((value, index) => (
        <div
          key={index}
          className={`w-4 ${color} rounded-t`}
          style={{ height: `${value}%` }}
        />
      ))}
    </div>
  );

  const handlePeriodChange = (period: '7' | '30') => {
    setSelectedPeriod(period);
    setRefreshKey(prev => prev + 1); // Force re-render
  };

  // Generate random data based on period and refresh key
  const generateRandomData = (base: number, variance: number) => {
    return Math.floor(base + (Math.random() - 0.5) * variance + refreshKey * 2);
  };

  const generateRandomChartData = () => {
    const length = selectedPeriod === '7' ? 7 : 30;
    return Array.from({ length }, () => Math.floor(Math.random() * 100));
  };

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t('analytics', 'weeklyStats')}</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant={selectedPeriod === '7' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('7')}
          >
            7일
          </Button>
          <Button 
            variant={selectedPeriod === '30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('30')}
          >
            30일
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Trends */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">{t('health', 'realTimeHealth')}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('analytics', 'avgHeartRate')}</span>
              <span className="text-sm font-medium text-health-red">
                {generateRandomData(74, 20)} {t('health', 'bpm')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('analytics', 'avgBloodPressure')}</span>
              <span className="text-sm font-medium text-health-blue">
                {generateRandomData(118, 15)}/{generateRandomData(76, 10)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('analytics', 'avgTemperature')}</span>
              <span className="text-sm font-medium text-red-600">
                {(36.0 + (generateRandomData(15, 30) / 10)).toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('health', 'todaysSteps')}</span>
              <span className="text-sm font-medium text-health-green">
                {generateRandomData(8420, 2000).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('health', 'stressLevel')}</span>
              <span className="text-sm font-medium text-health-yellow">
                {[t('health', 'low'), t('health', 'medium'), t('health', 'high')][generateRandomData(0, 2) % 3]}
              </span>
            </div>
          </div>
          {generateMiniChart('bg-health-red', generateRandomChartData())}
        </div>

        {/* Bed Movement Patterns */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">{t('bedMovement', 'realTimeBedMovement')}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('analytics', 'avgMovement')}</span>
              <span className="text-sm font-medium text-health-blue">
                {generateRandomData(58, 25)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('analytics', 'avgMobility')}</span>
              <span className="text-sm font-medium text-health-green">
                {generateRandomData(82, 15)}점
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('bedMovement', 'outOfBed')}</span>
              <span className="text-sm font-medium text-health-yellow">{generateRandomData(4, 3)}시간</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('health', 'realTimeHealth')}</span>
              <span className="text-sm font-medium text-purple-600">
                {generateRandomData(87, 15)}점
              </span>
            </div>
          </div>
          {generateMiniChart('bg-health-blue', generateRandomChartData())}
        </div>

        {/* Stress Index */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">{t('health', 'stressLevel')}</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('health', 'stressLevel')}</span>
              <span className="text-sm font-medium text-health-yellow">
                {[t('health', 'low'), t('health', 'medium'), t('health', 'high')][generateRandomData(0, 2) % 3]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('health', 'high')}</span>
              <span className="text-sm font-medium text-health-red">
                {[t('health', 'medium'), t('health', 'high'), t('health', 'high')][generateRandomData(0, 2) % 3]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('alerts', 'warning')}</span>
              <span className="text-sm font-medium text-health-green">{generateRandomData(5, 8)}회</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('health', 'stressLevel')}</span>
              <span className="text-sm font-medium text-health-blue">{generateRandomData(12, 10)}분</span>
            </div>
          </div>
          {generateMiniChart('bg-health-yellow', generateRandomChartData())}
        </div>
      </div>
    </Card>
  );
}
