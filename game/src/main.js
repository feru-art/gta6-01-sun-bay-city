// Sun Bay main: the game loop, the camera, input, and the world itself. This
// module owns the screen state machine (title, play, pause, busted, wasted),
// builds the world every system shares, and hands screenshot mode its stage.
import { WORLD } from './config.js';
import { buildCity, drawCity, districtAt as cityDistrictAt } from './city.js';
import { createTraffic, updateTraffic, drawTraffic } from './traffic.js';
import { createPolice, updatePolice, drawPolice } from './police.js';
import { createMissions, updateMissions, drawMissionMarkers, startMission } from './missions.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import { createCar, updateCar, drawCar } from './vehicles.js';
import { createCombat, updateCombat, drawCombat, tryPunch, tryShoot } from './combat.js';
import { attachHud, drawHUD, drawTitle, drawPause, drawEnd } from './hud.js';
import { drawMinimap } from './minimap.js';
import { createAudio } from './audio.js';
import { loadSave, saveGame } from './save.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Keyboard state: `down` is held, `pressed` fired this frame only.
const heldKeys = new Set();
const pressedKeys = new Set();
window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  heldKeys.add(event.code);
  pressedKeys.add(event.code);
  // A real key press is the browser's user gesture: unlock audio here, and
  // only here, so headless runs stay silent.
  if (world && world.state && world.state.audio) world.state.audio.unlock();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});
window.addEventListener('keyup', (event) => heldKeys.delete(event.code));

function liveInput() {
  return {
    down: (code) => heldKeys.has(code),
    pressed: (code) => pressedKeys.has(code),
  };
}

// Screenshot staging hands in plain key sets; adapt them to the same shape.
function adaptInput(raw) {
  if (raw && typeof raw.down === 'function') return raw;
  const keys = (raw && raw.keys) || new Set();
  const pressed = (raw && raw.pressedKeys) || new Set();
  return {
    down: (code) => keys.has(code),
    pressed: (code) => pressed.has(code),
  };
}

function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function buildWorld() {
  const saved = loadSave();
  const city = buildCity();
  const state = {
    time: 0,
    screen: 'title',
    money: saved ? saved.money : 0,
    score: saved ? saved.score : 0,
    bestHeat: saved ? saved.bestHeat : 0,
    wanted: 0,
    city,
    traffic: createTraffic(city),
    police: createPolice(),
    missions: createMissions(),
    player: createPlayer(1600, 1200),
    combat: createCombat(),
    audio: createAudio(),
    camera: { x: 0, y: 0, w: 1280, h: 720, zoom: 1, vista: false },
    district: null,
    saveTimer: 0,
    backdrop: null,
  };
  if (saved && saved.missionIndex > 0) {
    state.missions.index = Math.min(saved.missionIndex, 3);
  }
  attachHud(state);
  // The player's own car, parked near the start.
  const ownCar = createCar(1660, 1200, 0, '#1f8a7a');
  state.player.ownCar = ownCar;
  state.traffic.cars.push(ownCar);
  // Title backdrop: the golden-hour painting, loaded once.
  const img = new Image();
  img.src = 'assets/sun-bay-golden-hour.webp';
  state.backdrop = img;
  return { state };
}

const world = buildWorld();

world.reset = function reset() {
  const fresh = buildWorld();
  world.state = fresh.state;
  world.state.screen = 'play';
};

world.step = function step(dt, rawInput) {
  const state = world.state;
  const input = adaptInput(rawInput);
  state.time += dt;
  state.district = cityDistrictAt(state.player.x, state.player.y);

  if (state.screen !== 'play') return;

  // Combat keys.
  if (input.pressed('Space') && !state.player.car) tryPunch(state);
  if (input.pressed('KeyF')) tryShoot(state);

  updatePlayer(state, dt, input);
  if (state.player.car) updateCar(state, state.player.car, dt, input);
  updateTraffic(state.traffic, state, dt);
  updatePolice(state, dt);
  updateMissions(state, dt);
  updateCombat(state, dt);

  // Audio follows the world: sirens with the heat, engine with the speed.
  state.audio.setSiren(state.wanted > 0);
  state.audio.setEngine(state.player.car ? Math.abs(state.player.car.speed) : 0);

  // Autosave every 15 seconds of play.
  state.saveTimer += dt;
  if (state.saveTimer > 15) {
    state.saveTimer = 0;
    saveGame(state);
  }
  state.bestHeat = Math.max(state.bestHeat, state.wanted);
};

function updateCamera() {
  const state = world.state;
  const cam = state.camera;
  const zoom = cam.zoom;
  cam.w = canvas.width / zoom;
  cam.h = canvas.height / zoom;
  if (cam.vista) {
    // Vista shot: hold a wide frame centred on the city, so no void shows.
    cam.x = (WORLD.width - cam.w) / 2;
    cam.y = (WORLD.height - cam.h) / 2;
    return;
  }
  const targetX = state.player.x - cam.w / 2;
  const targetY = state.player.y - cam.h / 2;
  const ease = 1 - Math.pow(0.001, 1 / 60);
  cam.x += (targetX - cam.x) * Math.min(1, ease * 3);
  cam.y += (targetY - cam.y) * Math.min(1, ease * 3);
  cam.x = Math.max(0, Math.min(WORLD.width - cam.w, cam.x));
  cam.y = Math.max(0, Math.min(WORLD.height - cam.h, cam.y));
  // Screen shake on impacts.
  if (state.hud.shake > 0) {
    cam.x += (Math.random() - 0.5) * state.hud.shake * 22;
    cam.y += (Math.random() - 0.5) * state.hud.shake * 22;
  }
}

function render() {
  const state = world.state;
  const cam = state.camera;
  resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state.screen === 'title') {
    drawTitle(ctx, state, state.backdrop);
    return;
  }

  updateCamera();
  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  // World space: the camera rect in world coordinates.
  const view = { x: cam.x, y: cam.y, w: cam.w, h: cam.h };
  drawCity(ctx, state.city, view);
  drawMissionMarkers(ctx, state, view);
  drawTraffic(ctx, state.traffic, view);
  if (state.player.car) {
    drawCar(ctx, state.player.car, view, true);
  } else {
    drawPlayer(ctx, state.player, view);
  }
  drawPolice(ctx, state, view);
  drawCombat(ctx, state, view);
  ctx.restore();

  // Screen space: minimap, HUD, overlays.
  drawMinimap(ctx, state);
  drawHUD(ctx, state);
  if (state.screen === 'pause') drawPause(ctx, state);
  if (state.screen === 'busted') drawEnd(ctx, state, 'busted');
  if (state.screen === 'wasted') drawEnd(ctx, state, 'wasted');
}

function respawn() {
  const state = world.state;
  state.screen = 'play';
  state.wanted = 0;
  state.player.health = 100;
  state.player.car = null;
  state.player.x = 1600;
  state.player.y = 2050;
  state.player.angle = -Math.PI / 2;
  state.police = createPolice();
  state.money = Math.max(0, state.money - 100);
  state.hud.message('Back on the street. $100 bail paid.', 3);
  saveGame(state);
}

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  const state = world.state;
  const input = liveInput();

  if (input.pressed('KeyM')) state.audio.toggleMute();

  if (state.screen === 'title' && input.pressed('Enter')) {
    state.screen = 'play';
    startMission(state);
  } else if (state.screen === 'play' && input.pressed('KeyP')) {
    state.screen = 'pause';
  } else if (state.screen === 'pause' && input.pressed('KeyP')) {
    state.screen = 'play';
  } else if (state.screen === 'pause' && input.pressed('KeyR')) {
    world.reset();
  } else if ((state.screen === 'busted' || state.screen === 'wasted') && input.pressed('Enter')) {
    respawn();
  }

  if (state.screen === 'play') world.step(dt, input);
  render();
  pressedKeys.clear();
  requestAnimationFrame(loop);
}

// Screenshot mode: ?shot=chase|story|steal|vista stages the scene, runs the
// real simulation forward, draws one frame and signals readiness.
const shotName = new URLSearchParams(window.location.search).get('shot');
if (shotName) {
  resizeCanvas();
  stageShot(shotName, world);
  // The camera eases toward the player one step per render, and a shot
  // renders once — so snap it onto the player now (vista frames itself).
  if (!world.state.camera.vista) {
    const cam = world.state.camera;
    const player = world.state.player;
    cam.x = Math.max(0, Math.min(WORLD.width - cam.w, player.x - cam.w / 2));
    cam.y = Math.max(0, Math.min(WORLD.height - cam.h, player.y - cam.h / 2));
  }
  render();
  window.__shotReady = true;
} else {
  requestAnimationFrame(loop);
}
