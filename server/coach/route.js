import { Router } from 'express';
import { runCoachAgent } from './agent.js';
import { isCoachConfigured } from './config.js';

const MAX_HISTORY_MESSAGES = 20;

export function coachRouter() {
  const router = Router();

  router.post('/coach/chat', async (req, res) => {
    if (!isCoachConfigured) {
      res.status(503).json({ error: 'AI Coach is not configured on this server (COACH_API_KEY missing).' });
      return;
    }
    const { messages } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages must be a non-empty array.' });
      return;
    }
    const history = messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const { content, visualization } = await runCoachAgent(history);
      res.json({ message: { role: 'assistant', content }, visualization: visualization ?? undefined });
    } catch (e) {
      console.error('Coach agent error:', e);
      res.status(502).json({ error: e instanceof Error ? e.message : 'AI Coach request failed.' });
    }
  });

  return router;
}
