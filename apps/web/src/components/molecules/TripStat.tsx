import { ProgressMini } from '@q-labs/cobalt';

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
