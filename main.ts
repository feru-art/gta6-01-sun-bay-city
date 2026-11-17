// Marisol — Neon Tide: the entry program (Node 22, standard library only).
// It stages the game for the grader: game/ and screenshots/ are copied into
// the output directory and the dossier the judge reads is written with the
// kit's own library, so the gate can rebuild it byte for byte.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play the game locally with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The gate's own caps (reference/gate.json). Only text_max_bytes shapes the
// dossier bytes; the rest are refused early here with a clear message.
const GATE_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function entryLayout() {
  const root = fileURLToPath(new URL('.', import.meta.url));
  return {
    root,
    game: join(root, 'game'),
    shots: join(root, 'screenshots'),
    target: resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output'),
  };
}

function countEntries(dir) {
  let seen = 0;
  for (const name of readdirSync(dir)) {
    seen += 1;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) seen += countEntries(path);
  }
  return seen;
}

function assertEntrySound(layout) {
  if (!existsSync(layout.game)) {
    throw new Error(`game/ is missing beside main.ts (${layout.game})`);
  }
  const files = countEntries(layout.game);
  if (files > GATE_CAPS.game_max_files) {
    throw new Error(`game/ holds ${files} entries, over the ${GATE_CAPS.game_max_files} cap`);
  }
  if (!existsSync(join(layout.game, 'index.html'))) {
    throw new Error('game/index.html is missing — the game cannot open');
  }
  const indexBytes = statSync(join(layout.game, 'index.html')).size;
  if (indexBytes > 1024 * 1024) {
    throw new Error(`game/index.html is ${indexBytes} bytes, over the 1 MiB cap`);
  }
  if (existsSync(layout.shots)) {
    const shots = readdirSync(layout.shots).filter((n) => !n.startsWith('.'));
    if (shots.length < 3 || shots.length > GATE_CAPS.screenshots.max) {
      throw new Error(`screenshots/ holds ${shots.length} images, need 3 to 4`);
    }
    for (const name of shots) {
      const bytes = statSync(join(layout.shots, name)).size;
      if (bytes > GATE_CAPS.screenshots.max_bytes) {
        throw new Error(`${name} is ${bytes} bytes, over the 256 KiB cap`);
      }
    }
  }
}

function stageFiles(layout) {
  mkdirSync(layout.target, { recursive: true });
  cpSync(layout.game, join(layout.target, 'game'), { recursive: true });
  mkdirSync(join(layout.target, 'screenshots'), { recursive: true });
  if (existsSync(layout.shots)) {
    cpSync(layout.shots, join(layout.target, 'screenshots'), { recursive: true });
  }
}

function main() {
  const layout = entryLayout();
  assertEntrySound(layout);
  stageFiles(layout);
  const dossier = buildDossier(layout.target, GATE_CAPS);
  writeFileSync(join(layout.target, 'dossier.json'), dossier);
}

main();
