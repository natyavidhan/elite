import React, { useMemo } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function SparkLine({ data, width = 80, height = 30, color = '#1E64FF' }: SparkLineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const lastPoint = useMemo(() => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const x = width;
    const y = height - ((data[data.length - 1] - min) / range) * height;
    return { x, y };
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <Svg width={width} height={height}>
      <Path d={path} fill="none" stroke={color} strokeWidth={2} />
      {lastPoint && <Circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={color} />}
    </Svg>
  );
}
