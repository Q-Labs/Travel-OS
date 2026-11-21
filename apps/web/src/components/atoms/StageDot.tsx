import type { TripStage } from '../../lib/types';

export function StageDot({ stage }: { stage: TripStage }) {
  return <span className="stage-dot" style={{ background: `var(--stage-${stage})` }} />;
}
