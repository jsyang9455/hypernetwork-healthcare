import { AlertTriangle, Info, Clock, User, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert } from "@shared/schema";

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
}

export function AlertDetailModal({ isOpen, onClose, alert }: AlertDetailModalProps) {
  const { toast } = useToast();
  
  if (!alert) return null;

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical') {
      return <AlertTriangle className="w-8 h-8 text-red-500" />;
    }
    return <Info className="w-8 h-8 text-yellow-500" />;
  };

  const getAlertTitle = (type: string, severity: string) => {
    if (type === 'health') {
      return severity === 'critical' ? '건강 위험 알림' : '건강 주의 알림';
    } else {
      return severity === 'critical' ? '차량 위험 알림' : '차량 주의 알림';
    }
  };

  const getAlertColor = (severity: string) => {
    return severity === 'critical' ? 'border-red-500' : 'border-yellow-500';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionButtons = () => {
    if (alert.type === 'health') {
      return (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            확인
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              toast({
                title: "응급 알림 전송됨",
                description: "응급 연락처에 알림이 전송되었습니다.",
              });
              onClose();
            }}
            className="flex-1"
          >
            응급 알림 전송
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            확인
          </Button>
          <Button 
            variant="default" 
            onClick={() => {
              toast({
                title: "사용자 연락 시도",
                description: "사용자에게 연락을 시도하고 있습니다.",
              });
              onClose();
            }}
            className="flex-1"
          >
            사용자 연락
          </Button>
        </div>
      );
    }
  };

  const getRecommendations = () => {
    if (alert.type === 'health') {
      return [
        '즉시 안전한 곳에 정차하세요',
        '깊게 숨을 쉬며 안정을 취하세요',
        '필요시 응급 연락처에 연락하세요',
        '증상이 지속되면 의료진에게 문의하세요'
      ];
    } else {
      return [
        '속도를 줄이고 안전운전 하세요',
        '가까운 주유소나 정비소를 찾아보세요',
        '차량 상태를 점검하세요',
        '필요시 견인 서비스를 이용하세요'
      ];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getAlertIcon(alert.type, alert.severity)}
            <span>{getAlertTitle(alert.type, alert.severity)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 알림 정보 */}
          <Card className={`border-l-4 ${getAlertColor(alert.severity)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge 
                  variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alert.severity === 'critical' ? '위험' : '주의'}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(alert.timestamp)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
              
              {/* 사용자 정보 */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>사용자 ID: {alert.userId}</span>
                <span>•</span>
                <Activity className="w-4 h-4" />
                <span>{alert.type === 'health' ? '건강' : '차량'}</span>
              </div>
            </CardContent>
          </Card>

          {/* 권장사항 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">권장사항</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-gray-600">
                {getRecommendations().map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          {getActionButtons()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}