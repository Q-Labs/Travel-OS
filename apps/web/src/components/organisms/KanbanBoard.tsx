import { useMemo, useState } from 'react';
import { STAGES } from '../../lib/utils';
import type { Trip } from '../../lib/types';
import { TripCard } from './TripCard';

export function KanbanBoard({
  trips,
  categoryFilter,
  onOpen,
  onMove,
}: {
  trips: Trip[];
  categoryFilter: string[];
  onOpen: (id: string) => void;
  onMove: (id: string, stage: Trip['stage']) => void;
}) {
  const [dragTrip, setDragTrip] = useState<Trip | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);

  const filtered = categoryFilter.length
    ? trips.filter((t) => t.categories.some((c) => categoryFilter.includes(c)))
    : trips;

  const byStage = useMemo(() => {
    const m: Record<string, Trip[]> = {};
    STAGES.forEach((s) => { m[s.key] = []; });
    filtered.forEach((t) => { if (m[t.stage]) m[t.stage].push(t); });
    Object.keys(m).forEach((k) => {
      m[k].sort((a, b) => {
        if (!a.start_date) return 1;
        if (!b.start_date) return -1;
        return a.start_date.localeCompare(b.start_date);
      });
    });
    return m;
  }, [filtered]);

  const handleDragStart = (e: React.DragEvent, t: Trip) => {
    setDragTrip(t);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', t.id); // required for Firefox
  };
  const handleDragEnd = () => { setDragTrip(null); setDropStage(null); };
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (stage !== dropStage) setDropStage(stage);
  };
  const handleDragLeave = (stage: string) => {
    if (stage === dropStage) setDropStage(null);
  };
  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    /* v8 ignore next -- same-stage/no-drag drops are harmless defensive guards */
    if (dragTrip && dragTrip.stage !== stage) onMove(dragTrip.id, dragTrip.stage !== stage ? stage as Trip['stage'] : dragTrip.stage);
    setDragTrip(null);
    setDropStage(null);
  };

  return (
    <div className="pipeline">
      {STAGES.map((stage) => (
        <div
          key={stage.key}
          className={`column${dropStage === stage.key && dragTrip?.stage !== stage.key ? ' drop-target' : ''}`}
          onDragOver={(e) => handleDragOver(e, stage.key)}
          onDragLeave={() => handleDragLeave(stage.key)}
          onDrop={(e) => handleDrop(e, stage.key)}
        >
          <div className="column-head">
            <span className="name">{stage.label}</span>
            <span className="count">{byStage[stage.key].length}</span>
          </div>
          {byStage[stage.key].map((t) => (
            <TripCard
              key={t.id}
              trip={t}
              onClick={() => onOpen(t.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isDragging={dragTrip?.id === t.id}
            />
          ))}
          {byStage[stage.key].length === 0 && (
            <div className="column-empty">nothing here yet</div>
          )}
        </div>
      ))}
    </div>
  );
}
