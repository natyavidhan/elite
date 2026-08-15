import { useId } from 'react';
import { MUSCLES } from '@/constants/muscles';
import { getMuscleColor } from '@/utils/muscleColor';

interface MuscleSvgViewProps {
  viewBox: string;
  labeled: Record<string, string[]>;
  unlabeledFill: string[];
  unlabeledStroke: string[];
  volumes: Record<string, number>;
  activeMuscle: string | null;
  onSelect: (muscleId: string) => void;
}

export function MuscleSvgView({
  viewBox,
  labeled,
  unlabeledFill,
  unlabeledStroke,
  volumes,
  activeMuscle,
  onSelect,
}: MuscleSvgViewProps) {
  const titleId = useId();

  return (
    <svg
      viewBox={viewBox}
      role="group"
      aria-labelledby={titleId}
      className="w-full h-auto md:w-auto md:h-full mx-auto select-none"
      style={{ overflow: 'visible' }}
    >
      <title id={titleId}>Anatomical plate — tap a muscle group to see today&apos;s exercises</title>

      {/* Shading/shadow accents from the source art — faint ink wash, never interactive */}
      <g aria-hidden="true" fill="rgba(32,27,21,0.09)">
        {unlabeledFill.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Labeled muscle groups — tappable, colored by today's volume */}
      {Object.entries(labeled).map(([muscleId, paths]) => {
        const def = MUSCLES[muscleId];
        const volume = volumes[muscleId] ?? 0;
        const fill = def ? getMuscleColor(volume, def.maxVolume) : getMuscleColor(0, 1);
        const isActive = activeMuscle === muscleId;
        return (
          <g
            key={muscleId}
            role="button"
            tabIndex={0}
            aria-label={`${def?.displayName ?? muscleId}, ${Math.round(volume)} kilogram reps trained today`}
            aria-pressed={isActive}
            onClick={() => onSelect(muscleId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(muscleId);
              }
            }}
            className="cursor-pointer outline-none"
            style={{ transition: 'filter 200ms ease-out' }}
          >
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={fill}
                stroke={isActive ? '#8B2419' : 'rgba(32,27,21,0.35)'}
                strokeWidth={isActive ? 1.5 : 0.75}
                style={{ transition: 'fill 700ms cubic-bezier(0.16, 1, 0.3, 1), stroke 200ms ease-out, stroke-width 200ms ease-out' }}
              />
            ))}
          </g>
        );
      })}

      {/* The figure's actual line-art contour (head, torso, limb outlines) —
          drawn last so it stays crisp over whatever is colored beneath it. */}
      <g aria-hidden="true" fill="none" stroke="rgba(32,27,21,0.55)" strokeWidth={0.75} strokeLinecap="round" strokeLinejoin="round">
        {unlabeledStroke.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
