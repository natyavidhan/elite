# Elite

A local-first PWA for tracking workouts, food, cardio, and body weight — built because I wanted one place that shows my effort visually instead of as spreadsheets across three different apps. Syncs to a self-hosted server if you want it on more than one device; works entirely offline if you don't.

![Log session with the muscle plate and a preset applied](screenshots/log-session.png)

## Features

- **Workout** — muscle map that inks in with today's volume per muscle, tap to see what hit it, PR detection with confetti, one-tap session presets
- **Food** — barcode scan / USDA search / local cache, plus a custom dish library for your own recipes
- **Cardio** — session log with presets that scale by a multiplier ("Evening Cycling" × 1.5)
- **Body Weight** — daily log with trend chart and rolling average
- **Home** — GitHub-style consistency heatmap + 14-day trend charts across all four
- **Dark mode** — light, dark, or system, set in Settings

![Home dashboard heatmap and trend cards](screenshots/home.png)

No account, no backend required — everything lives in IndexedDB on your device by default, installable, works offline once loaded. Point it at the self-hosted server below and every write also lands in SQLite there: online writes push through immediately, offline writes catch up as soon as you're back, and a second device pulls the same data down. Either way, export/import a JSON backup any time.

## Stack

React + Vite + TypeScript, Dexie (IndexedDB), Tailwind, Recharts, `vite-plugin-pwa`. Optional sync server: Express + SQLite (`better-sqlite3`).

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
