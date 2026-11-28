import type { Meta, StoryObj } from '@storybook/react-vite';
import { StageDot } from './StageDot';

const meta = { component: StageDot } satisfies Meta<typeof StageDot>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Dreaming: Story = { args: { stage: 'dreaming' } };
export const Planning: Story = { args: { stage: 'planning' } };
export const Booked: Story = { args: { stage: 'booked' } };
export const Upcoming: Story = { args: { stage: 'upcoming' } };
export const Archived: Story = { args: { stage: 'archived' } };
