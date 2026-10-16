// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class Anthropic {
    messages = { create: vi.fn() };
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

// Minimal typed interfaces for mocking Anthropic and Supabase
interface MockAnthropic {
  messages: { create: ReturnType<typeof vi.fn> };
}

interface MockSupabaseChain {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  data: unknown;
  error: unknown;
}

function makeSupabaseMock(
  tripRows: unknown[] = [],
  insertError: unknown = null,
  updateError: unknown = null,
  tokenRow: unknown = null,
) {
  const insertSpy = vi.fn().mockResolvedValue({ error: insertError });
  const chain: MockSupabaseChain = {
    from: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    filter: vi.fn(),
    data: tripRows,
    error: null,
  };

  // Each .from() call returns the chain; the chain's terminal returns depend on the operation
  chain.from.mockImplementation((table: string) => {
    if (table === 'trips') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            neq: vi.fn().mockResolvedValue({ data: tripRows, error: null }),
          }),
        }),
      };
    }
    if (table === 'inbox_items') {
      return {
        insert: insertSpy,
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: updateError }),
        }),
      };
    }
    if (table === 'user_inbox_tokens') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: tokenRow, error: null }),
          }),
        }),
      };
    }
    return chain;
  });

  return Object.assign(chain, { insertSpy });
}

function makeProviderRequest(provider: string, body: unknown, secret = 'test-secret'): Request {
  return new Request(`http://localhost/api/inbox/ingest?provider=${provider}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-ingest-secret': secret },
    body: JSON.stringify(body),
  });
}

const POSTMARK_PAYLOAD = {
  From: 'automated@airbnb.com',
  OriginalRecipient: 'quincy+a1b2c3@travelos.app',
  Subject: 'Reservation confirmed',
  TextBody: 'Riad Dar Anika, 4 nights.',
  Date: 'Mon, 20 Apr 2026 12:00:00 -0400',
};

function makeAnthropicMock(jsonResponse: string): MockAnthropic {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: jsonResponse }],
      }),
    },
  };
}

function makeRequest(
  method: string,
  secret: string | null,
  body?: unknown,
): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret !== null) headers['x-ingest-secret'] = secret;
  return new Request('http://localhost/api/inbox/ingest', {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const VALID_BODY = {
  userId: 'user-1',
  source: 'email',
  raw: { subject: 'Your flight confirmation', from: 'aa@aa.com', receivedAt: '2026-04-25', text: 'Flight AA123 confirmed.' },
};

const VALID_PARSED_JSON = JSON.stringify({
  vendor: 'American Airlines',
  type: 'flight',
  title: 'AA123 JFK→LAX',
  dates: '2026-05-02',
  cost: 350,
  confirmation: 'ABC123',
  suggested_trip: 'tr-oaxaca',
  suggested_confidence: 0.92,
});

import { createIngestHandler, defaultNow, normalizeReceivedAt } from './ingest';

describe('ingest handler', () => {
  const SECRET = 'test-secret';

  beforeEach(() => {
    process.env['INGEST_SECRET'] = SECRET;
  });

  it('returns 405 for non-POST methods', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('GET', SECRET));
    expect(res.status).toBe(405);
  });

  it('returns 405 for PUT method', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('PUT', SECRET, VALID_BODY));
    expect(res.status).toBe(405);
  });

  it('returns 401 when x-ingest-secret header is missing', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', null, VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 401 when x-ingest-secret header is wrong', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', 'wrong-secret', VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is malformed JSON', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const req = new Request('http://localhost/api/inbox/ingest', {
      method: 'POST',
      headers: { 'x-ingest-secret': SECRET, 'content-type': 'application/json' },
      body: 'not-json',
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is missing required fields', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, { userId: 'u1' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is JSON null (isValidBody falsy branch)', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const req = new Request('http://localhost/api/inbox/ingest', {
      method: 'POST',
      headers: { 'x-ingest-secret': SECRET, 'content-type': 'application/json' },
      body: 'null',
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it('happy path: inserts placeholder, calls Claude, updates to parsed with suggested trip', async () => {
    const supabase = makeSupabaseMock([{ id: 'tr-oaxaca', destination: 'Oaxaca', country: 'Mexico', start_date: '2026-05-02', end_date: '2026-05-09', date_approx: null, stage: 'upcoming' }]);
    const anthropic = makeAnthropicMock(VALID_PARSED_JSON);
    const handler = createIngestHandler({ anthropic: anthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string };
    expect(typeof body.id).toBe('string');
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
    const callArg = anthropic.messages.create.mock.calls[0][0] as { model: string };
    expect(callArg.model).toBe('claude-haiku-4-5-20251001');
  });

  it('sets status needs_review when confidence is below 0.5', async () => {
    const lowConfidence = JSON.stringify({
      vendor: 'Unknown', type: 'flight', title: 'Some flight',
      dates: '2026-05-01', cost: 100, confirmation: null,
      suggested_trip: null, suggested_confidence: 0.3,
    });
    const supabase = makeSupabaseMock([]);
    const anthropic = makeAnthropicMock(lowConfidence);

    // Capture update calls to verify status
    let capturedUpdatePayload: unknown;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockImplementation((payload: unknown) => {
          capturedUpdatePayload = payload;
          return { eq: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };
    });

    const handler = createIngestHandler({ anthropic: anthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    expect(capturedUpdatePayload).toMatchObject({ status: 'needs_review' });
  });

  it('sets status needs_review when Claude returns invalid JSON', async () => {
    const badJson = makeAnthropicMock('this is not json');
    const supabase = makeSupabaseMock([]);
    let capturedUpdatePayload: unknown;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockImplementation((payload: unknown) => {
          capturedUpdatePayload = payload;
          return { eq: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };
    });

    const handler = createIngestHandler({ anthropic: badJson as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    expect(capturedUpdatePayload).toMatchObject({ status: 'needs_review' });
  });

  it('sets status needs_review and returns 200 when Claude throws', async () => {
    const throwingAnthropic: MockAnthropic = {
      messages: { create: vi.fn().mockRejectedValue(new Error('API down')) },
    };
    const supabase = makeSupabaseMock([]);
    let capturedUpdatePayload: unknown;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockImplementation((payload: unknown) => {
          capturedUpdatePayload = payload;
          return { eq: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };
    });

    const handler = createIngestHandler({ anthropic: throwingAnthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    expect(capturedUpdatePayload).toMatchObject({ status: 'needs_review', note: 'API down' });
  });

  it('returns 500 when initial insert fails', async () => {
    const supabase = makeSupabaseMock([], new Error('DB insert failed'));
    const anthropic = makeAnthropicMock(VALID_PARSED_JSON);
    const handler = createIngestHandler({ anthropic: anthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(500);
    expect(anthropic.messages.create).not.toHaveBeenCalled();
  });

  it('defaults source to "email" when not provided in body', async () => {
    const supabase = makeSupabaseMock([]);
    const anthropic = makeAnthropicMock(VALID_PARSED_JSON);
    let capturedInsertPayload: unknown;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockImplementation((payload: unknown) => {
          capturedInsertPayload = payload;
          return Promise.resolve({ error: null });
        }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      };
    });
    const bodyNoSource = { userId: 'user-1', raw: { subject: 'X', from: 'x@x.com', receivedAt: '2026-04-25', text: 'body' } };
    const handler = createIngestHandler({ anthropic: anthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, bodyNoSource));
    expect(res.status).toBe(200);
    expect(capturedInsertPayload).toMatchObject({ source: 'email' });
  });

  it('defaults suggested_confidence to 0 when null in parsed result', async () => {
    const nullConfidenceJson = JSON.stringify({
      vendor: 'AA', type: 'flight', title: 'Flight X',
      dates: '2026-05-01', cost: 100, confirmation: null,
      suggested_trip: null, suggested_confidence: null,
    });
    const supabase = makeSupabaseMock([]);
    let capturedUpdatePayload: unknown;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockImplementation((payload: unknown) => {
          capturedUpdatePayload = payload;
          return { eq: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };
    });
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(nullConfidenceJson) as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    expect(capturedUpdatePayload).toMatchObject({ status: 'needs_review', suggested_confidence: 0 });
  });

  it('uses empty trip list when trips query returns null data', async () => {
    const supabase = makeSupabaseMock([]);
    const anthropic = makeAnthropicMock(VALID_PARSED_JSON);
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      };
    });
    const handler = createIngestHandler({ anthropic: anthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    const callArg = anthropic.messages.create.mock.calls[0][0] as { messages: Array<{ content: string }> };
    expect(callArg.messages[0].content).toContain('[]');
  });

  it('treats non-text Claude content as empty string (falls through to needs_review)', async () => {
    const nonTextAnthropic: MockAnthropic = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'tool_use', id: 'tu_1', name: 'fn', input: {} }],
        }),
      },
    };
    const supabase = makeSupabaseMock([]);
    let capturedUpdatePayload: unknown;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockImplementation((payload: unknown) => {
          capturedUpdatePayload = payload;
          return { eq: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };
    });
    const handler = createIngestHandler({ anthropic: nonTextAnthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    expect(capturedUpdatePayload).toMatchObject({ status: 'needs_review' });
  });

  it('returns 500 when the parsed-row update fails', async () => {
    const supabase = makeSupabaseMock([]);
    const anthropic = makeAnthropicMock(VALID_PARSED_JSON);
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: new Error('update failed') }) }),
      };
    });
    const handler = createIngestHandler({ anthropic: anthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string; id: string };
    expect(body.error).toBe('Failed to persist parsed item');
    expect(typeof body.id).toBe('string');
  });

  it('rejects when raw.from is missing', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, { userId: 'u1', source: 'email', raw: { subject: 's', text: 't', receivedAt: '2026-04-25' } }));
    expect(res.status).toBe(400);
  });

  it('rejects when raw.receivedAt is missing', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, { userId: 'u1', source: 'email', raw: { subject: 's', text: 't', from: 'f@f.com' } }));
    expect(res.status).toBe(400);
  });

  it('rejects when userId is not a string', async () => {
    const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never, supabase: makeSupabaseMock() as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, { userId: 42, source: 'email', raw: { subject: 's', text: 't', from: 'f@f.com', receivedAt: '2026-04-25' } }));
    expect(res.status).toBe(400);
  });

  it('uses "Parse error" fallback note when a non-Error is thrown', async () => {
    const throwingAnthropic: MockAnthropic = {
      // eslint-disable-next-line prefer-promise-reject-errors
      messages: { create: vi.fn().mockRejectedValue('raw string error') },
    };
    const supabase = makeSupabaseMock([]);
    let capturedUpdatePayload: unknown;
    supabase.from.mockImplementation((table: string) => {
      if (table === 'trips') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockImplementation((payload: unknown) => {
          capturedUpdatePayload = payload;
          return { eq: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };
    });
    const handler = createIngestHandler({ anthropic: throwingAnthropic as never, supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
    const res = await handler(makeRequest('POST', SECRET, VALID_BODY));
    expect(res.status).toBe(200);
    expect(capturedUpdatePayload).toMatchObject({ status: 'needs_review', note: 'Parse error' });
  });

  describe('inbound email webhooks', () => {
    it('resolves the user from the recipient token and ingests the mail', async () => {
      const supabase = makeSupabaseMock([], null, null, { user_id: 'user-from-token' });
      const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never,
        supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
      const res = await handler(makeProviderRequest('postmark', POSTMARK_PAYLOAD));
      expect(res.status).toBe(200);
      const inserted = supabase.insertSpy.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(inserted['user_id']).toBe('user-from-token');
      // 'postmark' is not a BookingSource; storing it would make the UI label
      // the item "Manual" and leave the Forwarded counter at zero.
      expect(inserted['source']).toBe('email');
      expect(inserted['subject']).toBe('Reservation confirmed');
      expect(inserted['from_address']).toBe('automated@airbnb.com');
    });

    it('rejects an unknown provider without creating an item', async () => {
      const supabase = makeSupabaseMock([], null, null, { user_id: 'u1' });
      const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never,
        supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
      const res = await handler(makeProviderRequest('mailgun', POSTMARK_PAYLOAD));
      expect(res.status).toBe(400);
      expect(supabase.insertSpy).not.toHaveBeenCalled();
    });

    it('rejects a payload missing required fields', async () => {
      const supabase = makeSupabaseMock([], null, null, { user_id: 'u1' });
      const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never,
        supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
      const res = await handler(makeProviderRequest('postmark', { From: 'a@b.com' }));
      expect(res.status).toBe(400);
      expect(supabase.insertSpy).not.toHaveBeenCalled();
    });

    it('rejects a recipient with no plus-tag token', async () => {
      const supabase = makeSupabaseMock([], null, null, { user_id: 'u1' });
      const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never,
        supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
      const res = await handler(
        makeProviderRequest('postmark', { ...POSTMARK_PAYLOAD, OriginalRecipient: 'quincy@travelos.app' }),
      );
      expect(res.status).toBe(400);
      expect(supabase.insertSpy).not.toHaveBeenCalled();
    });

    it('rejects an unrecognised inbox token', async () => {
      const supabase = makeSupabaseMock([], null, null, null);
      const handler = createIngestHandler({ anthropic: makeAnthropicMock(VALID_PARSED_JSON) as never,
        supabase: supabase as never, now: () => new Date('2026-08-24T12:00:00Z') });
      const res = await handler(makeProviderRequest('postmark', POSTMARK_PAYLOAD));
      expect(res.status).toBe(404);
      expect(supabase.insertSpy).not.toHaveBeenCalled();
    });
  });
});


describe('review findings', () => {
  const NOW = new Date('2026-08-24T12:00:00Z');

  describe('normalizeReceivedAt', () => {
    it('turns a provider date header into an ISO timestamp', () => {
      expect(normalizeReceivedAt('Mon, 20 Apr 2026 12:00:00 +0000', NOW))
        .toBe('2026-04-20T12:00:00.000Z');
    });

    it('falls back to the ingest time when the provider sends nothing', () => {
      expect(normalizeReceivedAt('', NOW)).toBe(NOW.toISOString());
    });

    it('falls back when the value is unparseable', () => {
      expect(normalizeReceivedAt('sometime last tuesday', NOW)).toBe(NOW.toISOString());
    });
  });

  describe('provider authentication', () => {
    function handlerWith() {
      const supabase = makeSupabaseMock([], null, null, { user_id: 'user-from-token' });
      return {
        supabase,
        handler: createIngestHandler({
          anthropic: makeAnthropicMock(JSON.stringify({
            vendor: 'Airbnb', type: 'lodging', title: 'Riad', dates: 'Oct',
            cost: 1240, confirmation: 'X', suggested_trip: null, suggested_confidence: 0.9,
          })) as never,
          supabase: supabase as never,
          now: () => NOW,
        }),
      };
    }

    it('accepts the secret as a query parameter, since Postmark cannot send headers', async () => {
      const { handler } = handlerWith();
      const req = new Request(
        'http://localhost/api/inbox/ingest?provider=postmark&secret=test-secret',
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(POSTMARK_PAYLOAD) },
      );
      expect((await handler(req)).status).toBe(200);
    });

    it('accepts the secret as HTTP basic auth', async () => {
      const { handler } = handlerWith();
      const basic = Buffer.from('travelos:test-secret').toString('base64');
      const req = new Request('http://localhost/api/inbox/ingest?provider=postmark', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Basic ${basic}` },
        body: JSON.stringify(POSTMARK_PAYLOAD),
      });
      expect((await handler(req)).status).toBe(200);
    });

    it('rejects a wrong query secret', async () => {
      const { handler } = handlerWith();
      const req = new Request('http://localhost/api/inbox/ingest?provider=postmark&secret=nope', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(POSTMARK_PAYLOAD),
      });
      expect((await handler(req)).status).toBe(401);
    });

    it('rejects malformed basic auth', async () => {
      const { handler } = handlerWith();
      const req = new Request('http://localhost/api/inbox/ingest?provider=postmark', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Basic !!!not base64!!!' },
        body: JSON.stringify(POSTMARK_PAYLOAD),
      });
      expect((await handler(req)).status).toBe(401);
    });
  });

  it('parses SendGrid multipart/form-data instead of choking on it', async () => {
    const supabase = makeSupabaseMock([], null, null, { user_id: 'user-from-token' });
    const handler = createIngestHandler({
      anthropic: makeAnthropicMock(JSON.stringify({
        vendor: 'Airbnb', type: 'lodging', title: 'Riad', dates: 'Oct',
        cost: 1240, confirmation: 'X', suggested_trip: null, suggested_confidence: 0.9,
      })) as never,
      supabase: supabase as never,
      now: () => NOW,
    });
    const form = new FormData();
    form.set('from', 'automated@airbnb.com');
    form.set('to', 'quincy+a1b2c3@travelos.app');
    form.set('subject', 'Reservation confirmed');
    form.set('text', 'Riad Dar Anika, 4 nights.');
    const req = new Request('http://localhost/api/inbox/ingest?provider=sendgrid&secret=test-secret', {
      method: 'POST',
      body: form,
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const inserted = supabase.insertSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(inserted['user_id']).toBe('user-from-token');
    expect(inserted['source']).toBe('email');
  });

  it('defaultNow returns the current date', () => {
    expect(defaultNow()).toBeInstanceOf(Date);
  });

  it('rejects everything when no ingest secret is configured', async () => {
    const previous = process.env['INGEST_SECRET'];
    delete process.env['INGEST_SECRET'];
    const handler = createIngestHandler({
      anthropic: makeAnthropicMock('{}') as never,
      supabase: makeSupabaseMock() as never,
      now: () => NOW,
    });
    const req = new Request('http://localhost/api/inbox/ingest?provider=postmark&secret=anything', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(POSTMARK_PAYLOAD),
    });
    expect((await handler(req)).status).toBe(401);
    process.env['INGEST_SECRET'] = previous as string;
  });

  it('parses urlencoded form posts as well as multipart', async () => {
    const supabase = makeSupabaseMock([], null, null, { user_id: 'user-from-token' });
    const handler = createIngestHandler({
      anthropic: makeAnthropicMock(JSON.stringify({
        vendor: 'Airbnb', type: 'lodging', title: 'Riad', dates: 'Oct',
        cost: 1, confirmation: null, suggested_trip: null, suggested_confidence: 0.9,
      })) as never,
      supabase: supabase as never,
      now: () => NOW,
    });
    const body = new URLSearchParams({
      from: 'a@b.com', to: 'quincy+a1b2c3@travelos.app',
      subject: 'Reservation confirmed', text: 'Riad Dar Anika',
    });
    const req = new Request('http://localhost/api/inbox/ingest?provider=sendgrid&secret=test-secret', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    expect((await handler(req)).status).toBe(200);
  });

  it('handles a request that carries no content-type at all', async () => {
    const handler = createIngestHandler({
      anthropic: makeAnthropicMock('{}') as never,
      supabase: makeSupabaseMock() as never,
      now: () => NOW,
    });
    const req = new Request('http://localhost/api/inbox/ingest', {
      method: 'POST',
      headers: { 'x-ingest-secret': 'test-secret' },
    });
    // No body and no content-type: falls through to the JSON path and is rejected.
    expect((await handler(req)).status).toBe(400);
  });
});
