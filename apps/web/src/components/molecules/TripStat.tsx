import { ProgressMini } from '@q-labs/cobalt';

/** One figure on a trip: a label and its value, with an optional smaller line under it and an optional progress bar. */
export function TripStat({
  label,
  value,
  subvalue,
  progress,
}: {
  label: string;
  value: string;
  subvalue?: string;
  progress?: number;
}) {
  return (
    <div className="trip-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {subvalue && <small>{subvalue}</small>}
      {progress !== undefined && <ProgressMini value={progress} />}
    </div>
  );
}
