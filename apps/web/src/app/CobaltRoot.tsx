import type { CSSProperties, ReactNode } from 'react';
import { CobaltProvider } from '@q-labs/cobalt';
import { accentTokens } from '../lib/accents';
import { useApp } from './AppContext';

/**
 * Wraps the app in Cobalt's provider, with the theme and accent the user chose.
 * Cobalt's tokens and components read the theme from a `data-theme` ancestor
 * and re-declare their tokens on every such element, so the accent override
 * must sit on this same element (an inline style beats the selector); set
 * anywhere above it, the override would be silently re-declared away.
 */
export function CobaltRoot({ children }: { children: ReactNode }) {
  const { theme, accent } = useApp();
  return (
    <CobaltProvider theme={theme} style={accentTokens(accent, theme) as CSSProperties}>
      {children}
    </CobaltProvider>
  );
}
