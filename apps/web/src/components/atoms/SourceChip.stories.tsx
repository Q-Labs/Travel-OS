import type { Meta, StoryObj } from '@storybook/react-vite';
import { SourceChip } from './SourceChip';

const meta = { component: SourceChip } satisfies Meta<typeof SourceChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Forwarded: Story = { args: { source: 'email' } };
export const Gmail: Story = { args: { source: 'gmail' } };
export const Extension: Story = { args: { source: 'extension' } };
export const Manual: Story = { args: { source: 'manual' } };
export const Api: Story = { args: { source: 'api' } };
export const Viator: Story = { args: { source: 'viator' } };
/** With a count the chip is a tally. */
export const WithCount: Story = { args: { source: 'email', count: 3 } };
/** A source that is not listed is shown as Manual. */
export const UnknownSource: Story = { args: { source: 'carrier-pigeon' } };
/** With no source, nothing is drawn. */
export const NoSource: Story = { args: {} };
