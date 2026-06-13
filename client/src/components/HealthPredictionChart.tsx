import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { HealthData } from "@shared/schema";

interface HealthPredictionProps {
  healthHistory: HealthData[];
  userId: number;
}

// 다중선형회귀 계산 함수
function multipleLinearRegression(data: number[][], target: number[]) {
  const n = data.length;
  const m = data[0].length;
  
  // 정규방정식을 사용한 회귀계수 계산
  const X = data.map(row => [1, ...row]); // 절편을 위한 1 추가
  const XT = transpose(X);
  const XTX = multiply(XT, X);
  const XTY = multiply(XT, target.map(val => [val]));
  
  try {
    const coefficients = solve(XTX, XTY);
    return coefficients.map(row => row[0]);
  } catch (error) {
    console.error('회귀분석 계산 오류:', error);
    return Array(m + 1).fill(0);
  }
}

// 행렬 전치
function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// 행렬 곱셈
function multiply(a: number[][], b: number[][]): number[][] {
  const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      for (let k = 0; k < b.length; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

// 가우스-요던 소거법으로 연립방정식 해결
function solve(A: number[][], b: number[][]): number[][] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i][0]]);
  
  // 전진 소거
  for (let i = 0; i < n; i++) {
    // 피벗 찾기
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // 행 교환
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // 0으로 만들기
    for (let k = i + 1; k < n; k++) {
      if (augmented[i][i] === 0) continue;
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j < n + 1; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }
  
  // 후진 대입
  const solution = Array(n).fill(0).map(() => [0]);
  for (let i = n - 1; i >= 0; i--) {
    solution[i][0] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      solution[i][0] -= augmented[i][j] * solution[j][0];
    }
    if (augmented[i][i] !== 0) {
      solution[i][0] /= augmented[i][i];
    }
  }
  
  return solution;
}

export function HealthPredictionChart({ healthHistory, userId }: HealthPredictionProps) {
  // 최근 30개 데이터 사용
  const recentData = healthHistory.slice(-30);
  
  if (recentData.length < 5) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            건강 예측 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">예측 분석을 위한 충분한 데이터가 필요합니다.</p>
            <p className="text-sm text-muted-foreground mt-2">최소 5개 이상의 건강 데이터가 필요합니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 특성 데이터 준비 (시간, 걸음수, 스트레스 레벨)
  const features = recentData.map((data, index) => [
    index, // 시간 순서
    data.steps || 0,
    data.stressLevel || 0,
  ]);
  
  const heartRateTarget = recentData.map(data => data.heartRate || 0);
  const bloodPressureTarget = recentData.map(data => data.bloodPressureSystolic || 0);
  
  // 회귀 계수 계산
  const heartRateCoeff = multipleLinearRegression(features, heartRateTarget);
  const bloodPressureCoeff = multipleLinearRegression(features, bloodPressureTarget);
  
  // 예측 데이터 생성 (향후 7일)
  const predictions = [];
  const lastIndex = recentData.length - 1;
  const avgSteps = recentData.reduce((sum, data) => sum + (data.steps || 0), 0) / recentData.length;
  const avgStress = recentData.reduce((sum, data) => sum + (data.stressLevel || 0), 0) / recentData.length;
  
  for (let i = 1; i <= 7; i++) {
    const timeIndex = lastIndex + i;
    const predictedSteps = avgSteps * (1 + Math.sin(i * 0.5) * 0.1); // 약간의 변동
    const predictedStress = avgStress * (1 + Math.cos(i * 0.3) * 0.15);
    
    const predictedHeartRate = heartRateCoeff[0] + 
                              heartRateCoeff[1] * timeIndex + 
                              heartRateCoeff[2] * predictedSteps + 
                              heartRateCoeff[3] * predictedStress;
                              
    const predictedBloodPressure = bloodPressureCoeff[0] + 
                                  bloodPressureCoeff[1] * timeIndex + 
                                  bloodPressureCoeff[2] * predictedSteps + 
                                  bloodPressureCoeff[3] * predictedStress;
    
    predictions.push({
      day: `${i}일 후`,
      heartRate: Math.max(60, Math.min(120, Math.round(predictedHeartRate))),
      bloodPressure: Math.max(90, Math.min(160, Math.round(predictedBloodPressure))),
      type: 'prediction'
    });
  }
  
  // 차트 데이터 준비
  const chartData = [
    ...recentData.slice(-7).map((data, index) => ({
      day: `${7-index}일 전`,
      heartRate: data.heartRate || 0,
      bloodPressure: data.bloodPressureSystolic || 0,
      type: 'actual'
    })).reverse(),
    ...predictions
  ];
  
  // 트렌드 분석
  const heartRateTrend = predictions[6].heartRate - predictions[0].heartRate;
  const bloodPressureTrend = predictions[6].bloodPressure - predictions[0].bloodPressure;
  
  const getHealthStatus = (heartRate: number, bloodPressure: number) => {
    if (heartRate > 100 || bloodPressure > 140) return { status: "위험", color: "destructive" };
    if (heartRate > 85 || bloodPressure > 130) return { status: "주의", color: "secondary" };
    return { status: "양호", color: "default" };
  };
  
  const predictedStatus = getHealthStatus(predictions[6].heartRate, predictions[6].bloodPressure);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          AI 건강예측
          <Badge variant={predictedStatus.color as any}>
            7일 후 예측: {predictedStatus.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 예측 요약 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">심박수 트렌드:</div>
              <div className="flex items-center gap-1">
                {heartRateTrend > 2 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : heartRateTrend < -2 ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : (
                  <Minus className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-sm font-medium ${
                  heartRateTrend > 2 ? 'text-red-500' : 
                  heartRateTrend < -2 ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {heartRateTrend > 0 ? '+' : ''}{heartRateTrend.toFixed(1)} 회/분
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">혈압 트렌드:</div>
              <div className="flex items-center gap-1">
                {bloodPressureTrend > 5 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : bloodPressureTrend < -5 ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : (
                  <Minus className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-sm font-medium ${
                  bloodPressureTrend > 5 ? 'text-red-500' : 
                  bloodPressureTrend < -5 ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {bloodPressureTrend > 0 ? '+' : ''}{bloodPressureTrend.toFixed(1)} mmHg
                </span>
              </div>
            </div>
          </div>
          
          {/* 예측 차트 */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === 'heartRate' ? ' 회/분' : ' mmHg'}`,
                    name === 'heartRate' ? '심박수' : '혈압'
                  ]}
                  labelFormatter={(label) => `시점: ${label}`}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="heartRate" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="심박수"
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle 
                        {...props} 
                        fill={payload.type === 'prediction' ? '#ef4444' : '#dc2626'}
                        stroke={payload.type === 'prediction' ? '#ef4444' : '#dc2626'}
                        strokeWidth={payload.type === 'prediction' ? 1 : 2}
                        r={payload.type === 'prediction' ? 3 : 4}
                      />
                    );
                  }}
                  strokeDasharray={(dataPoint) => dataPoint?.type === 'prediction' ? '5 5' : '0'}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="bloodPressure" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="혈압"
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle 
                        {...props} 
                        fill={payload.type === 'prediction' ? '#3b82f6' : '#1d4ed8'}
                        stroke={payload.type === 'prediction' ? '#3b82f6' : '#1d4ed8'}
                        strokeWidth={payload.type === 'prediction' ? 1 : 2}
                        r={payload.type === 'prediction' ? 3 : 4}
                      />
                    );
                  }}
                  strokeDasharray={(dataPoint) => dataPoint?.type === 'prediction' ? '5 5' : '0'}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* 예측 정보 */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">AI 예측 모델 정보</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 최근 {recentData.length}개의 건강 데이터를 활용한 AI 머신러닝 분석</p>
              <p>• 예측 변수: 시간 순서, 걸음 수, 스트레스 레벨</p>
              <p>• 실선: 실제 데이터, 점선: AI 예측 데이터</p>
              <p>• AI 예측 정확도는 개인의 생활 패턴과 건강 상태에 따라 달라질 수 있습니다</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}