import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtureTrip } from '../../storybook/fixtures';
import { mockFetch } from '../../storybook/fetch';
import { BudgetConversion } from './BudgetConversion';

// The component asks Frankfurter for rates. Each story answers that request
// itself, so the result is the same every time and needs no network.
const euroTrip = { ...fixtureTrip('tr-lisbon'), budget_currency: 'EUR', budget_total: 4000 };

const meta = { component: BudgetConversion, args: { trip: euroTrip } } satisfies Meta<typeof BudgetConversion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Converted: Story = {
  beforeEach: () => mockFetch(async () => Response.json({ base: 'USD', rates: { EUR: 0.92 } })),
};
/** In the home currency there is nothing to convert, so nothing is drawn. */
export const HomeCurrency: Story = { args: { trip: { ...euroTrip, budget_currency: 'USD' } } };
/** While the rates are on their way, nothing is drawn. */
export const Loading: Story = { beforeEach: () => mockFetch(() => new Promise<Response>(() => undefined)) };
/** If the rates cannot be fetched, nothing is drawn and the budget still shows in its own currency elsewhere. */
export const RatesUnavailable: Story = { beforeEach: () => mockFetch(async () => new Response('', { status: 503 })) };
