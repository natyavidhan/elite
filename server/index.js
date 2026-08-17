import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncRouter } from './sync.js';
import { coachRouter } from './coach/route.js';

// Convenience for local dev / bare-metal runs — a `server/.env` file, if
// present, populates process.env (Node >= 20.6, no dependency needed). The
// Docker deployment doesn't need this at all: it gets GROQ_API_KEY etc. as
// real -e/--env-file variables at `docker run` time.
try {
  process.loadEnvFile();
} catch {
  // No .env file — expected for the Docker deploy path.
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const SYNC_TOKEN = process.env.SYNC_TOKEN;
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, 'public');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// coachEnabled tells the frontend whether to show the AI Coach tab at all —
// it's backend-only (needs a server-held Groq key), so a deployment without
// GROQ_API_KEY set just doesn't offer it, no client-side error state needed.
app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now(), coachEnabled: Boolean(process.env.GROQ_API_KEY) }));

// Only /api/sync and /api/coach need protecting — health stays open for
// container/uptime checks. Skipped entirely when SYNC_TOKEN isn't set, so a
// local/trusted deployment doesn't have to configure anything to get started.
app.use('/api', (req, res, next) => {
  if (!SYNC_TOKEN) return next();
  if (req.get('authorization') === `Bearer ${SYNC_TOKEN}`) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

app.use('/api', syncRouter());
app.use('/api', coachRouter());

// The built PWA is served from the same process and port as the API, so
// the whole app is one container, one port, one `docker run`.
app.use(express.static(STATIC_DIR));
app.get('*splat', (_req, res) => res.sendFile(path.join(STATIC_DIR, 'index.html')));

app.listen(PORT, () => {
  console.log(`Elite server listening on :${PORT}`);
});
