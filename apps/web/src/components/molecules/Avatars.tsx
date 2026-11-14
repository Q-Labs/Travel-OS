import { Avatar } from '@q-labs/cobalt';
import { TRAVELERS } from '../../lib/data';

export function Avatars({ ids, max = 4 }: { ids: string[]; max?: number }) {
  const items = ids.map((id) => TRAVELERS.find((t) => t.id === id)).filter(Boolean) as typeof TRAVELERS;
  const shown = items.slice(0, max);
  const hidden = items.length - shown.length;
  return (
    <div className="tcard-avatars">
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} size="sm" title={p.name} />
      ))}
      {hidden > 0 && <span className="avatar-more">+{hidden}</span>}
    </div>
  );
}
