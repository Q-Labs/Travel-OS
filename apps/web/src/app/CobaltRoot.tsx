import type { CSSProperties, ReactNode } from 'react';
import { CobaltProvider } from '@q-labs/cobalt';
import { accentTokens } from '../lib/accents';
import { useApp } from './AppContext';

// Cobalt's tokens and components read the theme from a data-theme ancestor.
// Cobalt re-declares its tokens on every [data-theme] element, so the accent
// override must sit on this same element (inline style beats the selector);
// set anywhere above it, the override would be silently re-declared away.
export function CobaltRoot({ children }: { children: ReactNode }) {
  const { theme, accent } = useApp();
  return (
    <CobaltProvider theme={theme} style={accentTokens(accent, theme) as CSSProperties}>
      {children}
    </CobaltProvider>
  );
}
