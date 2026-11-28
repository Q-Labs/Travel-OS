import type { Meta, StoryObj } from '@storybook/react-vite';
import { Topbar } from './Topbar';

const meta = {
  component: Topbar,
  args: { title: 'Good morning, Quincy.', subtitle: 'April 20, 2026 · 2 trips within 30 days' },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Topbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const PageHeading: Story = { args: { title: 'Inbox.', subtitle: 'Forwarded confirmations · 6 items' } };
