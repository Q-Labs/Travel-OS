import { describe, expect, it } from 'vitest';
import { extractInboxToken, isSupportedProvider, normalizeInboundEmail } from './inboundEmail';

describe('extractInboxToken', () => {
  it('pulls the token out of a plus-addressed recipient', () => {
    expect(extractInboxToken('quincy+a1b2c3@travelos.app')).toBe('a1b2c3');
  });

  it('lowercases the token so casing in transit does not matter', () => {
    expect(extractInboxToken('Quincy+A1B2C3@travelos.app')).toBe('a1b2c3');
  });

  it('unwraps a display-name address', () => {
    expect(extractInboxToken('Travel OS <quincy+a1b2c3@travelos.app>')).toBe('a1b2c3');
  });

  it('returns null for an address with no plus tag', () => {
    expect(extractInboxToken('quincy@travelos.app')).toBeNull();
  });

  it('returns null for an empty plus tag', () => {
    expect(extractInboxToken('quincy+@travelos.app')).toBeNull();
  });

  it('returns null for a non-address', () => {
    expect(extractInboxToken('not an address')).toBeNull();
  });
});

describe('isSupportedProvider', () => {
  it('accepts the providers we adapt', () => {
    expect(isSupportedProvider('postmark')).toBe(true);
    expect(isSupportedProvider('sendgrid')).toBe(true);
    expect(isSupportedProvider('cloudflare')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isSupportedProvider('mailgun')).toBe(false);
  });
});

describe('normalizeInboundEmail', () => {
  it('maps a Postmark inbound payload', () => {
    expect(
      normalizeInboundEmail('postmark', {
        From: 'automated@airbnb.com',
        OriginalRecipient: 'quincy+a1b2c3@travelos.app',
        Subject: 'Reservation confirmed',
        TextBody: 'Your stay is booked.',
        Date: 'Mon, 20 Apr 2026 12:00:00 -0400',
      }),
    ).toEqual({
      from: 'automated@airbnb.com',
      to: 'quincy+a1b2c3@travelos.app',
      subject: 'Reservation confirmed',
      text: 'Your stay is booked.',
      receivedAt: 'Mon, 20 Apr 2026 12:00:00 -0400',
    });
  });

  it('falls back to the Postmark To field when OriginalRecipient is absent', () => {
    const result = normalizeInboundEmail('postmark', {
      From: 'a@b.com', To: 'quincy+tok@travelos.app',
      Subject: 's', TextBody: 't', Date: 'd',
    });
    expect(result?.to).toBe('quincy+tok@travelos.app');
  });

  it('maps a SendGrid inbound-parse payload', () => {
    expect(
      normalizeInboundEmail('sendgrid', {
        from: 'automated@airbnb.com',
        to: 'quincy+a1b2c3@travelos.app',
        subject: 'Reservation confirmed',
        text: 'Your stay is booked.',
      })?.from,
    ).toBe('automated@airbnb.com');
  });

  it('maps a Cloudflare Email Worker payload', () => {
    expect(
      normalizeInboundEmail('cloudflare', {
        from: 'automated@airbnb.com',
        to: 'quincy+a1b2c3@travelos.app',
        subject: 'Reservation confirmed',
        text: 'Your stay is booked.',
        receivedAt: '2026-04-20T12:00:00Z',
      })?.receivedAt,
    ).toBe('2026-04-20T12:00:00Z');
  });

  it('defaults a missing timestamp to an empty string', () => {
    expect(
      normalizeInboundEmail('sendgrid', {
        from: 'a@b.com', to: 'c@d.com', subject: 's', text: 't',
      })?.receivedAt,
    ).toBe('');
  });

  it('falls back to the html body when there is no text part', () => {
    const result = normalizeInboundEmail('postmark', {
      From: 'a@b.com', To: 'c@d.com', Subject: 's',
      HtmlBody: '<p>Booked</p>', Date: 'd',
    });
    expect(result?.text).toBe('<p>Booked</p>');
  });

  it('returns null for an unknown provider', () => {
    expect(normalizeInboundEmail('mailgun', { from: 'a@b.com' })).toBeNull();
  });

  it('returns null for a non-object payload', () => {
    expect(normalizeInboundEmail('postmark', null)).toBeNull();
    expect(normalizeInboundEmail('postmark', 'nope')).toBeNull();
  });

  it('returns null when required fields are missing', () => {
    expect(normalizeInboundEmail('postmark', { From: 'a@b.com' })).toBeNull();
    expect(normalizeInboundEmail('sendgrid', { from: 'a@b.com', to: 'c@d.com' })).toBeNull();
  });
});
