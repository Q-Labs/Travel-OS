import type { StorybookConfig } from '@storybook/react-vite';

// Every component has a Name.stories.tsx beside it (components/stories.test.ts
// enforces that). Storybook reads the root vite.config.ts, so the React plugin
// and the Cobalt handling are the app's own.
const config: StorybookConfig = {
  stories: ['../apps/web/src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  // No usage reporting from this project, locally or in CI.
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
};

export default config;
