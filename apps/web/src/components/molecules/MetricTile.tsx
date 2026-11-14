import type { CSSProperties, ReactNode } from 'react';

export function MetricTile({
  label,
  value,
  hint,
  pop,
  hintStyle,
}: {
  label: ReactNode;
  value: ReactNode;
  hint: ReactNode;
  pop?: boolean;
  hintStyle?: CSSProperties;
}) {
  return (
    <div className={`metric${pop ? ' pop' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="hint" style={hintStyle}>{hint}</div>
    </div>
  );
}
