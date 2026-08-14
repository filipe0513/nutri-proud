import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queryPostHog } from '../posthog-server';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    POSTHOG_PROJECT_ID: '12345',
    POSTHOG_PERSONAL_API_KEY: 'phx_test_key',
    POSTHOG_API_HOST: 'https://us.posthog.com',
  };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  vi.restoreAllMocks();
});

// ── Happy path ────────────────────────────────────────────

describe('queryPostHog', () => {
  it('returns result rows on a successful response', async () => {
    // Arrange
    const mockRows = [
      ['2026-01-01', 42],
      ['2026-01-02', 17],
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          results: mockRows,
          columns: ['date', 'count'],
          types: ['Date', 'Int64'],
        }),
      })
    );

    // Act
    const result = await queryPostHog<[string, number]>('SELECT date, count FROM events');

    // Assert
    expect(result).toEqual(mockRows);
  });

  it('sends the correct Authorization header and HogQL body', async () => {
    // Arrange
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [], columns: [], types: [] }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    // Act
    await queryPostHog('SELECT 1');

    // Assert
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://us.posthog.com/api/projects/12345/query');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer phx_test_key'
    );
    const body = JSON.parse(init.body as string) as {
      query: { kind: string; query: string };
    };
    expect(body.query.kind).toBe('HogQLQuery');
    expect(body.query.query).toBe('SELECT 1');
  });

  // ── Error cases ───────────────────────────────────────────

  it('throws on 401 Unauthorized', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })
    );

    // Act & Assert
    await expect(queryPostHog('SELECT 1')).rejects.toThrow('401 Unauthorized');
  });

  it('throws on non-2xx responses other than 401', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })
    );

    // Act & Assert
    await expect(queryPostHog('SELECT 1')).rejects.toThrow('500');
  });

  it('throws when POSTHOG_PROJECT_ID is missing', async () => {
    // Arrange
    delete process.env.POSTHOG_PROJECT_ID;

    // Act & Assert
    await expect(queryPostHog('SELECT 1')).rejects.toThrow(
      'POSTHOG_PROJECT_ID'
    );
  });

  it('throws when POSTHOG_PERSONAL_API_KEY is missing', async () => {
    // Arrange
    delete process.env.POSTHOG_PERSONAL_API_KEY;

    // Act & Assert
    await expect(queryPostHog('SELECT 1')).rejects.toThrow(
      'POSTHOG_PERSONAL_API_KEY'
    );
  });

  it('propagates network errors', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network failure'))
    );

    // Act & Assert
    await expect(queryPostHog('SELECT 1')).rejects.toThrow('Network failure');
  });
});
