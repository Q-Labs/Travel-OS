import type { StorybookConfig } from '@storybook/react-vite';

// Every component has a Name.stories.tsx beside it (components/stories.test.ts
// enforces that). Storybook reads the root vite.config.ts, so the React plugin
// and the Cobalt handling are the app's own.
const config: StorybookConfig = {
  stories: ['../apps/web/src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  // No usage reporting from this project, locally or in CI.
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  // Stories run on fixtures, whatever is in a developer's .env. With
  // VITE_SUPABASE_URL set, AppProvider would subscribe to Supabase, find no
  // session and empty the app, wiping the data a story asked for. So only the
  // feature flags and Storybook's own variables are exposed to stories, and the
  // Supabase credentials never are.
  viteFinal: (viteConfig) => ({ ...viteConfig, envPrefix: ['VITE_FLAG_', 'STORYBOOK_'] }),
};

export default config;
