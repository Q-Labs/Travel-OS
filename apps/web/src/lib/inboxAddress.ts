/**
 * Where forwarded confirmations should be sent.
 *
 * The local part carries the user's routing token as a plus-tag, which is how
 * `api/inbox/ingest.ts` attributes an inbound message to an account. Both parts
 * are configurable because they depend on whichever domain and inbound provider
 * a deployment actually uses.
 */
export const INBOX_DOMAIN = import.meta.env['VITE_INBOX_DOMAIN'] ?? 'travelos.app';
export const INBOX_MAILBOX = import.meta.env['VITE_INBOX_MAILBOX'] ?? 'trips';
