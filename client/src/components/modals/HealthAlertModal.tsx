import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { Alert } from "@shared/schema";

interface HealthAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
  onEmergencyAlert: () => void;
}

export function HealthAlertModal({ 
  isOpen, 
  onClose, 
  alert, 
  onEmergencyAlert 
}: HealthAlertModalProps) {
  if (!alert) return null;

  const alertData = alert.data ? JSON.parse(alert.data) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-health-red mr-3" />
            건강 이상 알림
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              시간: <span className="font-medium text-gray-900">
                {alert.timestamp?.toLocaleString() || '알 수 없음'}
              </span>
            </p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm font-medium text-health-red mb-2">{alert.title}</p>
            <p className="text-sm text-gray-700">{alert.message}</p>
          </div>
          
          {alertData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">현재 심박수:</span>
                <span className="font-medium text-health-red">{alertData.heartRate} 회/분</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">현재 혈압:</span>
                <span className="font-medium text-health-red">
                  {alertData.bloodPressureSystolic}/{alertData.bloodPressureDiastolic} mmHg
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">정상 범위:</span>
                <span className="font-medium text-gray-900">60-100 회/분, 120/80 mmHg</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button 
            className="bg-health-red hover:bg-red-700 text-white"
            onClick={onEmergencyAlert}
          >
            응급 알림 전송
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
