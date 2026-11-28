import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TRIPS } from '../../lib/data';
import { KanbanBoard } from './KanbanBoard';

// The pipeline page hands the board the trips that are not archived.
const active = TRIPS.filter((t) => t.stage !== 'archived');

const meta = {
  component: KanbanBoard,
  args: { trips: active, categoryFilter: [], onOpen: fn(), onMove: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof KanbanBoard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** With category filters in force, only matching trips stay on the board. */
export const Filtered: Story = { args: { categoryFilter: ['family'] } };
/** A column with nothing in it says so. */
export const Empty: Story = { args: { trips: [] } };
