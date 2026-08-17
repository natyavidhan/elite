import { Router } from 'express';
import { runCoachAgent } from './agent.js';

const MAX_HISTORY_MESSAGES = 20;

export function coachRouter() {
  const router = Router();

  router.post('/coach/chat', async (req, res) => {
    if (!process.env.GROQ_API_KEY) {
      res.status(503).json({ error: 'AI Coach is not configured on this server (GROQ_API_KEY missing).' });
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
      const reply = await runCoachAgent(history);
      res.json({ message: { role: 'assistant', content: reply } });
    } catch (e) {
      console.error('Coach agent error:', e);
      res.status(502).json({ error: e instanceof Error ? e.message : 'AI Coach request failed.' });
    }
  });

  return router;
}
