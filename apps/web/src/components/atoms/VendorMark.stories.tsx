import type { Meta, StoryObj } from '@storybook/react-vite';
import { VendorMark } from './VendorMark';

const meta = { component: VendorMark } satisfies Meta<typeof VendorMark>;
export default meta;
type Story = StoryObj<typeof meta>;

export const KnownVendor: Story = { args: { vendor: 'United Airlines' } };
/** A vendor we have no brand colour for gets a neutral badge with its first letter. */
export const UnknownVendor: Story = { args: { vendor: 'Acme Rentals' } };
