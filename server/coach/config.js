// AI Coach targets any OpenAI-compatible chat-completions API — Groq and
// OpenCode (opencode.ai/docs/zen) are both confirmed working, but any
// provider with a POST {baseUrl}/chat/completions endpoint and tool-calling
// support fits. COACH_PROVIDER picks a known-good preset for baseUrl/model;
// COACH_BASE_URL/COACH_MODEL override either independently for a custom
// provider or a different model on the same one.
const PRESETS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    // Must support "tools" — checked against this account's live
    // /v1/models list, not just the docs (which listed a model this
    // account didn't actually have access to).
    model: 'openai/gpt-oss-120b',
  },
  opencode: {
    // The "Go" subscription endpoint (distinct from plain Zen pay-as-you-go
    // credits, which deepseek-v4-flash would otherwise bill against) — a
    // separate, much higher monthly-request quota. https://opencode.ai/docs/zen
    baseUrl: 'https://opencode.ai/zen/go/v1',
    model: 'deepseek-v4-flash',
  },
};

const preset = PRESETS[process.env.COACH_PROVIDER] ?? PRESETS.groq;

export const COACH_API_KEY = process.env.COACH_API_KEY;
export const COACH_BASE_URL = (process.env.COACH_BASE_URL || preset.baseUrl).replace(/\/$/, '');
export const COACH_MODEL = process.env.COACH_MODEL || preset.model;
export const isCoachConfigured = Boolean(COACH_API_KEY);
