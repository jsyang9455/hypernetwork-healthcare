import { useQuery } from "@tanstack/react-query";
import { Wifi, WifiOff, Activity, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface SensorStatusData {
  connected: boolean;
  lastSync: string | null;
  lastError: string | null;
  deviceCount: number;
  deviceNames: string[];
  macMapping: { mac: string; deviceName: string; userId: number }[];
}

export function SensorStatus() {
  const { language } = useLanguage();

  const { data, isLoading } = useQuery<SensorStatusData>({
    queryKey: ["/api/sensor/status"],
    refetchInterval: 30_000,
  });

  const lastSyncText = (() => {
    if (!data?.lastSync) return language === "ko" ? "없음" : "None";
    const d = new Date(data.lastSync);
    const now = new Date();
    const diffSec = Math.round((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return language === "ko" ? `${diffSec}초 전` : `${diffSec}s ago`;
    if (diffSec < 3600) return language === "ko" ? `${Math.floor(diffSec / 60)}분 전` : `${Math.floor(diffSec / 60)}m ago`;
    return d.toLocaleTimeString();
  })();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>{language === "ko" ? "센서 연결 중..." : "Connecting..."}</span>
      </div>
    );
  }

  const isConnected = data?.connected ?? false;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <Badge
          variant="outline"
          className={`text-xs px-2 py-0.5 ${
            isConnected
              ? "border-green-300 text-green-700 bg-green-50"
              : "border-red-300 text-red-600 bg-red-50"
          }`}
        >
          {isConnected
            ? language === "ko" ? "센서 연결됨" : "Sensor Online"
            : language === "ko" ? "센서 오프라인" : "Sensor Offline"}
        </Badge>
      </div>
      {isConnected && (
        <>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Activity className="w-3 h-3" />
            <span>
              {data?.deviceCount ?? 0}
              {language === "ko" ? "대" : " devices"}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {language === "ko" ? "동기화: " : "Sync: "}
            {lastSyncText}
          </span>
        </>
      )}
      {!isConnected && data?.lastError && (
        <span className="text-xs text-red-400 truncate max-w-32" title={data.lastError}>
          {data.lastError}
        </span>
      )}
    </div>
  );
}
