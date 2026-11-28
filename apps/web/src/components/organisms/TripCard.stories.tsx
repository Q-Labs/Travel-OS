import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { fixtureTrip } from '../../storybook/fixtures';
import { TripCard } from './TripCard';

const meta = {
  component: TripCard,
  args: { trip: fixtureTrip('tr-lisbon'), onClick: fn() },
  decorators: [(Story) => <div style={{ width: 280 }}><Story /></div>],
} satisfies Meta<typeof TripCard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A trip with no dates yet shows its rough timing instead of a countdown. */
export const Dreaming: Story = { args: { trip: fixtureTrip('tr-kyoto') } };
/** More than 60 days out, the countdown is in weeks. */
export const FarOut: Story = {};
/** Booked and upcoming trips show a budget bar. */
export const Booked: Story = { args: { trip: fixtureTrip('tr-iceland') } };
/** Within 60 days, the countdown is in days. */
export const StartingSoon: Story = { args: { trip: fixtureTrip('tr-catskills') } };
export const StartsToday: Story = {
  args: { trip: { ...fixtureTrip('tr-catskills'), start_date: '2026-04-20', end_date: '2026-04-22' } },
};
export const UnderWay: Story = {
  args: { trip: { ...fixtureTrip('tr-catskills'), start_date: '2026-04-18', end_date: '2026-04-22' } },
};
export const Archived: Story = { args: { trip: fixtureTrip('tr-rome') } };
/** With `onDragStart` the card can be dragged between pipeline columns. */
export const Draggable: Story = { args: { onDragStart: fn(), onDragEnd: fn() } };
/** The look of a card while it is being dragged. */
export const BeingDragged: Story = { args: { onDragStart: fn(), onDragEnd: fn(), isDragging: true } };
