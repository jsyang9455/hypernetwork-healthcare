import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, AlertTriangle, Info, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDetailModal } from "@/components/modals/AlertDetailModal";
import { Alert } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface NotificationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSidebar({ isOpen, onClose }: NotificationSidebarProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const { t } = useLanguage();
  
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    refetchInterval: 5000,
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/alerts/unread/count'],
    refetchInterval: 5000,
  });
  const unreadCount = unreadCountData?.count ?? 0;

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return <Info className="w-4 h-4 text-yellow-500" />;
  };

  const getAlertColor = (type: string, severity: string) => {
    if (severity === 'critical') {
      return 'border-l-red-500 bg-red-50';
    }
    return 'border-l-yellow-500 bg-yellow-50';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t('member', 'justNow');
    if (minutes < 60) return `${minutes}${t('member', 'minutesAgo')}`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}${t('member', 'hoursAgo')}`;
    return date.toLocaleDateString();
  };

  const getAlertTitle = (type: string, severity: string) => {
    if (type === 'health') {
      return severity === 'critical' ? t('alerts', 'healthCriticalAlert') : t('alerts', 'healthWarningAlert');
    } else {
      return severity === 'critical' ? t('alerts', 'vehicleCriticalAlert') : t('alerts', 'vehicleWarningAlert');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t('alerts', 'notifications')}</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 h-full">
          <div className="p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{t('alerts', 'noNotifications')}</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${getAlertColor(alert.type, alert.severity)}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type, alert.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {getAlertTitle(alert.type, alert.severity)}
                        </h3>
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {alert.severity === 'critical' ? t('alerts', 'danger') : t('alerts', 'caution')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timestamp ? formatTime(String(alert.timestamp)) : ''}</span>
                        <span>•</span>
                        <span>{alert.type === 'health' ? t('alerts', 'health') : t('alerts', 'vehicle')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Alert Detail Modal */}
      <AlertDetailModal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        alert={selectedAlert}
      />
    </div>
  );
}