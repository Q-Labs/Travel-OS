import type { Meta, StoryObj } from '@storybook/react-vite';
import { InboxPage } from './InboxPage';

const meta = { component: InboxPage, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof InboxPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Without a token there is no forwarding address yet, so the copy button is disabled. */
export const NoForwardingAddress: Story = {};
export const WithForwardingAddress: Story = { parameters: { app: { inboxToken: 'a1b2c3' } } };
export const InboxZero: Story = { parameters: { app: { inbox: [], inboxToken: 'a1b2c3' } } };
