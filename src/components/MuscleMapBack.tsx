import { BACK_VIEW_BOX, BACK_LABELED, BACK_UNLABELED } from '@/constants/svgBackPaths';
import { MuscleSvgView } from './MuscleSvgView';

interface Props {
  volumes: Record<string, number>;
  activeMuscle: string | null;
  onSelect: (muscleId: string) => void;
}

export function MuscleMapBack({ volumes, activeMuscle, onSelect }: Props) {
  return (
    <MuscleSvgView
      viewBox={BACK_VIEW_BOX}
      labeled={BACK_LABELED}
      unlabeled={BACK_UNLABELED}
      volumes={volumes}
      activeMuscle={activeMuscle}
      onSelect={onSelect}
    />
  );
}
