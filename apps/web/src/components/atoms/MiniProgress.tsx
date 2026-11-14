export function MiniProgress({ value }: { value: number }) {
  return (
    <div className="mini-progress">
      <div style={{ width: `${value}%` }} />
    </div>
  );
}
