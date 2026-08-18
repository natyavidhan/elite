// Side-effect-only module, must be the FIRST import in index.js. ES module
// imports all evaluate before any of the importing file's own top-level
// code runs, in the order they're listed — so this has to be listed before
// ./coach/config.js's dependents (coach/route.js) or their top-level
// `process.env.COACH_API_KEY` reads would run before this ever populated
// it, silently seeing undefined despite a real server/.env file on disk.
try {
  process.loadEnvFile();
} catch {
  // No .env file — expected for the Docker deploy path (real env vars are
  // passed to `docker run`/`docker compose` directly).
}
