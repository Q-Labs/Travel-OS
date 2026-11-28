import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { fixtureInboxItem, fixtureTrip } from '../../storybook/fixtures';
import { InboxRow } from './InboxRow';

const suggested = (id: string) => {
  const trip = fixtureTrip(id);
  return { id: trip.id, destination: trip.destination, cover: trip.cover };
};

const meta = {
  component: InboxRow,
  args: { item: fixtureInboxItem('in-1'), suggestedTrip: suggested('tr-marrakech'), onOpen: fn(), onAssign: fn(), onDismiss: fn() },
} satisfies Meta<typeof InboxRow>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Read, with a trip suggested at high confidence. */
export const ParsedWithSuggestion: Story = {};
/** Still being read: a shimmer in place of the booking. */
export const Parsing: Story = { args: { item: fixtureInboxItem('in-2'), suggestedTrip: undefined } };
export const NeedsReview: Story = { args: { item: fixtureInboxItem('in-6'), suggestedTrip: suggested('tr-iceland') } };
/** A saved listing waiting to be filed under a trip, with a lower-confidence suggestion. */
export const PendingTrip: Story = { args: { item: fixtureInboxItem('in-4'), suggestedTrip: suggested('tr-kyoto') } };
export const NoSuggestion: Story = { args: { item: { ...fixtureInboxItem('in-3'), suggested_trip: undefined }, suggestedTrip: undefined } };
