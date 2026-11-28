import type { Meta, StoryObj } from '@storybook/react-vite';
import { ParsedCard } from './ParsedCard';

const meta = { component: ParsedCard } satisfies Meta<typeof ParsedCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Flight: Story = {
  args: { parsed: { type: 'flight', title: 'Icelandair EWR → KEF', dates: 'Jul 8, 2026', cost: 3120, confirmation: 'FI-7K2X9' } },
};
/** No cost and no confirmation code: both are left out. */
export const NoCostOrCode: Story = {
  args: { parsed: { type: 'dining', title: 'Belcanto · 8:00 PM, party of 2', dates: 'Sep 18, 2026', cost: 0, confirmation: null } },
};
export const WithNote: Story = {
  args: {
    parsed: {
      type: 'lodging',
      title: 'Beppu Onsen house (saved listing)',
      dates: '—',
      cost: 0,
      confirmation: null,
      note: 'Listing saved for research',
    },
  },
};
