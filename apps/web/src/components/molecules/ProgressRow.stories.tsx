import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressRow } from './ProgressRow';

const meta = { component: ProgressRow, args: { label: 'Bookings' } } satisfies Meta<typeof ProgressRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = { args: { value: '3 of 5', progress: 60 } };
export const Complete: Story = { args: { value: '5 of 5', progress: 100 } };
export const NotStarted: Story = { args: { value: '0 of 5', progress: 0 } };
