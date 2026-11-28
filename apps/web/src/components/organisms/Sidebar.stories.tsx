import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sidebar } from './Sidebar';

const meta = { component: Sidebar, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Sidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** With no trips or inbox items, the counts are zero and the category filters disappear. */
export const EmptyApp: Story = { parameters: { app: { trips: [], tripDetails: {}, insights: [], inbox: [] } } };
