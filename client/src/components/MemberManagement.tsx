import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Bell, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import { User, HealthData, BedMovementData } from "@shared/schema";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MemberManagementProps {
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  onViewProfile: (user: User) => void;
  getUserHealthData: (userId: number) => HealthData | null;
  getUserBedMovementData: (userId: number) => BedMovementData | null;
}

export function MemberManagement({ 
  users, 
  selectedUser, 
  onUserSelect, 
  onViewProfile,
  getUserHealthData,
  getUserBedMovementData
}: MemberManagementProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const getHealthStatus = (userId: number) => {
    const healthData = getUserHealthData(userId);
    if (!healthData) return '정상';
    
    // 위험 상태 체크
    if (healthData.heartRate > 100 || 
        healthData.bloodPressureSystolic > 140 ||
        healthData.bodyTemperature >= 38.0 ||
        healthData.bodyTemperature < 35.0) {
      return '위험';
    }
    
    // 경고 상태 체크
    if (healthData.heartRate > 90 || 
        healthData.bloodPressureSystolic > 130 ||
        healthData.bodyTemperature >= 37.5 ||
        healthData.respiratoryRate > 20 ||
        healthData.respiratoryRate < 12) {
      return '경고';
    }
    
    return '정상';
  };

  const getBedMovementStatus = (userId: number) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case '정상': return 'bg-health-green text-white';
      case '경고': return 'bg-health-yellow text-white';
      case '위험': return 'bg-health-red text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const healthStatus = getHealthStatus(user.id);
    const bedMovementStatus = getBedMovementStatus(user.id);
    
    if (statusFilter === 'normal') return matchesSearch && healthStatus === '정상' && bedMovementStatus === '정상';
    if (statusFilter === 'warning') return matchesSearch && (healthStatus === '경고' || bedMovementStatus === '경고');
    if (statusFilter === 'danger') return matchesSearch && (healthStatus === '위험' || bedMovementStatus === '위험');
    
    return matchesSearch;
  });

  const getLastUpdate = (userId: number) => {
    const healthData = getUserHealthData(userId);
    if (!healthData || !healthData.timestamp) return t('member', 'noData');
    
    const now = new Date();
    const diff = now.getTime() - healthData.timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t('member', 'justNow');
    if (minutes < 60) return `${minutes}${t('member', 'minutesAgo')}`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}${t('member', 'hoursAgo')}`;
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case '정상': return t('member', 'normalStatus');
      case '경고': return t('member', 'warningStatus');
      case '위험': return t('member', 'dangerStatus');
      default: return status;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t('member', 'management')}</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('member', 'searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('member', 'allStatus')}</SelectItem>
              <SelectItem value="normal">{t('member', 'normalStatus')}</SelectItem>
              <SelectItem value="warning">{t('member', 'warningStatus')}</SelectItem>
              <SelectItem value="danger">{t('member', 'dangerStatus')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('member', 'tableUser')}</TableHead>
              <TableHead>{t('member', 'tableHealthStatus')}</TableHead>
              <TableHead>{t('member', 'tableBedMovement')}</TableHead>
              <TableHead>{t('member', 'tableBMI')}</TableHead>
              <TableHead>{t('member', 'tableMedicalConditions')}</TableHead>
              <TableHead>{t('member', 'tableLastUpdate')}</TableHead>
              <TableHead>{t('member', 'tableActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const healthStatus = getHealthStatus(user.id);
              const bedMovementStatus = getBedMovementStatus(user.id);
              const healthData = getUserHealthData(user.id);
              const bedMovementData = getUserBedMovementData(user.id);
              const isSelected = selectedUser?.id === user.id;

              return (
                <TableRow 
                  key={user.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    isSelected ? 'bg-blue-50 border-l-4 border-health-blue' : ''
                  }`}
                  onClick={() => onUserSelect(user)}
                >
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.username.toUpperCase()}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {user.bedLocation || t('member', 'noBedroomInfo')}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(healthStatus)}>
                      {getStatusTranslation(healthStatus)}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('member', 'heartRate')} {healthData?.heartRate || 0} {t('member', 'beatsPerMinute')}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getStatusColor(bedMovementStatus)}>
                      {getStatusTranslation(bedMovementStatus)}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {bedMovementData?.isInBed ? `${t('member', 'bedMovement')} ${bedMovementData.movementIntensity}${t('member', 'percentage')}` : t('member', 'outOfBedStatus')}
                    </div>
                  </TableCell>

                  <TableCell>
                    {user.height && user.weight ? (
                      <div>
                        <div className="text-sm font-medium">
                          {calculateBMI(user.height, user.weight)}
                        </div>
                        <div className={`text-xs ${getBMIStatus(calculateBMI(user.height, user.weight)).color}`}>
                          {getBMIStatus(calculateBMI(user.height, user.weight)).status}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {t('member', 'noInfo')}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.medicalConditions && user.medicalConditions.length > 0 ? (
                        user.medicalConditions.slice(0, 2).map((condition, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {condition}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs">{t('member', 'none')}</Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm text-gray-500">
                    {getLastUpdate(user.id)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Link href={`/member/${user.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <UserIcon className="h-4 w-4 mr-1" />
                          {t('member', 'viewDetails')}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile(user);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle alert functionality
                        }}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
