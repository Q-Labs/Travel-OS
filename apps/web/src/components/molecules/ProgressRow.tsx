import { ProgressMini } from '@q-labs/cobalt';

/** A label and its value above a progress bar. */
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
