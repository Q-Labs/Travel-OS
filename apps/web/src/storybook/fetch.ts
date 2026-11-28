/**
 * Replaces the global `fetch` with a handler for one story, so a component that
 * calls an outside API shows the same result every time and never touches the
 * network. Return it from a story's `beforeEach`: the returned function puts the
 * real `fetch` back when the story ends.
 */
export function mockFetch(handler: (url: string) => Promise<Response>): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL) => handler(String(input))) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}
