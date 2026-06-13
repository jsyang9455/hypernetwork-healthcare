import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, User, FileText, Activity, TrendingUp, BarChart3, Download, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { RehabilitationData, User as UserType } from "@shared/schema";

export default function MemberRehabilitationReport() {
  const [, setLocation] = useLocation();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const userId = user?.memberData?.id;
  const { t, language, setLanguage } = useLanguage();

  const getCategoryTranslation = (category: string) => {
    const categoryMap: Record<string, string> = {
      "물리치료": t('rehabilitation', 'physicalTherapy'),
      "운동치료": t('rehabilitation', 'exerciseTherapy'),
      "침상치료": t('rehabilitation', 'bedTherapy'),
      "기능회복훈련": t('rehabilitation', 'functionalRecovery'),
      "직원교육": t('rehabilitation', 'staffTraining'),
    };
    return categoryMap[category] || category;
  };

  // Fetch user data
  const { data: userData } = useQuery<UserType>({
    queryKey: ['/api/users', userId],
    enabled: !!userId,
  });

  // Fetch rehabilitation history
  const { data: rehabilitationHistory = [], isLoading } = useQuery<RehabilitationData[]>({
    queryKey: ['/api/users', userId, 'rehabilitation', 'history'],
    enabled: !!userId,
    refetchInterval: 30000,
  });

  if (!userId || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{t('rehabilitation', 'userNotFound')}</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            {t('rehabilitation', 'goHome')}
          </Button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalSessions = rehabilitationHistory.length;
  const completedSessions = rehabilitationHistory.filter(item => item.status === 'completed').length;
  const scheduledSessions = rehabilitationHistory.filter(item => item.status === 'scheduled').length;
  const cancelledSessions = rehabilitationHistory.filter(item => item.status === 'cancelled').length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Category statistics
  const categoryStats = rehabilitationHistory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent sessions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentSessions = rehabilitationHistory
    .filter(item => new Date(item.sessionDate) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  // Total treatment time
  const totalMinutes = rehabilitationHistory
    .filter(item => item.status === 'completed')
    .reduce((total, item) => total + item.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generatePDF = async () => {
    if (!reportRef.current || !userData) return;

    setIsGeneratingPDF(true);

    try {
      // Create a temporary container for PDF content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      document.body.appendChild(tempDiv);

      // Create PDF content
      tempDiv.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="font-size: 24px; margin: 0; color: #333;">재활치료 내역 보고서</h1>
            <p style="margin: 10px 0 0 0; color: #666;">Healthcare Rehabilitation Report</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">환자 정보</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><strong>성명</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${userData.name}</td>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 120px;"><strong>나이</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${userData.age}세</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>성별</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${userData.gender}</td>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>병실</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${userData.bedLocation}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>보고서 생성일</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;" colspan="3">${new Date().toLocaleDateString('ko-KR')}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">종합 통계</h2>
            <div style="display: flex; flex-wrap: wrap; gap: 15px;">
              <div style="flex: 1; min-width: 120px; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 5px;">${totalSessions}</div>
                <div style="font-size: 12px; color: #666;">총 세션 수</div>
              </div>
              <div style="flex: 1; min-width: 120px; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="font-size: 20px; font-weight: bold; color: #16a34a; margin-bottom: 5px;">${completedSessions}</div>
                <div style="font-size: 12px; color: #666;">완료된 세션</div>
              </div>
              <div style="flex: 1; min-width: 120px; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 5px;">${completionRate}%</div>
                <div style="font-size: 12px; color: #666;">완료율</div>
              </div>
              <div style="flex: 1; min-width: 120px; text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <div style="font-size: 20px; font-weight: bold; color: #7c3aed; margin-bottom: 5px;">${totalHours}시간 ${remainingMinutes}분</div>
                <div style="font-size: 12px; color: #666;">총 치료시간</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">치료 분야별 현황</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f9f9f9;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">치료 분야</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">세션 수</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">비율</th>
              </tr>
              ${Object.entries(categoryStats).map(([category, count]) => {
                const percentage = Math.round((count / totalSessions) * 100);
                return `
                  <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${category}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${count}회</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">최근 재활치료 내역 (최근 10건)</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f9f9f9;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 11px;">일시</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 11px;">구분</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 11px;">치료명</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 11px;">시간</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left; font-size: 11px;">치료사</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 11px;">상태</th>
              </tr>
              ${rehabilitationHistory.slice(0, 10).map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">${formatDate(item.sessionDate)}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">${item.category}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">${item.treatment}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 10px;">${item.duration}분</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-size: 10px;">${item.therapist}</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 10px;">${
                    item.status === 'completed' ? '완료' : 
                    item.status === 'scheduled' ? '예정' : '취소'
                  }</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
            <p>본 보고서는 ${new Date().toLocaleString('ko-KR')}에 생성되었습니다.</p>
            <p>하이퍼네트워크 헬스케어 시스템 - 재활치료 관리</p>
          </div>
        </div>
      `;

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white'
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const fileName = `재활치료보고서_${userData.name}_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('보고서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/member-profile')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('rehabilitation', 'backToProfile')}</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('rehabilitation', 'reportTitle')}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {userData.name}{t('rehabilitation', 'reportSubtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 border rounded-lg p-1">
                <Globe className="w-4 h-4 text-gray-500 ml-1" />
                <Button
                  variant={language === 'ko' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ko')}
                  className="text-xs px-2 py-1 h-7"
                >
                  {t('common', 'korean')}
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                  className="text-xs px-2 py-1 h-7"
                >
                  {t('common', 'english')}
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPDF ? t('member', 'generating') : t('rehabilitation', 'downloadReport')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={reportRef}>
        {/* Patient Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userData.profileImage || undefined} />
                <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{userData.name}</h2>
                <p className="text-gray-600">{userData.bedLocation}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{t('rehabilitation', 'age')}: {userData.age}{t('rehabilitation', 'yearsOld')}</span>
                  <span>{t('rehabilitation', 'gender')}: {userData.gender}</span>
                  <span>{t('rehabilitation', 'reportGeneratedDate')}: {new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{totalSessions}</div>
              <p className="text-gray-600">{t('rehabilitation', 'totalSessions')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{completedSessions}</div>
              <p className="text-gray-600">{t('rehabilitation', 'completedSessions')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{completionRate}%</div>
              <p className="text-gray-600">{t('rehabilitation', 'completionRate')}</p>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {t('rehabilitation', 'hoursMinutes').replace('{hours}', String(totalHours)).replace('{minutes}', String(remainingMinutes))}
              </div>
              <p className="text-gray-600">{t('rehabilitation', 'totalTreatmentTime')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>{t('rehabilitation', 'treatmentByCategory')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([category, count]) => {
                  const percentage = Math.round((count / totalSessions) * 100);
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={getCategoryColor(category)}>
                          {getCategoryTranslation(category)}
                        </Badge>
                        <span className="text-sm font-medium">{count}{t('rehabilitation', 'times')} ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>{t('rehabilitation', 'sessionStatusBreakdown')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{t('rehabilitation', 'completed')}</span>
                  </span>
                  <span className="font-bold">{completedSessions}{t('rehabilitation', 'times')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>{t('rehabilitation', 'scheduled')}</span>
                  </span>
                  <span className="font-bold">{scheduledSessions}{t('rehabilitation', 'times')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>{t('rehabilitation', 'cancelled')}</span>
                  </span>
                  <span className="font-bold">{cancelledSessions}{t('rehabilitation', 'times')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{t('rehabilitation', 'recent7DaySessions')}</span>
            </CardTitle>
            <CardDescription>
              {t('rehabilitation', 'recentSessionsCount').replace('{count}', String(recentSessions.length))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('rehabilitation', 'noRecentRecords')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className={getCategoryColor(session.category)}>
                            {getCategoryTranslation(session.category)}
                          </Badge>
                          {getStatusBadge(session.status)}
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{session.treatment}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(session.sessionDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(session.sessionDate)} ({session.duration}{t('rehabilitation', 'minutes')})</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{session.therapist}</span>
                          </div>
                        </div>
                        {session.notes && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                            <div className="flex items-start space-x-2">
                              <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <span>{session.notes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Sessions Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('rehabilitation', 'allRehabHistory')}</CardTitle>
            <CardDescription>
              {t('rehabilitation', 'totalRecordsCount').replace('{count}', String(rehabilitationHistory.length))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('common', 'loading')}</p>
              </div>
            ) : rehabilitationHistory.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('rehabilitation', 'noRecords')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'dateTime')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'category')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'treatmentName')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'duration')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'therapist')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('common', 'status')}</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">{t('rehabilitation', 'notes')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rehabilitationHistory.slice(0, 20).map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div>{formatDate(item.sessionDate)}</div>
                            <div className="text-gray-500">{formatTime(item.sessionDate)}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getCategoryColor(item.category)}>
                            {getCategoryTranslation(item.category)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{item.treatment}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span>{item.duration}{t('rehabilitation', 'minutes')}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span>{item.therapist}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3 px-4">
                          {item.notes ? (
                            <span className="text-sm text-gray-600">{item.notes}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rehabilitationHistory.length > 20 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    {t('rehabilitation', 'first20Records').replace('{count}', String(rehabilitationHistory.length))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}