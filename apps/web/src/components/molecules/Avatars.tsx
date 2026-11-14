import { TRAVELERS } from '../../lib/data';
import { Avatar } from '../atoms/Avatar';

export function Avatars({ ids, max = 4 }: { ids: string[]; max?: number }) {
  const items = ids.map((id) => TRAVELERS.find((t) => t.id === id)).filter(Boolean) as typeof TRAVELERS;
  const shown = items.slice(0, max);
  const hidden = items.length - shown.length;
  return (
    <div className="tcard-avatars">
      {shown.map((p) => (
        <Avatar key={p.id} title={p.name}>{p.initials}</Avatar>
      ))}
      {hidden > 0 && <Avatar muted>+{hidden}</Avatar>}
    </div>
  );
}
