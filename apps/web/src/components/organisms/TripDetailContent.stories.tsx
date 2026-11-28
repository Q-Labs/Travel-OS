import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { fixtureDetail, fixtureTrip } from '../../storybook/fixtures';
import { TripDetailContent } from './TripDetailContent';

const meta = {
  component: TripDetailContent,
  args: {
    trip: fixtureTrip('tr-lisbon'),
    tripId: 'tr-lisbon',
    detail: fixtureDetail('tr-lisbon'),
    updateTrip: fn(),
    togglePacked: fn(),
    toggleBookingStatus: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TripDetailContent>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** A trip with an itinerary, bookings, packing and documents all empty. */
export const EmptyDetail: Story = {
  args: {
    detail: { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [] },
  },
};
/** A trip that is still an idea: no dates, no detail. */
export const NoDatesYet: Story = {
  args: {
    trip: fixtureTrip('tr-kyoto'),
    tripId: 'tr-kyoto',
    detail: { itinerary: [], bookings: [], budget_breakdown: [], packing: [], documents: [] },
  },
};
