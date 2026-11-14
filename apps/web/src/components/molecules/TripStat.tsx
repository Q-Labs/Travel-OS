import { MiniProgress } from '../atoms/MiniProgress';

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
      {progress !== undefined && <MiniProgress value={progress} />}
    </div>
  );
}
