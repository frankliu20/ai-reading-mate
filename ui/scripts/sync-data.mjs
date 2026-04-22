// Copy the consolidated booklists.json into ui/public so Next can serve it
// and into ui/lib/_data/ for type-safe imports during build.
//
// Source resolution (first hit wins):
//   1. $READING_DATA_DIR env var (absolute path to a folder containing booklists.json)
//   2. ../data/private/booklists.json   ← real data, gitignored
//   3. ../data/sample/booklists.json    ← shipped sample, runs out of the box
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const repoRoot = join(root, '..');

function resolveSource() {
  const env = process.env.READING_DATA_DIR;
  if (env) {
    const p = isAbsolute(env) ? join(env, 'booklists.json') : join(repoRoot, env, 'booklists.json');
    if (existsSync(p)) return p;
    console.warn(`[sync-data] READING_DATA_DIR set but booklists.json not found at ${p}`);
  }
  const priv = join(repoRoot, 'data', 'private', 'booklists.json');
  if (existsSync(priv)) return priv;
  const sample = join(repoRoot, 'data', 'sample', 'booklists.json');
  if (existsSync(sample)) return sample;
  return null;
}

const src = resolveSource();
if (!src) {
  console.error('[sync-data] no booklists.json found in data/private/ or data/sample/.');
  console.error('[sync-data] see data/README.md for setup.');
  process.exit(1);
}

const targets = [
  join(root, 'public', 'booklists.json'),
  join(root, 'lib', '_data', 'booklists.json'),
];

for (const dst of targets) {
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  console.log(`[sync-data] ${src} -> ${dst}`);
}
