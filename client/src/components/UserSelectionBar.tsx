import { User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heart, Bed } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UserSelectionBarProps {
  selectedUser: User | null;
  healthStatus: string;
  bedMovementStatus: string;
  isInBed: boolean;
}

export function UserSelectionBar({ 
  selectedUser, 
  healthStatus, 
  bedMovementStatus, 
  isInBed 
}: UserSelectionBarProps) {
  const { t } = useLanguage();

  if (!selectedUser) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-center text-gray-500">
          {t('dashboard', 'selectUser')}
        </div>
      </Card>
    );
  }

  const translateStatus = (status: string): string => {
    switch (status) {
      case '정상': return t('dashboard', 'statusNormal');
      case '경고': return t('dashboard', 'statusWarning');
      case '위험': return t('dashboard', 'statusDanger');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '정상': return 'bg-health-green text-white';
      case '경고': return 'bg-health-yellow text-white';
      case '위험': return 'bg-health-red text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">{t('dashboard', 'selectedUser')}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
            <p className="text-xs text-gray-500">ID: {selectedUser.username.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(healthStatus)}>
            <Heart className="w-3 h-3 mr-1" />
            {translateStatus(healthStatus)}
          </Badge>
          
          <Badge className={getStatusColor(bedMovementStatus)}>
            <Bed className="w-3 h-3 mr-1" />
            {translateStatus(bedMovementStatus)}
          </Badge>
          
          <Badge className={isInBed ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
            <Bed className="w-3 h-3 mr-1" />
            {isInBed ? t('bedMovement', 'inBed') : t('bedMovement', 'outOfBed')}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
