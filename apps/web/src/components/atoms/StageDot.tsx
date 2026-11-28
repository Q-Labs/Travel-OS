import type { TripStage } from '../../lib/types';

/** A dot in the colour of a trip's pipeline stage. */
export function StageDot({ stage }: { stage: TripStage }) {
  return <span className="stage-dot" style={{ background: `var(--stage-${stage})` }} />;
}
