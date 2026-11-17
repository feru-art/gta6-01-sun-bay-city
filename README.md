# Marisol — Neon Tide (Make GTA 6)

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/feru-art/gta6-01-sun-bay-city/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/feru-art/gta6-01-sun-bay-city/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An open-world crime game in the spirit of GTA 6, built for the
[make.fun "Make GTA 6" bounty](https://make.fun/bounty/gta6-01)
(pot $1,666, top 100 paid). A complete 2D top-down coastal city — Marisol —
with six districts, traffic and pedestrians, cars to steal and drive, a
wanted system with police who escalate from patrol to roadblocks, spike
strips and the MPD helicopter, six story missions, combat, an economy
(weapons, cars and a safehouse to buy), taxi fares, street races,
collectible packages, a day-night cycle with rain, a HUD with a minimap,
a start screen and a save.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network:
the game is static files under `game/`.

Controls: WASD / arrows to move and drive, Shift to run, E to enter or exit a
car (and to open shops), Space to punch (on foot) or handbrake (driving),
F or mouse click to shoot, T for a taxi job, R for a street race, P to pause,
M to mute, H to honk, S to save.

## How it is built

- `game/index.html` — the page, one canvas, one module script.
- `game/src/` — 17 files, one job each: config, city, clock (day/night +
  weather), player, vehicles, traffic, police, combat, missions, economy,
  activities, audio (procedural WebAudio), save, hud, minimap, shots
  (screenshot staging), main (game loop).
- `main.ts` — the entry program: copies game/ + screenshots/ to the output
  and writes dossier.json with the kit's `buildDossier`.
- `screenshots/` — 4 real renders of the game (1280×720, ≤256 KiB each).
