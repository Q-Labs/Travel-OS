import type { Meta, StoryObj } from '@storybook/react-vite';
import { IntegrationsModal } from './IntegrationsModal';

const meta = { component: IntegrationsModal, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof IntegrationsModal>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Without a token there is no calendar feed or forwarding address, so neither shows as connected. */
export const NoToken: Story = {};
/** With a token the calendar and forwarding rows are connected, and the calendar row can reveal its feed URL. */
export const WithToken: Story = { parameters: { app: { inboxToken: 'a1b2c3' } } };
