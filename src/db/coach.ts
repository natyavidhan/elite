import { API_BASE, isBackendConfigured, authHeaders } from '@/utils/apiBase';

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type CoachAvailability = 'unknown' | 'unavailable' | 'available';

let availability: CoachAvailability = isBackendConfigured ? 'unknown' : 'unavailable';
const listeners = new Set<(a: CoachAvailability) => void>();

function setAvailability(next: CoachAvailability): void {
  availability = next;
  for (const fn of listeners) fn(availability);
}

export function getCoachAvailability(): CoachAvailability {
  return availability;
}

export function subscribeCoachAvailability(fn: (a: CoachAvailability) => void): () => void {
  listeners.add(fn);
  fn(availability);
  return () => listeners.delete(fn);
}

/** AI Coach is backend-only — there's no client-side fallback, so whether
 * it's usable at all depends on the server reporting a Groq key is
 * configured. Checked once at startup via the same /api/health endpoint
 * sync already uses. */
export async function checkCoachAvailability(): Promise<void> {
  if (!isBackendConfigured) {
    setAvailability('unavailable');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/health`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`health check failed: ${res.status}`);
    const data = (await res.json()) as { coachEnabled?: boolean };
    setAvailability(data.coachEnabled ? 'available' : 'unavailable');
  } catch {
    setAvailability('unavailable');
  }
}

export async function sendCoachMessage(messages: CoachMessage[]): Promise<string> {
  const res = await fetch(`${API_BASE}/api/coach/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ messages }),
  });
  const data = (await res.json().catch(() => null)) as { message?: { content: string }; error?: string } | null;
  if (!res.ok || !data) {
    throw new Error(data?.error ?? `Coach request failed: ${res.status}`);
  }
  return data.message?.content ?? '';
}
