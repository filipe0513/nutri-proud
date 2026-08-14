/**
 * Server-side PostHog Query API client (HogQL).
 *
 * All backend PostHog queries MUST go through this module.
 * Do NOT call the PostHog API directly from any service or route.
 *
 * Required env vars:
 *   POSTHOG_PROJECT_ID       — numeric project ID (found in PostHog → Settings → Project)
 *   POSTHOG_PERSONAL_API_KEY — personal API key (PostHog → Settings → Personal API keys)
 *
 * Optional:
 *   POSTHOG_API_HOST — defaults to https://us.posthog.com
 */

const POSTHOG_API_HOST =
  process.env.POSTHOG_API_HOST ?? 'https://us.posthog.com';

interface PostHogQueryResponse {
  results: unknown[][];
  columns: string[];
  types: string[];
}

/**
 * Executes a HogQL query against PostHog and returns the result rows.
 *
 * @param hogql - A valid HogQL SELECT statement.
 * @returns Array of result rows (each row is an array of column values).
 * @throws Error on network failure, missing env vars, or non-2xx responses.
 */
export async function queryPostHog<T = unknown>(hogql: string): Promise<T[]> {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  if (!projectId) {
    throw new Error(
      '[posthog-server] POSTHOG_PROJECT_ID env var is not set.'
    );
  }
  if (!apiKey) {
    throw new Error(
      '[posthog-server] POSTHOG_PERSONAL_API_KEY env var is not set.'
    );
  }

  const url = `${POSTHOG_API_HOST}/api/projects/${projectId}/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query: hogql,
      },
    }),
  });

  if (response.status === 401) {
    throw new Error(
      '[posthog-server] PostHog returned 401 Unauthorized. Check POSTHOG_PERSONAL_API_KEY.'
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    throw new Error(
      `[posthog-server] PostHog query failed with status ${response.status}: ${text}`
    );
  }

  const data = (await response.json()) as PostHogQueryResponse;
  return data.results as T[];
}
