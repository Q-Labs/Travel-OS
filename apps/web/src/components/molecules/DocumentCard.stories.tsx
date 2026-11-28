import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocumentCard } from './DocumentCard';

const meta = { component: DocumentCard } satisfies Meta<typeof DocumentCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Valid: Story = { args: { document: { type: 'passport', title: 'Quincy passport', expiry: '2031-02-14' } } };
/** Under six months left, measured from the app's fixed "today", shows the renewal warning. */
export const ExpiringSoon: Story = { args: { document: { type: 'passport', title: 'Maren passport', expiry: '2026-09-01' } } };
export const Expired: Story = { args: { document: { type: 'passport', title: 'Ezra passport', expiry: '2026-01-01' } } };
export const NoExpiry: Story = { args: { document: { type: 'confirmation', title: 'TAP booking confirmation', expiry: null } } };
