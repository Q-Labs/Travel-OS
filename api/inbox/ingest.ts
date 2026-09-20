import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extractInboxToken, normalizeInboundEmail } from '../../apps/web/src/lib/inboundEmail';

interface IngestBody {
  userId: string;
  source?: string;
  raw: { subject: string; from: string; receivedAt: string; text: string };
}

interface ParsedResult {
  vendor: string;
  type: string;
  title: string;
  dates: string;
  cost: number;
  confirmation: string | null;
  suggested_trip: string | null;
  suggested_confidence: number;
}

type ResolvedIngest = {
  userId: string;
  source: string;
  raw: IngestBody['raw'];
};

function isValidBody(b: unknown): b is IngestBody {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  if (typeof o['userId'] !== 'string' || !o['raw']) return false;
  const r = o['raw'] as Record<string, unknown>;
  return (
    typeof r['subject'] === 'string' &&
    typeof r['text'] === 'string' &&
    typeof r['from'] === 'string' &&
    typeof r['receivedAt'] === 'string'
  );
}

function isAuthorized(req: Request, url: URL): boolean {
  const expected = process.env['INGEST_SECRET'];
  if (!expected) return false;
  if (req.headers.get('x-ingest-secret') === expected) return true;
  if (url.searchParams.get('secret') === expected) return true;
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Basic ')) {
    // Buffer.from is lenient with malformed base64 -- it yields garbage rather
    // than throwing -- so a bad header simply fails the comparison below.
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    // Either half may carry the secret, depending on how the provider is set up.
    const [user, pass] = decoded.split(':');
    if (user === expected || pass === expected) return true;
  }
  return false;
}

/**
 * `received_ago` is rendered directly in the inbox, so a raw provider value
 * ("Mon, 20 Apr 2026 12:00:00 -0400", or '' from Cloudflare) would leak into
 * the UI. Anything parseable becomes an ISO timestamp the UI can render as a
 * relative time; anything else falls back to the ingest time.
 */
export function normalizeReceivedAt(value: string, fallback: Date): string {
  const parsed = value ? new Date(value) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return fallback.toISOString();
}

export function createIngestHandler({
  anthropic,
  supabase,
  now,
}: {
  anthropic: Pick<Anthropic, 'messages'>;
  supabase: SupabaseClient;
  now: () => Date;
}) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const url = new URL(req.url);

    // Inbound-email providers configure a URL and nothing else -- Postmark's
    // webhook settings have no field for a custom header -- so the shared
    // secret is also accepted as a query parameter or as HTTP basic auth.
    if (!isAuthorized(req, url)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // `?provider=postmark|sendgrid|cloudflare` marks an inbound-email webhook.
    // Those callers can't supply a userId — they only know the address the mail
    // was sent to — so the user is resolved from the recipient's plus-tag token.
    const provider = url.searchParams.get('provider');

    // SendGrid's Inbound Parse posts multipart/form-data, not JSON.
    let payload: unknown;
    const contentType = req.headers.get('content-type') ?? '';
    try {
      if (contentType.includes('multipart/form-data') || contentType.includes('x-www-form-urlencoded')) {
        payload = Object.fromEntries(await req.formData());
      } else {
        payload = await req.json();
      }
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    let body: ResolvedIngest;

    if (provider !== null) {
      const email = normalizeInboundEmail(provider, payload);
      if (!email) {
        return Response.json({ error: 'Unsupported or malformed inbound payload' }, { status: 400 });
      }
      const token = extractInboxToken(email.to);
      if (!token) {
        return Response.json({ error: 'Recipient carries no inbox token' }, { status: 400 });
      }
      const { data: tokenRow } = await supabase
        .from('user_inbox_tokens')
        .select('user_id')
        .eq('token', token)
        .maybeSingle();
      const userId = (tokenRow as { user_id: string } | null)?.user_id;
      if (!userId) {
        return Response.json({ error: 'Unknown inbox token' }, { status: 404 });
      }
      body = {
        userId,
        // Provider names are not members of BookingSource; storing one makes the
        // UI's SourceChip fall back to "Manual" and leaves the "Forwarded"
        // counter at zero. Everything arriving by mail is 'email'.
        source: 'email',
        raw: {
          subject: email.subject,
          from: email.from,
          receivedAt: normalizeReceivedAt(email.receivedAt, now()),
          text: email.text,
        },
      };
    } else {
      if (!isValidBody(payload)) {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
      }
      body = { userId: payload.userId, source: payload.source ?? 'email', raw: payload.raw };
    }

    const id = randomUUID();
    const { error: insertError } = await supabase.from('inbox_items').insert({
      id,
      user_id: body.userId,
      source: body.source,
      subject: body.raw.subject,
      from_address: body.raw.from,
      received_ago: body.raw.receivedAt,
      status: 'parsing',
      parsed: null,
    });
    if (insertError) {
      return Response.json({ error: 'Failed to create inbox item' }, { status: 500 });
    }

    const { data: trips } = await supabase
      .from('trips')
      .select('id,destination,country,start_date,end_date,date_approx,stage')
      .eq('user_id', body.userId)
      .neq('stage', 'archived');

    let parsed: ParsedResult | null = null;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system:
          'You are a travel confirmation email parser. Extract booking details and suggest which trip this belongs to. Return JSON only — no prose, no code fences.',
        messages: [
          {
            role: 'user',
            content: `Email subject: ${body.raw.subject}\nFrom: ${body.raw.from}\nBody:\n${body.raw.text}\n\nActive trips:\n${JSON.stringify(trips ?? [])}\n\nReturn JSON with keys: vendor, type (flight|lodging|transport|activity|dining|other), title, dates, cost (number), confirmation (string|null), suggested_trip (trip id|null), suggested_confidence (0-1).`,
          },
        ],
      });
      const first = message.content[0];
      const text = first?.type === 'text' ? first.text : '';
      parsed = JSON.parse(text) as ParsedResult;
    } catch (err) {
      const note = err instanceof Error ? err.message : 'Parse error';
      await supabase.from('inbox_items').update({ status: 'needs_review', note }).eq('id', id);
      return Response.json({ id }, { status: 200 });
    }

    const confidence = parsed.suggested_confidence ?? 0;
    const status = confidence >= 0.5 ? 'parsed' : 'needs_review';
    const { error: updateError } = await supabase.from('inbox_items').update({
      status,
      vendor: parsed.vendor,
      parsed: {
        type: parsed.type,
        title: parsed.title,
        dates: parsed.dates,
        cost: parsed.cost,
        confirmation: parsed.confirmation,
      },
      suggested_trip: parsed.suggested_trip,
      suggested_confidence: confidence,
    }).eq('id', id);
    if (updateError) {
      return Response.json({ error: 'Failed to persist parsed item', id }, { status: 500 });
    }

    return Response.json({ id }, { status: 200 });
  };
}

export const defaultNow = (): Date => new Date();

export default createIngestHandler({
  anthropic: new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] }),
  now: defaultNow,
  supabase: createClient(
    process.env['SUPABASE_URL'] ?? '',
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  ),
});
