import { useEffect, useRef } from "react";

interface RealTimeChartProps {
  data: number[];
  color: string;
  height?: number;
}

export function RealTimeChart({ data, color, height = 32 }: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    if (data.length === 0) return;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    // Draw the line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = canvasHeight - ((value - min) / range) * canvasHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Add a glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();

  }, [data, color]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={height}
      className="w-full"
      style={{ height: `${height}px` }}
    />
  );
}
