import { BACK_VIEW_BOX, BACK_LABELED, BACK_UNLABELED_FILL, BACK_UNLABELED_STROKE } from '@/constants/svgBackPaths';
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
      unlabeledFill={BACK_UNLABELED_FILL}
      unlabeledStroke={BACK_UNLABELED_STROKE}
      volumes={volumes}
      activeMuscle={activeMuscle}
      onSelect={onSelect}
    />
  );
}
