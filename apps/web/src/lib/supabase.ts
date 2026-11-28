import { createClient } from '@supabase/supabase-js';

/* v8 ignore start */
/**
 * The browser's Supabase client. Without `VITE_SUPABASE_URL` and
 * `VITE_SUPABASE_ANON_KEY` it points at a placeholder, so the app still loads
 * (on fixtures) and a build needs no credentials.
 */
export const supabase = createClient(
  import.meta.env['VITE_SUPABASE_URL'] ?? 'https://placeholder.supabase.co',
  import.meta.env['VITE_SUPABASE_ANON_KEY'] ?? 'placeholder-key',
);
/* v8 ignore end */
