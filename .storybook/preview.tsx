import type { Preview } from '@storybook/react-vite';
import { sb } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import '@q-labs/cobalt/styles.css';
import '../apps/web/src/styles.css';
import { AppProvider } from '../apps/web/src/app/AppContext';
import type { InitialAppData } from '../apps/web/src/app/AppContext';
import { CobaltRoot } from '../apps/web/src/app/CobaltRoot';

// lib/db talks to Supabase. Its functions keep their real behaviour (a spy), so
// a story can make one answer as it likes with mocked(fn).mockResolvedValue(...).
sb.mock(import('../apps/web/src/lib/db.ts'), { spy: true });

declare module 'storybook/internal/csf' {
  interface Parameters {
    /** The app data a story starts on, for the parts it replaces. The rest is the fixtures. */
    app?: InitialAppData;
    /** The URL a story starts at. A story that needs routes renders its own `<Routes>`. */
    route?: string;
  }
}

// The same wrapping as main.tsx: the app's state (on its fixtures, since no
// Supabase is configured here), then Cobalt's provider, then a router so links
// and navigation work. A story replaces data with `parameters.app` and picks its
// URL with `parameters.route`. The key gives each story a fresh provider, since
// the starting data is only read when it mounts.
const preview: Preview = {
  decorators: [
    (Story, context) => (
      <AppProvider key={context.id} initial={context.parameters.app}>
        <CobaltRoot>
          <MemoryRouter initialEntries={[context.parameters.route ?? '/']}>
            <Story />
          </MemoryRouter>
        </CobaltRoot>
      </AppProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
};

export default preview;
