// Sun Bay — the entry program (Node 22, standard library only). It hands the
// game in: the static files under game/ and the screenshots beside them are
// copied to the output directory, and the dossier the judge reads is written
// with the kit's own library, so the gate can rebuild it byte for byte.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// and serve the game locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function entryPaths() {
  const repoRoot = fileURLToPath(new URL('.', import.meta.url));
  return {
    repoRoot,
    gameDir: join(repoRoot, 'game'),
    shotsDir: join(repoRoot, 'screenshots'),
    outDir: resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output'),
  };
}

function countGameFiles(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    total += 1;
    if (statSync(path).isDirectory()) total += countGameFiles(path);
  }
  return total;
}

function copyEntry(paths) {
  mkdirSync(paths.outDir, { recursive: true });
  cpSync(paths.gameDir, join(paths.outDir, 'game'), { recursive: true });
  mkdirSync(join(paths.outDir, 'screenshots'), { recursive: true });
  if (existsSync(paths.shotsDir)) {
    cpSync(paths.shotsDir, join(paths.outDir, 'screenshots'), { recursive: true });
  }
}

function main() {
  const paths = entryPaths();
  if (!existsSync(paths.gameDir)) {
    throw new Error(`game/ not found beside main.ts (${paths.gameDir})`);
  }
  const files = countGameFiles(paths.gameDir);
  if (files > DOSSIER_LIMITS.game_max_files) {
    throw new Error(`game/ holds ${files} files, over the ${DOSSIER_LIMITS.game_max_files} cap`);
  }
  // The gate wants 3 or 4 screenshots; refuse early with a clear message
  // instead of handing the scorer an entry it must reject.
  if (existsSync(paths.shotsDir)) {
    const shots = readdirSync(paths.shotsDir).filter((name) => !name.startsWith('.'));
    if (shots.length < 3 || shots.length > DOSSIER_LIMITS.screenshots.max) {
      throw new Error(`screenshots/ holds ${shots.length} images, need 3 to 4`);
    }
  }
  copyEntry(paths);
  const dossier = buildDossier(paths.outDir, DOSSIER_LIMITS);
  writeFileSync(join(paths.outDir, 'dossier.json'), dossier);
}

main();
