import { AsyncLocalStorage } from 'async_hooks';

const store = new AsyncLocalStorage<Record<string, string>>();

export function withCallbackParams(
  params: Record<string, string>,
  fn: () => Promise<Response>
): Promise<Response> {
  return store.run(params, fn) as Promise<Response>;
}

export function getCallbackParams(): Record<string, string> {
  return store.getStore() || {};
}
