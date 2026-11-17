// Sun Bay — main loop: input, camera, the fixed simulation step and the
// render pass that draws the city, actors, HUD and minimap every frame.
import { WORLD_W, WORLD_H, PALETTES, TUNING, variantFromUrl, makeRng } from './config.js';
import { buildCity, drawCity, districtAt } from './city.js';
import { spawnTraffic, updateTraffic, drawTraffic } from './traffic.js';
import { updatePolice, drawPolice, raiseWantedLevel } from './police.js';
import { startMission, updateMissions, currentMission, missionDone } from './missions.js';
import { createPlayer, updatePlayer, drawPlayer } from './player.js';
import { updatePlayerCar, enterCar, exitCar, drawPlayerCar, createCar } from './vehicles.js';
import { updateCombat, drawCombat, shootAt, spawnGang } from './combat.js';
import { drawHUD, drawStartScreen } from './hud.js';
import { drawMinimap } from './minimap.js';
import { createAudio, initAudio, updateAudio, playShot as playShotSound } from './audio.js';
import { saveGame, loadGame } from './save.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const params = new URLSearchParams(location.search);
const variant = variantFromUrl();
const VARIANT_LABELS = {
  chase: 'Chase First', story: 'Story Missions', heat: 'Police Heat',
  golden: 'Golden-Hour City', sandbox: 'Activities Sandbox',
};

const G = {
  variant, variantLabel: VARIANT_LABELS[variant],
  tuning: TUNING[variant],
  paletteName: variant === 'golden' ? 'golden' : 'day',
  palette: PALETTES[variant === 'golden' ? 'golden' : 'day'],
  time: 0, keys: {}, mouse: { x: 0, y: 0 },
  player: createPlayer(820, 620),
  playerCar: null, traffic: [], peds: [], police: [], enemies: [],
  bullets: [], particles: [], skids: [], coins: [],
  wanted: 0, heatTimer: 0, cash: 150, score: 0, hasGun: false,
  missionIndex: 0, missionTimer: 0, missionProgress: 0, escapeLeft: 0,
  message: 'Welcome to Sun Bay — press ENTER to start.', messageT: 6,
  dialog: null, started: false, paused: false, gameOver: null, busted: false,
  heli: null, roadblock: null, punch: null, muzzle: null, raceRival: null,
  audio: createAudio(), backdrop: null, shot: null,
  camera: { x: 0, y: 0, w: canvas.width, h: canvas.height },
};

G.city = buildCity(20261117);
const rng = makeRng(77);
spawnTraffic(G, rng, G.tuning.traffic, G.tuning.peds);
// A starter car parked near the spawn, and a gang pair in Harbor.
G.playerCar = createCar(880, 660, 0, '#f2c14e');
spawnGang(G, 2200, 900, 2);

// Golden-hour backdrop for the start screen (copied bytes, never redrawn).
const backdrop = new Image();
backdrop.src = './assets/sun-bay-golden-hour.webp';
backdrop.onload = () => { G.backdrop = backdrop; };
backdrop.onerror = () => { G.backdrop = null; };

// ---- input ----
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  G.keys[e.code] = true;
  initAudio(G);
  if (e.code === 'Enter' && !G.started) {
    G.started = true;
    loadGame(G);
    startMission(G, G.missionIndex);
  }
  if (e.code === 'KeyE' && G.started && !G.gameOver) {
    if (G.player.onFoot) enterCar(G); else exitCar(G);
  }
  if (e.code === 'KeyP' && G.started) G.paused = !G.paused;
  if (e.code === 'KeyM') G.audio.muted = !G.audio.muted;
  if (e.code === 'KeyR' && G.gameOver) restart();
});
window.addEventListener('keyup', (e) => { G.keys[e.code] = false; });
canvas.addEventListener('mousemove', (e) => { G.mouse.x = e.clientX; G.mouse.y = e.clientY; });
canvas.addEventListener('mousedown', (e) => {
  initAudio(G);
  if (!G.started || G.gameOver) return;
  const cam = G.camera;
  shootAt(G, cam.x + e.clientX, cam.y + e.clientY);
  if (G.hasGun) playShotSound(G);
});

function restart() {
  G.player = createPlayer(820, 620);
  G.playerCar = createCar(880, 660, 0, '#f2c14e');
  G.wanted = 0; G.police = []; G.cash = 150; G.score = 0;
  G.missionIndex = 0; G.gameOver = null; G.busted = false;
  G.player.health = 100; G.hasGun = false;
  startMission(G, 0);
}

// ---- simulation step (shared by the live loop and screenshot staging) ----
G.step = function step(dt) {
  G.time += dt;
  G.messageT = Math.max(0, G.messageT - dt);
  if (!G.started || G.paused || G.gameOver) return;
  updatePlayer(G, dt);
  updatePlayerCar(G, dt);
  updateTraffic(G, dt);
  updatePolice(G, dt);
  updateMissions(G, dt);
  updateCombat(G, dt);
  updateAudio(G);
  // Autosave every ~10 seconds.
  if (Math.floor(G.time) % 10 === 0 && Math.floor(G.time - dt) % 10 !== 0) saveGame(G);
  // Mission target arrow: keep the player honest about direction.
  if (G.player.health <= 0 && !G.gameOver) G.gameOver = 'wasted';
};

// ---- render ----
function render() {
  const W = canvas.width, H = canvas.height;
  G.camera.w = W; G.camera.h = H;
  if (!G.started) {
    drawStartScreen(ctx, G, canvas);
    return;
  }
  // Camera follows the player, clamped to the world.
  const cam = G.camera;
  cam.x = Math.max(0, Math.min(WORLD_W - W, G.player.x - W / 2));
  cam.y = Math.max(0, Math.min(WORLD_H - H, G.player.y - H / 2));
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  drawCity(ctx, G, cam);
  // Mission waypoint marker (world-space, pulsing).
  if (!missionDone(G)) {
    const m = currentMission(G);
    if (m.target) {
      const pulse = 18 + Math.sin(G.time * 4) * 5;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(m.target.x, m.target.y, pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.moveTo(m.target.x, m.target.y - pulse - 14); ctx.lineTo(m.target.x - 8, m.target.y - pulse - 2); ctx.lineTo(m.target.x + 8, m.target.y - pulse - 2); ctx.closePath(); ctx.fill();
    }
  }
  drawTraffic(ctx, G);
  drawPlayerCar(ctx, G);
  drawPlayer(ctx, G);
  drawPolice(ctx, G);
  drawCombat(ctx, G);
  // NPC markers.
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  for (const npc of [{ name: 'Rosa', x: 260, y: 620 }, { name: 'Marco', x: 820, y: 320 }, { name: 'Dena', x: 2100, y: 620 }]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(npc.x, npc.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e07a5f';
    ctx.fillText(npc.name, npc.x, npc.y - 16);
  }
  ctx.textAlign = 'left';
  ctx.restore();
  drawHUD(ctx, G, canvas);
  drawMinimap(ctx, G, canvas);
  if (G.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText('P to resume  •  R to restart after BUSTED / WASTED', W / 2, H / 2 + 34);
    ctx.textAlign = 'left';
  }
}

// ---- boot: screenshot staging, then the live loop ----
const shot = params.get('shot');
if (shot) {
  applyShot(G, shot);
  render();
  window.__shotReady = true;
} else {
  const saved = loadGame(G);
  if (saved) G.message = 'Save loaded — welcome back to Sun Bay.';
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  G.step(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
