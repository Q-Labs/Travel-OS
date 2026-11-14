import type { ReactNode } from 'react';
import { CobaltProvider } from '@q-labs/cobalt';
import { useApp } from './AppContext';

// Cobalt's tokens and components read the theme from a data-theme ancestor.
export function CobaltRoot({ children }: { children: ReactNode }) {
  const { theme } = useApp();
  return <CobaltProvider theme={theme}>{children}</CobaltProvider>;
}
