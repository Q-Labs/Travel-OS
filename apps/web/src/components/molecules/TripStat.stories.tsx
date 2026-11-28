import type { Meta, StoryObj } from '@storybook/react-vite';
import { TripStat } from './TripStat';

const meta = { component: TripStat, args: { label: 'Countdown', value: '20 days' } } satisfies Meta<typeof TripStat>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
export const WithSubvalue: Story = { args: { label: 'Budget', value: '$3,200', subvalue: 'of $4,000' } };
export const WithProgress: Story = { args: { label: 'Budget', value: '$3,200', subvalue: 'of $4,000', progress: 80 } };
