const CREDENTIAL_EVENT = 'lockit:credentials-mutated';

export function notifyCredentialsMutated(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CREDENTIAL_EVENT, { detail }));
}

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
