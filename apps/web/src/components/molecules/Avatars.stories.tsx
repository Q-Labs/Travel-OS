import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatars } from './Avatars';

const meta = { component: Avatars } satisfies Meta<typeof Avatars>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { ids: ['t1', 't2'] } };
/** Past `max`, the rest are counted as `+n`. */
export const Overflow: Story = { args: { ids: ['t1', 't2', 't3', 't4', 't5'], max: 3 } };
/** Ids that match no traveler are skipped, so nothing is drawn. */
export const UnknownTravelers: Story = { args: { ids: ['x1', 'x2'] } };
