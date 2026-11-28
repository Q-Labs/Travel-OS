import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { CAT_MAP } from '../../lib/utils';
import type { TripCategory } from '../../lib/types';
import { Icon } from '../atoms/Icon';
import { InsightsStrip } from '../organisms/InsightsStrip';
import { KanbanBoard } from '../organisms/KanbanBoard';
import { MetricsStrip } from '../organisms/MetricsStrip';
import { YearRibbon } from '../organisms/YearRibbon';

/**
 * The pipeline page: the summary cards, the year ribbon, the insights strip and
 * the board of trips that are not archived. The category filters in force show
 * as chips that can be removed or cleared.
 */
export function PipelinePage() {
  const {
    trips, searchedTrips, insights,
    categoryFilter, toggleCategoryFilter,
    moveStage, dismissInsight,
  } = useApp();
  const navigate = useNavigate();
  const openTrip = (id: string) => navigate(`/app/trip/${id}`);

  const activeTrips = searchedTrips.filter((t) => t.stage !== 'archived');

  return (
    <div className="dashboard">
      <MetricsStrip trips={trips} />
      <YearRibbon trips={trips.filter((t) => t.stage !== 'archived')} onOpen={openTrip} />

      <div className="pipeline-head">
        <h3>Pipeline <em>· {activeTrips.length} trips in motion</em></h3>
        {categoryFilter.length > 0 && (
          <div className="filter-chips">
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Filter:</span>
            {categoryFilter.map((k) => (
              <button key={k} className="chip on" onClick={() => toggleCategoryFilter(k)}>
                <span className="sw" style={{ background: CAT_MAP[k as TripCategory]?.color }} />
                {CAT_MAP[k as TripCategory]?.label}
                <Icon.Close style={{ width: 10, height: 10 }} />
              </button>
            ))}
            <button className="chip" onClick={() => categoryFilter.forEach((k) => toggleCategoryFilter(k))}>
              Clear
            </button>
          </div>
        )}
      </div>

      <KanbanBoard
        trips={activeTrips}
        categoryFilter={categoryFilter}
        onOpen={openTrip}
        onMove={moveStage}
      />

      <InsightsStrip insights={insights} onOpen={openTrip} onDismiss={dismissInsight} />
    </div>
  );
}
