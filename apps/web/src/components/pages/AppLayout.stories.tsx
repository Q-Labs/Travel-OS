import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ArchivePage } from './ArchivePage';
import { InboxPage } from './InboxPage';
import { PipelinePage } from './PipelinePage';
import { TripDetailPage } from './TripDetailPage';

// The layout is the frame around whichever page the URL names, so each story
// renders the routes it needs and picks its URL.
const meta = {
  component: AppLayout,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Routes>
      <Route path="/app" element={<AppLayout />}>
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="trip/:tripId" element={<TripDetailPage />} />
      </Route>
    </Routes>
  ),
} satisfies Meta<typeof AppLayout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PipelinePageInFrame: Story = { parameters: { route: '/app/pipeline' } };
export const InboxPageInFrame: Story = { parameters: { route: '/app/inbox' } };
export const ArchivePageInFrame: Story = { parameters: { route: '/app/archive' } };
/** A trip's own page has no top bar. */
export const TripPageInFrame: Story = { parameters: { route: '/app/trip/tr-lisbon' } };
export const NoTrips: Story = { parameters: { route: '/app/pipeline', app: { trips: [], tripDetails: {}, insights: [], inbox: [] } } };
