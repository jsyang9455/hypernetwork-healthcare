import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Car, X } from "lucide-react";
import { Alert } from "@shared/schema";

interface VehicleAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert | null;
  onContactUser: () => void;
}

export function VehicleAlertModal({ 
  isOpen, 
  onClose, 
  alert, 
  onContactUser 
}: VehicleAlertModalProps) {
  if (!alert) return null;

  const alertData = alert.data ? JSON.parse(alert.data) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Car className="w-6 h-6 text-health-yellow mr-3" />
            차량 이상 알림
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
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-health-yellow mb-2">{alert.title}</p>
            <p className="text-sm text-gray-700">{alert.message}</p>
          </div>
          
          {alertData && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">현재 속도:</span>
                <span className="font-medium text-health-yellow">{Math.round(alertData.speed)} km/h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">엔진 온도:</span>
                <span className="font-medium text-health-yellow">
                  {Math.round(alertData.engineTemperature)}°C
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">위치:</span>
                <span className="font-medium text-gray-900">서울시 강남구 테헤란로</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button 
            className="bg-health-yellow hover:bg-yellow-600 text-white"
            onClick={onContactUser}
          >
            사용자 연락
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
