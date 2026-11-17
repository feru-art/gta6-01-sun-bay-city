// Sun Bay — gta6-01 entry program (Node 22, standard library only).
// Hands in the game: copies game/ and screenshots/ from this repository to
// /output (or MAKEFUN_OUTPUT_DIR outside the grader) and writes the dossier
// with the kit's vendored library, exactly as the scorer rebuilds it.
// Deterministic: the same repository always yields the same bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps from the sealed gate (reference/gate.json): text_max_bytes is the only
// one that shapes the dossier bytes; the rest refuse an entry the scorer
// would refuse, so passing them makes this program fail in the same place.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
