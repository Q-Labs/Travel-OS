import type { Meta, StoryObj } from '@storybook/react-vite';
import { Route, Routes } from 'react-router-dom';
import { TripDetailPage } from './TripDetailPage';

// The page reads the trip id from the URL, so each story picks its URL.
const meta = {
  component: TripDetailPage,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Routes>
      <Route path="/app/trip/:tripId" element={<TripDetailPage />} />
    </Routes>
  ),
} satisfies Meta<typeof TripDetailPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { parameters: { route: '/app/trip/tr-lisbon' } };
/** A trip with no detail row yet gets an empty one. */
export const NoDetailYet: Story = { parameters: { route: '/app/trip/tr-kyoto' } };
export const TripNotFound: Story = { parameters: { route: '/app/trip/no-such-trip' } };
