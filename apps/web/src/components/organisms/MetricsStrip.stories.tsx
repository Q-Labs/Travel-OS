import type { Meta, StoryObj } from '@storybook/react-vite';
import { TRIPS } from '../../lib/data';
import { MetricsStrip } from './MetricsStrip';

const meta = { component: MetricsStrip, args: { trips: TRIPS }, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof MetricsStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** With no trips there is no next trip, and spend is zero. */
export const NoTrips: Story = { args: { trips: [] } };
