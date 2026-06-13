import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, User, FileText, Plus, Filter, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RehabilitationData, User as UserType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";

interface RehabilitationManagementProps {
  userId: number;
}

export default function RehabilitationManagement({ userId }: RehabilitationManagementProps) {
  const [, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t, language, setLanguage } = useLanguage();

  const { data: user } = useQuery<UserType>({
    queryKey: ['/api/users', userId],
  });

  const { data: rehabilitationHistory = [], isLoading } = useQuery<RehabilitationData[]>({
    queryKey: ['/api/users', userId, 'rehabilitation', 'history'],
    refetchInterval: 30000,
  });

  const addRehabilitationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/users/${userId}/rehabilitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to add rehabilitation session');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'rehabilitation', 'history'] });
      setIsAddModalOpen(false);
      toast({
        title: t('rehabilitation', 'sessionAdded'),
        description: t('rehabilitation', 'sessionAddedDesc'),
      });
    },
    onError: (error) => {
      console.error('Error adding rehabilitation session:', error);
      toast({
        title: t('rehabilitation', 'errorOccurred'),
        description: t('rehabilitation', 'sessionAddError'),
        variant: "destructive",
      });
    }
  });

  const categoryKeys: Record<string, 'physicalTherapy' | 'exerciseTherapy' | 'bedTherapy' | 'functionalRecovery' | 'staffTraining'> = {
    "물리치료": "physicalTherapy",
    "운동치료": "exerciseTherapy",
    "침상치료": "bedTherapy",
    "기능회복훈련": "functionalRecovery",
    "직원교육": "staffTraining"
  };

  const categories = ["물리치료", "운동치료", "침상치료", "기능회복훈련", "직원교육"];

  const getCategoryDisplay = (category: string) => {
    const key = categoryKeys[category];
    return key ? t('rehabilitation', key) : category;
  };

  const treatmentOptions: Record<string, string[]> = {
    "물리치료": ["온열치료", "전기치료", "순환치료"],
    "운동치료": ["관절운동치료", "근력운동치료", "균형운동치료", "보행운동치료"],
    "침상치료": ["관절구축예방운동", "ADL유지"],
    "기능회복훈련": ["신체기능회복훈련", "기본동작훈련", "일상생활동작훈련"],
    "직원교육": ["근골격계질환예방교육"]
  };

  const treatmentKeys: Record<string, 'heatTherapy' | 'electricTherapy' | 'circulationTherapy' | 'jointExercise' | 'strengthExercise' | 'balanceExercise' | 'gaitExercise' | 'contracturePrevention' | 'adlMaintenance' | 'bodyFunctionRecovery' | 'basicMotionTraining' | 'dailyLivingTraining' | 'musculoskeletalEducation'> = {
    "온열치료": "heatTherapy",
    "전기치료": "electricTherapy",
    "순환치료": "circulationTherapy",
    "관절운동치료": "jointExercise",
    "근력운동치료": "strengthExercise",
    "균형운동치료": "balanceExercise",
    "보행운동치료": "gaitExercise",
    "관절구축예방운동": "contracturePrevention",
    "ADL유지": "adlMaintenance",
    "신체기능회복훈련": "bodyFunctionRecovery",
    "기본동작훈련": "basicMotionTraining",
    "일상생활동작훈련": "dailyLivingTraining",
    "근골격계질환예방교육": "musculoskeletalEducation"
  };

  const getTreatmentDisplay = (treatment: string) => {
    const key = treatmentKeys[treatment];
    return key ? t('rehabilitation', key) : treatment;
  };

  const filteredHistory = rehabilitationHistory.filter(item => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      item.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.therapist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">{t('rehabilitation', 'completed')}</Badge>;
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{t('rehabilitation', 'scheduled')}</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">{t('rehabilitation', 'cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "물리치료": "bg-blue-50 text-blue-700 border-blue-200",
      "운동치료": "bg-green-50 text-green-700 border-green-200",
      "침상치료": "bg-purple-50 text-purple-700 border-purple-200",
      "기능회복훈련": "bg-orange-50 text-orange-700 border-orange-200",
      "직원교육": "bg-gray-50 text-gray-700 border-gray-200"
    };
    return colors[category] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const formatDate = (dateValue: string | Date) => {
    const locale = language === 'ko' ? 'ko-KR' : 'en-US';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/member-detail/${userId}`)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common', 'goBack')}</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('rehabilitation', 'management')}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.name} ({user?.bedLocation}) - {t('rehabilitation', 'historyAndManagement')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Globe className="w-4 h-4 text-gray-600 ml-2" />
                <Button
                  variant={language === 'ko' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ko')}
                  className="text-xs"
                >
                  {t('common', 'korean')}
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                  className="text-xs"
                >
                  {t('common', 'english')}
                </Button>
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>{t('rehabilitation', 'addNewSession')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('rehabilitation', 'addNewSessionTitle')}</DialogTitle>
                  </DialogHeader>
                  <AddRehabilitationForm
                    onSubmit={(data) => addRehabilitationMutation.mutate(data)}
                    treatmentOptions={treatmentOptions}
                    isLoading={addRehabilitationMutation.isPending}
                    t={t}
                    getCategoryDisplay={getCategoryDisplay}
                    getTreatmentDisplay={getTreatmentDisplay}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>{t('rehabilitation', 'filterAndSearch')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">{t('common', 'search')}</Label>
                <Input
                  id="search"
                  placeholder={t('rehabilitation', 'searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">{t('rehabilitation', 'category')}</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('rehabilitation', 'selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('rehabilitation', 'all')}</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {getCategoryDisplay(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">{t('common', 'status')}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('rehabilitation', 'selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('rehabilitation', 'all')}</SelectItem>
                    <SelectItem value="completed">{t('rehabilitation', 'completed')}</SelectItem>
                    <SelectItem value="scheduled">{t('rehabilitation', 'scheduled')}</SelectItem>
                    <SelectItem value="cancelled">{t('rehabilitation', 'cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                  className="w-full"
                >
                  {t('rehabilitation', 'resetFilter')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {categories.map(category => {
            const count = rehabilitationHistory.filter(item => item.category === category).length;
            return (
              <Card key={category}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600">{getCategoryDisplay(category)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('rehabilitation', 'history')}</CardTitle>
            <CardDescription>
              {t('rehabilitation', 'totalRecords').replace('{count}', filteredHistory.length.toString())}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common', 'loading')}</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('rehabilitation', 'noRecords')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'dateTime')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'category')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'detailTreatment')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'duration')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'therapist')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('common', 'status')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              {formatDate(item.sessionDate)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getCategoryColor(item.category)}>
                            {getCategoryDisplay(item.category)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{getTreatmentDisplay(item.treatment)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{item.duration}{t('rehabilitation', 'minutes')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{item.therapist}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3 px-4">
                          {item.notes ? (
                            <div className="flex items-start space-x-2">
                              <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{item.notes}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface AddRehabilitationFormProps {
  onSubmit: (data: any) => void;
  treatmentOptions: Record<string, string[]>;
  isLoading: boolean;
  t: (category: any, key: any) => string;
  getCategoryDisplay: (category: string) => string;
  getTreatmentDisplay: (treatment: string) => string;
}

function AddRehabilitationForm({ onSubmit, treatmentOptions, isLoading, t, getCategoryDisplay, getTreatmentDisplay }: AddRehabilitationFormProps) {
  const [formData, setFormData] = useState({
    category: "",
    treatment: "",
    duration: 30,
    therapist: "",
    notes: "",
    status: "scheduled",
    sessionDate: new Date().toISOString().slice(0, 16)
  });

  const [availableTreatments, setAvailableTreatments] = useState<string[]>([]);

  useEffect(() => {
    if (formData.category) {
      setAvailableTreatments(treatmentOptions[formData.category] || []);
      setFormData(prev => ({ ...prev, treatment: "" }));
    } else {
      setAvailableTreatments([]);
    }
  }, [formData.category, treatmentOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.treatment || !formData.therapist) {
      return;
    }

    onSubmit({
      ...formData,
      sessionDate: formData.sessionDate
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">{t('rehabilitation', 'category')} *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
          <SelectTrigger>
            <SelectValue placeholder={t('rehabilitation', 'selectCategory')} />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(treatmentOptions).map(category => (
              <SelectItem key={category} value={category}>
                {getCategoryDisplay(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="treatment">{t('rehabilitation', 'detailTreatment')} *</Label>
        <Select 
          value={formData.treatment} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, treatment: value }))}
          disabled={!formData.category}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('rehabilitation', 'selectDetailTreatment')} />
          </SelectTrigger>
          <SelectContent>
            {availableTreatments.map(treatment => (
              <SelectItem key={treatment} value={treatment}>
                {getTreatmentDisplay(treatment)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="duration">{t('rehabilitation', 'durationMinutes')}</Label>
        <Input
          id="duration"
          type="number"
          min="15"
          max="120"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
        />
      </div>

      <div>
        <Label htmlFor="therapist">{t('rehabilitation', 'therapist')} *</Label>
        <Input
          id="therapist"
          value={formData.therapist}
          onChange={(e) => setFormData(prev => ({ ...prev, therapist: e.target.value }))}
          placeholder={t('rehabilitation', 'therapistName')}
        />
      </div>

      <div>
        <Label htmlFor="sessionDate">{t('rehabilitation', 'sessionDateTime')}</Label>
        <Input
          id="sessionDate"
          type="datetime-local"
          value={formData.sessionDate}
          onChange={(e) => setFormData(prev => ({ ...prev, sessionDate: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="status">{t('common', 'status')}</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder={t('rehabilitation', 'selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">{t('rehabilitation', 'scheduled')}</SelectItem>
            <SelectItem value="completed">{t('rehabilitation', 'completed')}</SelectItem>
            <SelectItem value="cancelled">{t('rehabilitation', 'cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">{t('rehabilitation', 'notes')}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder={t('rehabilitation', 'notesPlaceholder')}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('rehabilitation', 'saving') : t('common', 'save')}
        </Button>
      </div>
    </form>
  );
}
