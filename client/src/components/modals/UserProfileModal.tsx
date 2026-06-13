import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { User } from "@shared/schema";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>사용자 프로필</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-xl font-semibold text-gray-900">{user.name}</h4>
            <p className="text-sm text-gray-500">ID: {user.username.toUpperCase()}</p>
            <p className="text-sm text-gray-500">{user.age}세, {user.gender}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">기존 질환</h5>
              <div className="space-y-2">
                {user.medicalConditions && user.medicalConditions.length > 0 ? (
                  user.medicalConditions.map((condition, index) => (
                    <Badge key={index} variant="destructive" className="mr-2 mb-2">
                      {condition}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">없음</p>
                )}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">수술 이력</h5>
              <div className="space-y-2">
                {user.surgicalHistory && user.surgicalHistory.length > 0 ? (
                  user.surgicalHistory.map((surgery, index) => (
                    <p key={index} className="text-sm text-gray-600">{surgery}</p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">없음</p>
                )}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">알레르기</h5>
              <div className="space-y-2">
                {user.allergies && user.allergies.length > 0 ? (
                  user.allergies.map((allergy, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">없음</p>
                )}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">복용 중인 약물</h5>
              <div className="space-y-2">
                {user.medications && user.medications.length > 0 ? (
                  user.medications.map((medication, index) => (
                    <p key={index} className="text-sm text-gray-600">{medication}</p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">없음</p>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-3">응급 연락처</h5>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                응급 연락처: {user.emergencyContact || '정보 없음'}
              </p>
              <p className="text-sm text-gray-600">
                주치의: {user.doctorContact || '정보 없음'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
