import type { Meta, StoryObj } from '@storybook/react-vite';
import { CatPip } from './CatPip';

const meta = { component: CatPip, args: { color: 'var(--cat-family)' } } satisfies Meta<typeof CatPip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Sized: Story = { args: { size: 16 } };
export const WithHoverText: Story = { args: { title: 'Family' } };
