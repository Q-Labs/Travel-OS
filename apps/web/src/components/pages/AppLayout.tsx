import { Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { TODAY } from '../../lib/data';
import { daysBetween } from '../../lib/utils';
import type { Trip } from '../../lib/types';
import { DashboardLayout } from '@q-labs/cobalt';
import { AddTripModal } from '../organisms/AddTripModal';
import { IntegrationsModal } from '../organisms/IntegrationsModal';
import { Sidebar } from '../organisms/Sidebar';
import { Topbar } from '../organisms/Topbar';
import { TweaksPanel } from '../organisms/TweaksPanel';

type OutletCtx = { trips: Trip[] };

export function localDateLabel(utcDate: Date): string {
  return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate())
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function greeting(h = new Date().getHours()) {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function AppLayout() {
  const { trips, inbox, showModal, showIntegrations, tweaksOpen } = useApp();
  const { pathname } = useLocation();
  const segment = pathname.split('/')[2];

  const soonCount = trips.filter((t) => {
    if (!t.start_date) return false;
    const d = daysBetween(TODAY, t.start_date);
    return d >= 0 && d <= 30;
  }).length;

  const todayLabel = localDateLabel(TODAY);

  const soonLabel = /* v8 ignore next */ soonCount === 1 ? `${soonCount} trip within 30 days` : `${soonCount} trips within 30 days`;

  const topbarContent: Record<string, { title: string; subtitle: string }> = {
    pipeline: { title: `${greeting()}, Quincy.`, subtitle: `${todayLabel} · ${soonLabel}` },
    inbox: { title: 'Inbox.', subtitle: `Forwarded confirmations · ${inbox.length} items` },
    calendar: { title: 'Calendar.', subtitle: 'Everything in motion on one page' },
    archive: { title: 'Archive.', subtitle: "Every trip you've completed" },
  };
  const topbar = topbarContent[segment];

  return (
    <>
      <DashboardLayout
        sidebar={<Sidebar />}
        topbar={topbar ? <Topbar title={topbar.title} subtitle={topbar.subtitle} /> : null}
      >
        <Outlet context={{ trips } satisfies OutletCtx} />
      </DashboardLayout>
      {showModal && <AddTripModal />}
      {showIntegrations && <IntegrationsModal />}
      {tweaksOpen && <TweaksPanel />}
    </>
  );
}
