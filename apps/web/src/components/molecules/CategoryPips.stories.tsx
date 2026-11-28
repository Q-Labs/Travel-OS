import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryPips } from './CategoryPips';

const meta = { component: CategoryPips } satisfies Meta<typeof CategoryPips>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Several: Story = { args: { cats: ['family', 'couple', 'race'] } };
export const Single: Story = { args: { cats: ['solo'] } };
export const NoCategories: Story = { args: { cats: [] } };
