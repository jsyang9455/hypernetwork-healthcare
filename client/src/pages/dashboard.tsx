import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Heart, Bell, LogOut, Network, BarChart3, Building2, Users, User as UserIcon, Globe } from "lucide-react";
import { SensorStatus } from "@/components/SensorStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { UserSelectionBar } from "@/components/UserSelectionBar";
import { RealTimeMonitoring } from "@/components/RealTimeMonitoring";
import { WeeklyAnalytics } from "@/components/WeeklyAnalytics";
import { MemberManagement } from "@/components/MemberManagement";
import { NotificationSidebar } from "@/components/NotificationSidebar";
import { UserProfileModal } from "@/components/modals/UserProfileModal";
import { User, HealthData, BedMovementData, Alert } from "@shared/schema";

export default function Dashboard() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [userProfileModal, setUserProfileModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null
  });
  const [notificationSidebar, setNotificationSidebar] = useState(false);
  const [realTimeData, setRealTimeData] = useState<Map<number, { health: HealthData; bedMovement: BedMovementData }>>(new Map());
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const { toast } = useToast();
  const { lastMessage, connectionStatus } = useWebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch unread alerts count
  const { data: alertsCount } = useQuery({
    queryKey: ['/api/alerts/unread/count'],
    refetchInterval: 5000,
  });

  // Fetch alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    refetchInterval: 5000,
  });

  // Fetch weekly stats for selected user
  const { data: healthStats } = useQuery({
    queryKey: ['/api/users', selectedUser?.id, 'health', 'weekly'],
    enabled: !!selectedUser,
  });

  const { data: bedMovementStats } = useQuery({
    queryKey: ['/api/users', selectedUser?.id, 'bedmovement', 'weekly'],
    enabled: !!selectedUser,
  });

  // Update unread alerts count
  useEffect(() => {
    if (alertsCount && typeof alertsCount === 'object' && 'count' in alertsCount) {
      setUnreadAlerts((alertsCount as any).count);
    }
  }, [alertsCount]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'real-time-update') {
      const { userId, healthData } = lastMessage;
      const bedMovementData = (lastMessage as any).bedMovementData;
      
      setRealTimeData(prev => {
        const newData = new Map(prev);
        if (userId && healthData && bedMovementData) {
          newData.set(userId, { 
            health: { ...healthData, timestamp: new Date() },
            bedMovement: { ...bedMovementData, timestamp: new Date() }
          });
        }
        return newData;
      });

      // Update heart rate history for selected user
      if (selectedUser && userId === selectedUser.id) {
        setHeartRateHistory(prev => {
          const newHistory = [...prev, healthData?.heartRate ?? 0];
          return newHistory.slice(-20); // Keep last 20 values
        });
      }
    }
  }, [lastMessage, selectedUser]);

  // Removed alert popup logic - now using sidebar

  // Auto-select first user if none selected
  useEffect(() => {
    if (users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setHeartRateHistory([]); // Reset history for new user
  };

  const handleViewProfile = (user: User) => {
    setUserProfileModal({ isOpen: true, user });
  };

  const getUserHealthData = (userId: number): HealthData | null => {
    return realTimeData.get(userId)?.health || null;
  };

  const getUserBedMovementData = (userId: number): BedMovementData | null => {
    return realTimeData.get(userId)?.bedMovement || null;
  };

  const getHealthStatus = (userId: number): string => {
    const healthData = getUserHealthData(userId);
    if (!healthData) return '정상';
    
    // 체온 기준 우선 판단
    if (healthData.bodyTemperature > 38.5) return '고열 위험';
    if (healthData.bodyTemperature > 37.5) return '발열 주의';
    if (healthData.bodyTemperature < 35.0) return '저체온 위험';
    
    // 심박수 기준 판단
    if (healthData.heartRate > 100) return '빈맥 위험';
    if (healthData.heartRate < 50) return '서맥 주의';
    if (healthData.heartRate > 80) return '주의';
    
    // 호흡수 기준 판단
    if (healthData.respiratoryRate > 20) return '빈호흡 주의';
    if (healthData.respiratoryRate < 12) return '서호흡 주의';
    
    // 혈압 기준 판단
    if (healthData.bloodPressureSystolic > 140 || healthData.bloodPressureDiastolic > 90) return '고혈압 주의';
    if (healthData.bloodPressureSystolic > 120) return '주의';
    
    return '정상';
  };

  const getBedMovementStatus = (userId: number): string => {
    const bedMovementData = getUserBedMovementData(userId);
    if (!bedMovementData) return '정상';
    
    if (bedMovementData.movementIntensity < 25 || bedMovementData.mobilityScore < 75) {
      return '위험';
    }
    if (bedMovementData.movementIntensity < 35 || bedMovementData.mobilityScore < 85) {
      return '경고';
    }
    return '정상';
  };

  // Helper functions for floor and room management
  const getRoomsForFloor = (floor: number): string[] => {
    const rooms: string[] = [];
    for (let i = 1; i <= 10; i++) {
      rooms.push(`${floor}0${i}호`);
    }
    return rooms;
  };

  const getUsersInRoom = (room: string): User[] => {
    return users.filter(user => user.bedLocation === room);
  };

  const getUsersOnFloor = (floor: number): User[] => {
    const floorPrefix = `${floor}0`;
    return users.filter(user => user.bedLocation?.startsWith(floorPrefix));
  };

  const selectedUserHealthData = selectedUser ? getUserHealthData(selectedUser.id) : null;
  const selectedUserBedMovementData = selectedUser ? getUserBedMovementData(selectedUser.id) : null;
  const selectedUserHealthStatus = selectedUser ? getHealthStatus(selectedUser.id) : '정상';
  const selectedUserBedMovementStatus = selectedUser ? getBedMovementStatus(selectedUser.id) : '정상';
  const isSelectedUserInBed = selectedUserBedMovementData?.isInBed || false;

  // Initialize room selection with first room of first floor
  useEffect(() => {
    if (!selectedRoom) {
      setSelectedRoom("101호");
    }
  }, [selectedRoom]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <Network className="w-8 h-8 text-health-blue mr-3" />
            <h1 className="text-xl font-bold text-gray-900">{t('dashboard', 'title')}</h1>
          </div>
          <div className="flex items-center space-x-2 mb-3">
            <img 
              className="h-8 w-8 rounded-full" 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64" 
              alt={language === 'ko' ? '관리자 프로필' : 'Admin Profile'}
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700">{user?.name || (language === 'ko' ? '관리자' : 'Admin')}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4 text-gray-500" />
            <Button
              variant={language === 'ko' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('ko')}
              className="text-xs h-7 px-2"
            >
              한국어
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="text-xs h-7 px-2"
            >
              English
            </Button>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <SensorStatus />
          </div>
        </div>

        {/* Floor Selection */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            {t('dashboard', 'selectFloor')}
          </h3>
          <div className="space-y-2">
            {[1, 2, 3].map(floor => (
              <Button
                key={floor}
                variant={selectedFloor === floor ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedFloor(floor);
                  setSelectedRoom(`${floor}01호`);
                  setSelectedUser(null);
                }}
                className="w-full justify-start"
              >
                {floor}{t('dashboard', 'floor')} ({getUsersOnFloor(floor).length}{t('dashboard', 'people')})
              </Button>
            ))}
          </div>
        </div>

        {/* Room Selection */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('dashboard', 'selectRoom')}</h3>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {getRoomsForFloor(selectedFloor).map(room => {
              const roomUsers = getUsersInRoom(room);
              return (
                <Button
                  key={room}
                  variant={selectedRoom === room ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedRoom(room);
                    setSelectedUser(roomUsers[0] || null);
                  }}
                  className="text-xs"
                >
                  {room}
                  {roomUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {roomUsers.length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Room Members */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            {selectedRoom} 회원 목록
          </h3>
          <div className="space-y-2">
            {getUsersInRoom(selectedRoom).map(user => {
              const healthStatus = getHealthStatus(user.id);
              const isSelected = selectedUser?.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.gender} {user.age}세</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs mt-1 ${
                        healthStatus.includes('위험') ? 'border-red-300 text-red-600 bg-red-50' :
                        healthStatus.includes('주의') ? 'border-orange-300 text-orange-600 bg-orange-50' :
                        'border-green-300 text-green-600 bg-green-50'
                      }`}
                    >
                      {healthStatus}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {getUsersInRoom(selectedRoom).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">입주자가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedRoom} {t('dashboard', 'adminDashboard')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('dashboard', 'selectedMember')}: {selectedUser?.name || t('dashboard', 'selectMember')}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/status-dashboard')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  {t('dashboard', 'statusDashboard')}
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotificationSidebar(true)}
                    className="relative"
                  >
                    <Bell className="w-6 h-6 text-gray-500" />
                    {unreadAlerts > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-health-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadAlerts}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 px-6 py-6">
          {/* Connection Status */}
          {connectionStatus !== 'connected' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {t('dashboard', 'connectionStatus')}: {connectionStatus === 'connecting' ? t('dashboard', 'connecting') : t('dashboard', 'disconnected')}
            </p>
          </div>
        )}

        {/* User Selection Bar */}
        <UserSelectionBar
          selectedUser={selectedUser}
          healthStatus={selectedUserHealthStatus}
          bedMovementStatus={selectedUserBedMovementStatus}
          isInBed={isSelectedUserInBed}
        />

        {/* Real-time Monitoring */}
        <RealTimeMonitoring
          healthData={selectedUserHealthData}
          bedMovementData={selectedUserBedMovementData}
          healthHistory={heartRateHistory}
          isInBed={isSelectedUserInBed}
        />

        {/* Weekly Analytics */}
        <WeeklyAnalytics
          healthStats={healthStats}
          bedMovementStats={bedMovementStats}
        />

        {/* Member Management */}
        {selectedUser && (
          <MemberManagement
            users={getUsersInRoom(selectedRoom)}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            onViewProfile={handleViewProfile}
            getUserHealthData={getUserHealthData}
            getUserBedMovementData={getUserBedMovementData}
          />
        )}
        </div>
      </div>

      {/* Notification Sidebar */}
      <NotificationSidebar
        isOpen={notificationSidebar}
        onClose={() => setNotificationSidebar(false)}
      />

      {/* Modals */}
      <UserProfileModal
        isOpen={userProfileModal.isOpen}
        onClose={() => setUserProfileModal({ isOpen: false, user: null })}
        user={userProfileModal.user}
      />
    </div>
  );
}
