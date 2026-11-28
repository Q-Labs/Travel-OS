import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TRIPS } from '../../lib/data';
import { YearRibbon } from './YearRibbon';

const meta = {
  component: YearRibbon,
  args: { trips: TRIPS.filter((t) => t.stage !== 'archived'), onOpen: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof YearRibbon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** Overlapping trips are set on two rows so they do not cover each other. */
export const OverlappingTrips: Story = {
  args: {
    trips: TRIPS.filter((t) => ['tr-mexico', 'tr-catskills', 'tr-hyrox'].includes(t.id)).map((t, i) =>
      i === 0 ? { ...t, start_date: '2026-04-22', end_date: '2026-05-10' } : t,
    ),
  },
};
export const NoTrips: Story = { args: { trips: [] } };
