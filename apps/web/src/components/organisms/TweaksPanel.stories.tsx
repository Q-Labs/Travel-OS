import type { Meta, StoryObj } from '@storybook/react-vite';
import { TweaksPanel } from './TweaksPanel';

const meta = { component: TweaksPanel, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof TweaksPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
