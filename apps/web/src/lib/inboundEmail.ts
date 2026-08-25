/**
 * Adapters for inbound-email webhooks.
 *
 * Each provider posts a different payload shape; this module flattens them onto
 * the single `raw` shape `api/inbox/ingest.ts` already validates, so swapping
 * provider is a config change rather than a code change.
 *
 * Everything here is pure — no network, no secrets — which is what lets the
 * whole inbound path be tested without an account anywhere.
 */

export const SUPPORTED_PROVIDERS = ['postmark', 'sendgrid', 'cloudflare'] as const;
export type Provider = (typeof SUPPORTED_PROVIDERS)[number];

export type NormalizedEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  receivedAt: string;
};

export function isSupportedProvider(value: string): value is Provider {
  return (SUPPORTED_PROVIDERS as readonly string[]).includes(value);
}

/**
 * Pulls the routing token out of a plus-addressed recipient, e.g.
 * `quincy+a1b2c3@travelos.app` → `a1b2c3`. Returns null when the address
 * carries no tag, which is how an unroutable message gets rejected.
 */
export function extractInboxToken(address: string): string | null {
  const angled = /<([^>]+)>/.exec(address);
  const bare = (angled ? angled[1] : address) as string;
  const match = /^[^@+\s]+\+([^@\s]+)@[^@\s]+$/.exec(bare.trim());
  return match ? (match[1] as string).toLowerCase() : null;
}

function str(source: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

export function normalizeInboundEmail(provider: string, payload: unknown): NormalizedEmail | null {
  if (!isSupportedProvider(provider)) return null;
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as Record<string, unknown>;

  const from = provider === 'postmark' ? str(body, 'From') : str(body, 'from');
  const to = provider === 'postmark' ? str(body, 'OriginalRecipient', 'To') : str(body, 'to');
  const subject = provider === 'postmark' ? str(body, 'Subject') : str(body, 'subject');
  const text = provider === 'postmark'
    ? str(body, 'TextBody', 'HtmlBody')
    : str(body, 'text', 'html');

  if (!from || !to || !subject || !text) return null;

  const receivedAt = provider === 'postmark'
    ? str(body, 'Date')
    : str(body, 'receivedAt', 'timestamp');

  return { from, to, subject, text, receivedAt: receivedAt ?? '' };
}
