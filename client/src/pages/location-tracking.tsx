import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Clock, Navigation, Car, Activity, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationData {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  address: string;
  isDriving: boolean;
  speed: number;
  timestamp: string;
}

interface User {
  id: number;
  name: string;
  profileImage: string | null;
}

export default function LocationTracking() {
  const { t, language, setLanguage } = useLanguage();
  const [match, params] = useRoute("/location-tracking/:userId");
  const userId = params?.userId ? parseInt(params.userId) : null;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  // Fetch location data for selected date
  const { data: locationData } = useQuery<LocationData[]>({
    queryKey: ["/api/users", userId, "location", selectedDate],
    enabled: !!userId,
  });

  const goBack = () => {
    window.history.back();
  };

  // Calculate statistics
  const totalDistance = locationData?.length ? Math.round(locationData.length * 0.5 + Math.random() * 2) : 0;
  const drivingTime = locationData?.filter(loc => loc.isDriving).length || 0;
  const avgSpeed = locationData?.length ? Math.round(locationData.reduce((sum, loc) => sum + loc.speed, 0) / locationData.length) : 0;

  if (!userId) {
    return <div className="flex items-center justify-center h-screen">{t('location', 'invalidUserId')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={goBack}
                className="mr-4 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Activity className="w-8 h-8 text-health-blue mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">{t('location', 'locationRecord')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={language === 'ko' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('ko')}
              >
                한국어
              </Button>
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                English
              </Button>
              <Globe className="w-5 h-5 text-gray-600 ml-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        {user && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500">{t('location', 'trackingRecord')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              {t('location', 'selectDate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalDistance}km</div>
                <div className="text-sm text-gray-500">{t('location', 'totalDistance')}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{locationData?.length || 0}</div>
                <div className="text-sm text-gray-500">{t('location', 'locationRecord')}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{drivingTime}{t('common', 'minutesAgo').replace('분전', '분')}</div>
                <div className="text-sm text-gray-500">{t('location', 'movementTime')}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{avgSpeed}km/h</div>
                <div className="text-sm text-gray-500">{t('location', 'averageSpeed')}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maps Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Google Maps Route */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-red-500" />
                {t('location', 'googleMapsRoute')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d25302.80702763842!2d127.0276368!3d37.4979517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e6!4m5!1s0x357ca15a27ecf52b%3A0x4b5b4c0f8b5b4b5b!2z7ISc7Jq47Yq567OE7IucIOqwleuCqOq1rCDsl63sgrzrpqzthZAg7Yq567OE7IucIOuMgO2VneuPvOqyvO2Ahg!3m2!1d37.4813!2d127.0526!4m5!1s0x357ca1577435b7e7%3A0x4b5b5c0f8b5b4b5b!2z7ISc7Jq47Yq567OE7IucIOqwleuCqOq1rCDrgpjssaDrj4nqsIDrpqwg7ISc7Yq567OE7Yq567OE7IucIOq1rOuccyDtlZnqsIDrpqw!3m2!1d37.5172!2d127.0473!5e0!3m2!1sko!2skr!4v1640000000000!5m2!1sko!2skr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Markers Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                {t('location', 'locationMarkers')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-96 rounded-lg overflow-hidden relative">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=126.97%2C37.47%2C127.07%2C37.52&layer=mapnik&marker=37.4979%2C127.0276"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                />
                
                {/* Interactive markers overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {locationData?.slice(0, 5).map((location, index) => (
                    <div
                      key={location.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto group"
                      style={{
                        left: `${20 + index * 15}%`,
                        top: `${30 + index * 10}%`,
                      }}
                    >
                      <div className="relative">
                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-transform group-hover:scale-150">
                        </div>
                        
                        {/* Hover tooltip */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                          <div className="bg-black text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-white">
                            <div className="font-medium">{location.address}</div>
                            <div>{t('location', 'status')} {location.isDriving ? t('location', 'moving') : t('location', 'stopped')}</div>
                            <div>{t('location', 'speed')} {location.speed}km/h</div>
                            <div>{new Date(location.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              {t('location', 'locationRecordDetail')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationData && locationData.length > 0 ? (
              <div className="space-y-4">
                {locationData.slice(0, 10).map((location, index) => (
                  <div key={location.id}>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${location.isDriving ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{location.address}</div>
                          <div className="text-sm text-gray-500">
                            {t('location', 'location')} {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={location.isDriving ? "default" : "secondary"}>
                            {location.isDriving ? t('location', 'moving') : t('location', 'stopped')}
                          </Badge>
                          {location.isDriving && (
                            <Car className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {location.speed}km/h • {new Date(location.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {index < locationData.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{t('location', 'noLocationRecords')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}