import { ProgressMini } from '@q-labs/cobalt';

export function ProgressRow({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="progress-row">
      <div>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <ProgressMini value={progress} />
    </div>
  );
}
