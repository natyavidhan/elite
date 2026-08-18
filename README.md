# Elite

A local-first PWA for tracking workouts, food, cardio, and body weight — built because I wanted one place that shows my effort visually instead of as spreadsheets across three different apps. Syncs to a self-hosted server if you want it on more than one device; works entirely offline if you don't.

![Log session with the muscle plate and a preset applied](screenshots/log-session.png)

## Features

- **Workout** — muscle map that inks in with today's volume per muscle, tap to see what hit it, PR detection with confetti, one-tap session presets
- **Food** — barcode scan / USDA search / local cache, plus a custom dish library for your own recipes
- **Cardio** — session log with presets that scale by a multiplier ("Evening Cycling" × 1.5)
- **Body Weight** — daily log with trend chart and rolling average
- **Home** — GitHub-style consistency heatmap + 14-day trend charts across all four
- **AI Coach** — ask it about your training in plain language ("why has my bench plateaued", "what's my tricep split") and it calls tools against your real logs rather than guessing, charting a trend, ranking, or breakdown on request. Backend-only — see below
- **Dark mode** — light, dark, or system, set in Settings

![Home dashboard heatmap and trend cards](screenshots/home.png)

No account, no backend required — everything lives in IndexedDB on your device by default, installable, works offline once loaded. Point it at the self-hosted server below and every write also lands in SQLite there: online writes push through immediately, offline writes catch up as soon as you're back, and a second device pulls the same data down. Either way, export/import a JSON backup any time.

## Stack

React + Vite + TypeScript, Dexie (IndexedDB), Tailwind, Recharts, `vite-plugin-pwa`. Optional sync server: Express + SQLite (`better-sqlite3`). Optional AI Coach: any OpenAI-compatible provider (Groq, OpenCode, ...), tool-calling only (no RAG/vector store).

## Run it

```bash
npm install
npm run dev
```

Optional: for uncapped food search, add a free [USDA API key](https://fdc.nal.usda.gov/api-key-signup) to `.env` as `VITE_USDA_API_KEY` (falls back to a shared rate-limited demo key otherwise).

## Self-host with sync

From a clone, this builds and runs the server *and* the app together, on one port:

```bash
docker build -t elite . && docker run -d -p 8080:8080 -v elite-data:/data --name elite elite
```

Open `http://localhost:8080` — sync is already on, pointed at itself, nothing to configure. The volume is where the SQLite file lives; without it, data disappears when the container is recreated. `docker-compose.yml` wraps the same thing if you'd rather `docker compose up -d`.

Want a shared-secret token so randoms on your network can't write to it? Set `SYNC_TOKEN` on the server *and* rebuild the image with `--build-arg VITE_SYNC_TOKEN=<same value>` — it's baked into the frontend bundle at build time, not read at container start.

Running the frontend and server separately instead (e.g. the app on Vercel, the server on a home box)? Set `VITE_API_URL` to the server's full URL rather than `same-origin`, and run the server on its own with `cd server && npm install && npm start`.

### AI Coach

Optional, and only shows up in the app once it's configured. It's entirely server-side — the frontend never talks to the model provider directly, and there's no client-side key to steal. Works against any OpenAI-compatible chat-completions API that supports tool calling; `COACH_PROVIDER` picks a known-good preset:

```bash
# Groq — free tier, https://console.groq.com/keys — capped around 8000
# tokens/min, which a multi-tool question can hit; fine for occasional use.
docker run -d -p 8080:8080 -v elite-data:/data \
  -e COACH_PROVIDER=groq -e COACH_API_KEY=gsk_... --name elite elite

# OpenCode Go — https://opencode.ai/docs/go — a $10/mo subscription with a
# much larger quota (hours/week/month budgets, not a tight per-minute cap).
docker run -d -p 8080:8080 -v elite-data:/data \
  -e COACH_PROVIDER=opencode -e COACH_API_KEY=sk-... --name elite elite
```

Point it at something else entirely with `COACH_BASE_URL`/`COACH_MODEL` instead of `COACH_PROVIDER` — see `server/.env.example`. Unlike `SYNC_TOKEN`, all of these are read at container start — no rebuild needed to add, change, or swap providers.

![AI Coach answering a plateau question and charting a tricep-exercise split as a pie chart](screenshots/coach.png)

The coach answers by calling tools against your synced data (recent workouts, exercise trends, PRs, muscle volume and its breakdown by exercise, food/macros, cardio, body weight, consistency) — it doesn't see anything that hasn't synced to the server yet — and can render a line chart, bar chart, pie chart, or table inline when a question calls for one, reading the numbers straight out of its own prior tool call rather than retyping them into the chart (so a chart can't silently show the wrong numbers the way an LLM re-transcribing figures into prose sometimes can).

A single question can take 2-3 model round-trips (more if it also renders a chart), so which provider you pick matters more here than for typical chat use — a tight free-tier rate limit is the most likely source of an occasional "try again in a moment."
