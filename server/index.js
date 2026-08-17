import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncRouter } from './sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const SYNC_TOKEN = process.env.SYNC_TOKEN;
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, 'public');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }));

// Only /api/sync needs protecting — health stays open for container/uptime
// checks. Skipped entirely when SYNC_TOKEN isn't set, so a local/trusted
// deployment doesn't have to configure anything to get started.
app.use('/api', (req, res, next) => {
  if (!SYNC_TOKEN) return next();
  if (req.get('authorization') === `Bearer ${SYNC_TOKEN}`) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

app.use('/api', syncRouter());

// The built PWA is served from the same process and port as the API, so
// the whole app is one container, one port, one `docker run`.
app.use(express.static(STATIC_DIR));
app.get('*splat', (_req, res) => res.sendFile(path.join(STATIC_DIR, 'index.html')));

app.listen(PORT, () => {
  console.log(`Elite server listening on :${PORT}`);
});
