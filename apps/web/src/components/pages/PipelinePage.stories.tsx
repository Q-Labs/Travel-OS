import type { Meta, StoryObj } from '@storybook/react-vite';
import { PipelinePage } from './PipelinePage';

const meta = { component: PipelinePage, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof PipelinePage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoInsights: Story = { parameters: { app: { insights: [] } } };
/** With nothing planned, every column says so. */
export const NoTrips: Story = { parameters: { app: { trips: [], tripDetails: {}, insights: [] } } };
