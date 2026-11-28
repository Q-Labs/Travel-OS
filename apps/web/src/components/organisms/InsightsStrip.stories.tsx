import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { INSIGHTS } from '../../lib/data';
import { InsightsStrip } from './InsightsStrip';

const meta = {
  component: InsightsStrip,
  args: { insights: INSIGHTS, onOpen: fn(), onDismiss: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof InsightsStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleInsight: Story = { args: { insights: INSIGHTS.slice(0, 1) } };
/** An insight with no trip is not clickable, though it can still be dismissed. */
export const NotTiedToATrip: Story = { args: { insights: [{ ...INSIGHTS[0], id: 'i-general', trip_id: '' }] } };
/** With no insights, nothing is drawn. */
export const NoInsights: Story = { args: { insights: [] } };
