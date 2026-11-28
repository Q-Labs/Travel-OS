import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtureDetail, fixtureTrip } from '../../storybook/fixtures';
import { SplitBudget } from './SplitBudget';

const meta = { component: SplitBudget } satisfies Meta<typeof SplitBudget>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Who paid what against their share, and who owes whom to settle up. */
export const WithSplit: Story = { args: { trip: fixtureTrip('tr-lisbon'), splits: fixtureDetail('tr-lisbon').splits } };
/** Several travelers and no split recorded: the equal-split default is offered. */
export const NoSplitYet: Story = { args: { trip: fixtureTrip('tr-lisbon'), splits: undefined } };
/** A trip with one traveler has nothing to split, so nothing is drawn. */
export const SingleTraveler: Story = { args: { trip: fixtureTrip('tr-hyrox'), splits: undefined } };
