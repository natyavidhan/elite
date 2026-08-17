// Extracts EXERCISES from src/constants/exercises.ts into server/exercises.json.
// The server is plain ESM/JS (no TS build step), but its AI Coach tools need
// the same id -> {name, primaryMuscles, secondaryMuscles} lookup the client
// already has, to resolve exercise names and compute muscle volumes. Re-run
// this whenever exercises.ts changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as esbuild from 'esbuild';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const srcPath = path.join(root, 'src/constants/exercises.ts');
const outPath = path.join(root, 'server/exercises.json');

const ts = readFileSync(srcPath, 'utf8');
const js = esbuild.transformSync(ts, { loader: 'ts', format: 'esm' }).code;
const dataUrl = 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
const mod = await import(dataUrl);

const catalog = mod.EXERCISES.map(({ id, name, primaryMuscles, secondaryMuscles, category }) => ({
  id,
  name,
  primaryMuscles,
  secondaryMuscles,
  category,
}));

writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`Wrote ${catalog.length} exercises to ${path.relative(root, outPath)}`);
