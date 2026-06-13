import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Network, Heart, Thermometer, User, Bed, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserType, HealthData, BedMovementData } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/i18n";

interface UserStatus {
  user: UserType;
  healthData: HealthData | null;
  bedMovementData: BedMovementData | null;
}

export default function StatusDashboard() {
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [, setLocation] = useLocation();
  const { t, language, setLanguage } = useLanguage();

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    const loadUserStatuses = async () => {
      const statusPromises = users.map(async (user) => {
        try {
          const [healthResponse, bedMovementResponse] = await Promise.all([
            fetch(`/api/users/${user.id}/health/latest`),
            fetch(`/api/users/${user.id}/bedmovement/latest`)
          ]);

          const healthData = healthResponse.ok ? await healthResponse.json() : null;
          const bedMovementData = bedMovementResponse.ok ? await bedMovementResponse.json() : null;

          return {
            user,
            healthData,
            bedMovementData
          };
        } catch (error) {
          return {
            user,
            healthData: null,
            bedMovementData: null
          };
        }
      });

      const statuses = await Promise.all(statusPromises);
      setUserStatuses(statuses);
    };

    if (users.length > 0) {
      loadUserStatuses();
      
      // 30초마다 업데이트
      const interval = setInterval(loadUserStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [users]);

  const getHealthStatus = (healthData: HealthData | null) => {
    if (!healthData) return { statusKey: "noData", statusCategory: "common", color: "gray" };
    
    // 체온 기준 우선 판단
    if (healthData.bodyTemperature >= 38.0) return { statusKey: "highFeverDanger", statusCategory: "health", color: "red" };
    if (healthData.bodyTemperature >= 37.5) return { statusKey: "feverWarning", statusCategory: "health", color: "orange" };
    if (healthData.bodyTemperature < 35.0) return { statusKey: "hypothermiaDanger", statusCategory: "health", color: "blue" };
    
    // 심박수 기준 판단
    if (healthData.heartRate > 100) return { statusKey: "tachycardiaDanger", statusCategory: "health", color: "red" };
    if (healthData.heartRate > 80) return { statusKey: "warning", statusCategory: "common", color: "orange" };
    if (healthData.heartRate < 50) return { statusKey: "bradycardiaWarning", statusCategory: "health", color: "orange" };
    
    // 호흡수 기준 판단
    if (healthData.respiratoryRate > 20) return { statusKey: "tachypneaWarning", statusCategory: "health", color: "orange" };
    if (healthData.respiratoryRate < 12) return { statusKey: "bradypneaWarning", statusCategory: "health", color: "orange" };
    
    // 혈압 기준 판단
    if (healthData.bloodPressureSystolic > 140 || healthData.bloodPressureDiastolic > 90) {
      return { statusKey: "hypertensionWarning", statusCategory: "health", color: "orange" };
    }
    
    return { statusKey: "normal", statusCategory: "common", color: "green" };
  };

  const getBedPositionIcon = (position: string) => {
    const positionKey = position === "누움" ? "lying" : position === "앉음" ? "sitting" : position === "서있음" ? "standing" : "unknown";
    
    switch (position) {
      case "누움":
        return (
          <div className="flex flex-col items-center">
            <svg width="100" height="75" viewBox="0 0 100 75" className="text-blue-500 drop-shadow-md">
              {/* Bed frame with rounded corners */}
              <rect x="10" y="30" width="80" height="18" fill="currentColor" rx="5" stroke="#E5E7EB" strokeWidth="1.5" />
              {/* Pillow */}
              <ellipse cx="22" cy="39" rx="10" ry="5" fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="1.5" />
              {/* Person head */}
              <circle cx="27" cy="39" r="6" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5" />
              {/* Person body */}
              <rect x="35" y="34" width="25" height="10" fill="#8B5CF6" rx="3" stroke="#7C3AED" strokeWidth="1.5" />
              {/* Blanket detail */}
              <path d="M38 36 Q45 34 52 36 Q58 38 62 36" stroke="#A855F7" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-lg mt-3 font-bold text-gray-800">{t('bedMovement', 'lying')}</span>
          </div>
        );
      case "앉음":
        return (
          <div className="flex flex-col items-center">
            <svg width="100" height="75" viewBox="0 0 100 75" className="text-blue-500 drop-shadow-md">
              {/* Bed frame */}
              <rect x="10" y="44" width="80" height="18" fill="currentColor" rx="5" stroke="#E5E7EB" strokeWidth="1.5" />
              {/* Person head */}
              <circle cx="50" cy="30" r="6" fill="#22C55E" stroke="#16A34A" strokeWidth="1.5" />
              {/* Person torso */}
              <rect x="44" y="36" width="12" height="18" fill="#22C55E" rx="3" stroke="#16A34A" strokeWidth="1.5" />
              {/* Arms */}
              <ellipse cx="37" cy="42" rx="4" ry="7" fill="#22C55E" stroke="#16A34A" strokeWidth="1.5" />
              <ellipse cx="63" cy="42" rx="4" ry="7" fill="#22C55E" stroke="#16A34A" strokeWidth="1.5" />
              {/* Support hands on bed */}
              <circle cx="35" cy="51" r="2.5" fill="#16A34A" />
              <circle cx="65" cy="51" r="2.5" fill="#16A34A" />
            </svg>
            <span className="text-lg mt-3 font-bold text-gray-800">{t('bedMovement', 'sitting')}</span>
          </div>
        );
      case "서있음":
        return (
          <div className="flex flex-col items-center">
            <svg width="100" height="75" viewBox="0 0 100 75" className="text-blue-500 drop-shadow-md">
              {/* Bed frame */}
              <rect x="10" y="56" width="80" height="15" fill="currentColor" rx="5" stroke="#E5E7EB" strokeWidth="1.5" />
              {/* Person head */}
              <circle cx="50" cy="22" r="6" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              {/* Person torso */}
              <rect x="44" y="28" width="12" height="22" fill="#F59E0B" rx="3" stroke="#D97706" strokeWidth="1.5" />
              {/* Arms */}
              <ellipse cx="36" cy="36" rx="4" ry="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <ellipse cx="64" cy="36" rx="4" ry="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              {/* Legs */}
              <rect x="45" y="50" width="4" height="10" fill="#F59E0B" rx="1.5" stroke="#D97706" strokeWidth="1.5" />
              <rect x="51" y="50" width="4" height="10" fill="#F59E0B" rx="1.5" stroke="#D97706" strokeWidth="1.5" />
              {/* Feet */}
              <ellipse cx="47" cy="62" rx="2.5" ry="1.5" fill="#D97706" />
              <ellipse cx="53" cy="62" rx="2.5" ry="1.5" fill="#D97706" />
            </svg>
            <span className="text-lg mt-3 font-bold text-gray-800">{t('bedMovement', 'standing')}</span>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center">
            <div className="w-25 h-19 flex items-center justify-center bg-gray-100 rounded-lg border">
              <Bed className="w-12 h-12 text-gray-400" />
            </div>
            <span className="text-lg mt-3 font-bold text-gray-600">{t('bedMovement', 'unknown')}</span>
          </div>
        );
    }
  };

  const getHealthStatusColor = (color: string) => {
    switch (color) {
      case "red": return "bg-red-100 text-red-800 border-red-200";
      case "orange": return "bg-orange-100 text-orange-800 border-orange-200";
      case "green": return "bg-green-100 text-green-800 border-green-200";
      case "blue": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // 상태별 통계
  const statusCounts = userStatuses.reduce((acc, { healthData, bedMovementData }) => {
    const healthStatus = getHealthStatus(healthData);
    const position = bedMovementData?.position || "unknown";
    
    // 건강 상태 카운트
    if (healthStatus.statusKey === "highFeverDanger" || healthStatus.statusKey === "tachycardiaDanger") {
      acc.danger++;
    } else if (healthStatus.statusKey === "warning" || healthStatus.statusKey.includes("Warning")) {
      acc.warning++;
    } else if (healthStatus.statusKey === "normal") {
      acc.normal++;
    }
    
    // 침대 상태 카운트
    const positionKey = position === "누움" ? "lying" : position === "앉음" ? "sitting" : position === "서있음" ? "standing" : "unknown";
    if (positionKey === "lying") acc.lying++;
    else if (positionKey === "sitting") acc.sitting++;
    else if (positionKey === "standing") acc.standing++;
    
    return acc;
  }, { danger: 0, warning: 0, normal: 0, lying: 0, sitting: 0, standing: 0 });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('member', 'backToDashboard')}
          </Button>
          
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <Button
              variant={language === 'ko' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('ko')}
              className="text-xs"
            >
              한국어
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="text-xs"
            >
              English
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Network className="w-8 h-8 text-health-blue" />
          <h1 className="text-3xl font-bold">{t('status', 'dashboard')}</h1>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        <Card className="bg-red-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.danger}</div>
            <div className="text-sm">{t('status', 'dangerCount')}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.warning}</div>
            <div className="text-sm">{t('status', 'warningCount')}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.normal}</div>
            <div className="text-sm">{t('status', 'normalCount')}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.lying}</div>
            <div className="text-sm">{t('status', 'lyingCount')}</div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.sitting}</div>
            <div className="text-sm">{t('status', 'sittingCount')}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500 text-white">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.standing}</div>
            <div className="text-sm">{t('status', 'standingCount')}</div>
          </CardContent>
        </Card>
      </div>

      {/* 환자 상태 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userStatuses.map(({ user, healthData, bedMovementData }) => {
          const healthStatus = getHealthStatus(healthData);
          
          return (
            <Card 
              key={user.id} 
              className="border-2 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300" 
              onClick={() => setLocation(`/member/${user.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{user.bedLocation || `${user.id}${t('member', 'room')}`}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {user.gender} {user.age}{t('member', 'age')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.name}</span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* 침대 상태 */}
                <div className="flex justify-center mb-8 py-3">
                  {getBedPositionIcon(bedMovementData?.position || "unknown")}
                </div>
                
                {/* 건강 상태 */}
                <div className="space-y-2">
                  <Badge 
                    variant="outline" 
                    className={`w-full justify-center py-2 ${getHealthStatusColor(healthStatus.color)}`}
                  >
                    {healthStatus.statusCategory === 'common' 
                      ? t('common', healthStatus.statusKey as keyof typeof translations.common)
                      : t('health', healthStatus.statusKey as keyof typeof translations.health)
                    }
                  </Badge>
                  
                  {healthData && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-500" />
                          <span className="font-bold text-gray-900">{healthData.heartRate} {t('health', 'bpm')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-5 h-5 text-blue-500" />
                          <span className="font-bold text-gray-900">{healthData.bodyTemperature.toFixed(1)}°C</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-lg font-bold text-gray-900">{healthData.bloodPressureSystolic}/{healthData.bloodPressureDiastolic} {t('health', 'mmHg')}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 추가 정보 */}
                {bedMovementData && (
                  <div className="mt-4 pt-3 border-t text-sm text-muted-foreground">
                    <div className="font-semibold">{t('bedMovement', 'movementIntensity')}: {bedMovementData.movementIntensity}%</div>
                    <div className="font-semibold">{t('bedMovement', 'mobilityScore')}: {bedMovementData.mobilityScore}/100</div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {userStatuses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">{t('health', 'loadingHealthData')}</div>
        </div>
      )}
    </div>
  );
}