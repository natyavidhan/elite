import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { MUSCLE_PATHS, UNLABELED_PATHS, VIEWBOX, WIDTH, HEIGHT } from '../constants/svgFrontPaths';
import { getMuscleColor, getRestingColor } from '../utils/muscleColor';

interface MuscleMapFrontProps {
  muscleVolumes: Record<string, number>;
  onMusclePress?: (muscleId: string) => void;
  size?: number;
}

export default function MuscleMapFront({ muscleVolumes, onMusclePress, size = 200 }: MuscleMapFrontProps) {
  const scale = size / WIDTH;
  const height = HEIGHT * scale;

  return (
    <Svg width={size} height={height} viewBox={VIEWBOX}>
      {/* Unlabeled / decorative paths - rendered with static color */}
      {UNLABELED_PATHS.map((path, index) => (
        <Path
          key={`bg-${index}`}
          d={path.d}
          fill={path.fill || getRestingColor()}
        />
      ))}

      {/* Muscle group paths - rendered with dynamic color */}
      {Object.entries(MUSCLE_PATHS).map(([muscleId, paths]) => {
        const volume = muscleVolumes[muscleId] || 0;
        const color = volume > 0 ? getMuscleColor(volume, muscleId) : getRestingColor();
        
        return (
          <G key={muscleId} onPress={() => onMusclePress?.(muscleId)}>
            {paths.map((path, index) => (
              <Path
                key={`${muscleId}-${index}`}
                d={path.d}
                fill={color}
              />
            ))}
          </G>
        );
      })}
    </Svg>
  );
}
