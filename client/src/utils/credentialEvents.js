const CREDENTIAL_EVENT = 'lockit:credentials-mutated';

/**
 * Broadcasts a credential mutation event across the window.
 * - Guards against server-side rendering where window is undefined.
 * - Passes contextual detail payloads to interested subscribers.
 */
export function notifyCredentialsMutated(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CREDENTIAL_EVENT, { detail }));
}

/**
 * Attaches a listener for credential mutation events.
 * - Validates the callback and returns a cleanup function for React effects.
 * - Wraps the callback in a try/catch to avoid breaking the event loop.
 */
export function subscribeToCredentialMutations(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};

  const handler = (event) => {
    try {
      callback(event.detail ?? {});
    } catch (error) {
      console.error('Credential mutation subscriber failed', error);
    }
  };

  window.addEventListener(CREDENTIAL_EVENT, handler);
  return () => window.removeEventListener(CREDENTIAL_EVENT, handler);
}

export const CREDENTIAL_EVENTS = {
  MUTATED: CREDENTIAL_EVENT,
};
