import { FRONT_VIEW_BOX, FRONT_LABELED, FRONT_UNLABELED } from '@/constants/svgFrontPaths';
import { MuscleSvgView } from './MuscleSvgView';

interface Props {
  volumes: Record<string, number>;
  activeMuscle: string | null;
  onSelect: (muscleId: string) => void;
}

export function MuscleMapFront({ volumes, activeMuscle, onSelect }: Props) {
  return (
    <MuscleSvgView
      viewBox={FRONT_VIEW_BOX}
      labeled={FRONT_LABELED}
      unlabeled={FRONT_UNLABELED}
      volumes={volumes}
      activeMuscle={activeMuscle}
      onSelect={onSelect}
    />
  );
}
