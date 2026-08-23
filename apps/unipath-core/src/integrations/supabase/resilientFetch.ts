/**
 * A `fetch` wrapper for the Supabase client that bounds concurrency and retries
 * transient network failures.
 *
 * Why: a single dashboard mount fans out 30-40 REST calls at once. Chrome sends
 * them all down one HTTP/2 connection, and Supabase's edge answers the overflow
 * with REFUSED_STREAM. Those rejections surface as silently empty widgets —
 * the request never reaches Postgres, so there is no error to show, just a
 * missing number.
 *
 * Two mechanisms, both deliberately conservative:
 *   1. A queue caps how many requests are in flight at once.
 *   2. Requests that fail at the network layer (never got an HTTP status) are
 *      retried with backoff. HTTP errors — 400, 401, 403, 404, 409 — are NOT
 *      retried: those are real answers and the caller must see them.
 *
 * Aborted requests (component unmounted, navigation) are passed straight
 * through; retrying them would defeat the abort.
 */

const MAX_CONCURRENT = 6;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 180;

let inFlight = 0;
const waiting: Array<() => void> = [];

function acquire(): Promise<void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    waiting.push(() => {
      inFlight += 1;
      resolve();
    });
  });
}

function release(): void {
  inFlight -= 1;
  const next = waiting.shift();
  if (next) next();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isAbort(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'AbortError')
  );
}

export const resilientFetch: typeof fetch = async (input, init) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await acquire();
    try {
      // A response — any status — is a real answer. Hand it back untouched.
      return await fetch(input as RequestInfo, init);
    } catch (err) {
      lastError = err;
      if (isAbort(err) || init?.signal?.aborted) throw err;
      if (attempt === MAX_RETRIES) break;
      // Exponential backoff with jitter so retries don't resynchronise.
      await sleep(BASE_BACKOFF_MS * 2 ** attempt + Math.floor(Math.random() * 120));
    } finally {
      release();
    }
  }

  throw lastError;
};
