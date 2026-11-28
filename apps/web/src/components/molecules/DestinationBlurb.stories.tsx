import type { Meta, StoryObj } from '@storybook/react-vite';
import { mockFetch } from '../../storybook/fetch';
import { DestinationBlurb } from './DestinationBlurb';

// The component asks Wikipedia for a summary. Each story answers that request
// itself, so the result is the same every time and needs no network.
const meta = { component: DestinationBlurb, args: { destination: 'Lisbon' } } satisfies Meta<typeof DestinationBlurb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  beforeEach: () =>
    mockFetch(async () =>
      Response.json({
        type: 'standard',
        title: 'Lisbon',
        extract: 'Lisbon is the capital and largest city of Portugal, on the Tagus estuary.',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Lisbon' } },
      }),
    ),
};
/** While the summary is on its way, nothing is drawn. */
export const Loading: Story = { beforeEach: () => mockFetch(() => new Promise<Response>(() => undefined)) };
/** A page with no summary, or a failed request, draws nothing; the overview reads fine without it. */
export const Unavailable: Story = { beforeEach: () => mockFetch(async () => new Response('', { status: 404 })) };
/** A disambiguation page is a list of options, not a description, so it is left out. */
export const DisambiguationPage: Story = {
  beforeEach: () => mockFetch(async () => Response.json({ type: 'disambiguation', title: 'Lisbon', extract: 'Lisbon may refer to:' })),
};
