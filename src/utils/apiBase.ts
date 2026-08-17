const RAW_API_URL = import.meta.env.VITE_API_URL as string | undefined;
const SYNC_TOKEN = import.meta.env.VITE_SYNC_TOKEN as string | undefined;

/** Whether a backend is configured at all (sync, and anything backend-only
 * like AI Coach, both depend on this). The special value "same-origin"
 * (what the Dockerfile bakes in by default) targets a relative /api/* path
 * instead of an absolute origin — the bundled deploy serves the frontend
 * and the API from the same process and port, so there's nothing to
 * configure. Unset entirely, this app is local-only with zero network
 * calls to itself. */
export const isBackendConfigured = Boolean(RAW_API_URL);
export const API_BASE = RAW_API_URL === 'same-origin' ? '' : RAW_API_URL?.replace(/\/$/, '');

export function authHeaders(): Record<string, string> {
  return SYNC_TOKEN ? { Authorization: `Bearer ${SYNC_TOKEN}` } : {};
}
