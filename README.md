# Sun Bay — Make GTA 6

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/feru-art/gta6-01-sun-bay-city/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/feru-art/gta6-01-sun-bay-city/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An open-world crime game in the spirit of GTA 6, built for the
[make.fun "Make GTA 6" bounty](https://make.fun/bounty/gta6-01)
(pot $1,666, top 100 paid). A complete 2D top-down city — Sun Bay — with six
districts, traffic and pedestrians, cars to steal and drive, a wanted system
with police who escalate from patrol to roadblocks, spike strips and the SBPD
helicopter, four story missions, combat, a HUD with a minimap, a start screen
and a save.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network:
the game is static files under `game/`.

Controls: WASD / arrows to move and drive, Shift to run, E to enter or exit a
car, Space to punch (on foot) or handbrake (driving), F to shoot, P to pause,
M to mute, H to honk.

## How it is built

- `game/index.html` — the page, one canvas, one module script.
- `game/src/` — fourteen modules with one job each: `config` (world, tuning),
  `city` (map, roads, districts), `traffic` (cars, pedestrians), `police`
  (wanted 1–5, pursuit, roadblocks, helicopter), `missions` (story, jobs),
  `player` (on foot), `vehicles` (arcade driving), `combat` (fists, pistol),
  `hud` (stars, money, speed, objectives), `minimap` (blips), `audio`
  (procedural WebAudio), `save` (localStorage), `shots` (screenshot staging),
  `main` (loop, camera, input).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the
  output and writes `dossier.json` with the kit's `vendor/makefun-game.ts`.
- `screenshots/` — four real renders of the game running in headless Chrome.

## License

MIT — see [LICENSE](LICENSE).
