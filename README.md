# Gobble Dash — The Great Turkey Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/maelaozera/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/maelaozera/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete 2D canvas turkey escape game for the make.fun turkey-run-game-01 bounty.
No libraries, no build step, no network requests: plain ES modules under
`game/`, all art drawn in code, all sound synthesized with WebAudio.

## The game

Thanksgiving is coming and the farmer wants dinner. You are the turkey.
Run 1200 m from the farmyard, through the cornfield and the farmhouse
kitchen, to the forest gate — while the farmer chases you with a pitchfork.

- **Jump** (Space / ↑ / click) over fences, hay bales, pumpkins, rolling
  pins and the oven. **Slide** (↓ / S) under the carving knives the farmer
  throws at your head.
- **Hide in a haystack** — slide into one and the farmer loses your trail.
- **Collect corn** (+50, combo up to x5) and **golden feathers** (+150).
- **Three lives, one farmer.** Every stumble lets him close in; mud slows
  you down and he gains. If he catches you, you are dinner.
- **Three stages, rising speed:** Farmyard at dawn, Cornfield at noon,
  Farmhouse Kitchen at dusk. Reach the forest gate to escape.
- **HUD:** score, distance with a progress bar to the gate, lives, combo,
  stage, and a farmer-proximity meter that turns red when he is close.
- **Title screen, pause, and two end screens** — CAUGHT! and ESCAPED! —
  both with your run's stats and a restart.

## How to play

Serve `game/` with any static server and open it in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

| Key | Action |
| --- | --- |
| Space / ↑ / click | Jump (also starts / restarts) |
| ↓ / S | Slide under knives, hide in haystacks |
| P / Esc | Pause |
| R | Restart |
| M | Mute |

## Layout

- `game/index.html` — the page, one canvas, no external references
- `game/src/main.js` — boot, fixed-step loop, screens, shot mode
- `game/src/world.js` — simulation: turkey, farmer, obstacles, pickups, rules
- `game/src/render.js` — canvas renderer, HUD, title / pause / end screens
- `game/src/art.js` — all drawn art: turkey, farmer, farm, kitchen, effects
- `game/src/audio.js` — WebAudio music loop and synthesized sound effects
- `game/src/input.js` — keyboard + mouse input
- `game/src/shots.js` — screenshot scenes (`?shot=start|play|kitchen|end`)
- `game/src/config.js` — tuning, stages, shared constants
- `game/src/random.js` — seeded random generator
- `main.ts` — the hand-in program: copies `game/` + `screenshots/` and
  writes `dossier.json` with the vendored make.fun library
- `screenshots/` — 4 real renders of the game (title, farmyard run,
  kitchen run, caught end screen)
