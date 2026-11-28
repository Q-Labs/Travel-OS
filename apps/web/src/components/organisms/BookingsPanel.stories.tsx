import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { fixtureDetail } from '../../storybook/fixtures';
import { BookingsPanel } from './BookingsPanel';

const detail = fixtureDetail('tr-lisbon');

const meta = {
  component: BookingsPanel,
  args: { detail, tripId: 'tr-lisbon', currency: 'USD', onToggleStatus: fn() },
} satisfies Meta<typeof BookingsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const InEuros: Story = { args: { currency: 'EUR' } };
export const NoBookings: Story = { args: { detail: { ...detail, bookings: [] } } };
