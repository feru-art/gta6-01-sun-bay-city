// Marisol — Neon Tide: the game loop. Wires every system together: input,
// camera, update, render, missions, shops, and the screenshot mode the
// headless browser uses to take the entry's four shots.

import { WORLD_W, WORLD_H, ROAD_X, ROAD_Y, TUNING, clamp } from './config.js';
import { buildCity, drawCity, districtAt } from './city.js';
import { makeClock, advanceClock, phaseOf, darkness, drawLighting, drawRain } from './clock.js';
import { makePlayer, moveOnFoot, hurtPlayer, drawPlayer } from './player.js';
import { makeCar, spawnParked, driveCar, pushOutOfBuildings, drawCar } from './vehicles.js';
import { spawnTraffic, updateTraffic, scatterPeds, drawPeds } from './traffic.js';
import { makePolice, addHeat, decayHeat, updatePolice, drawPolice } from './police.js';
import { makeCombat, fire, spawnGang, updateCombat, drawCombat } from './combat.js';
import { makeMissions, currentMission, currentStep, startMission, advanceStep, stepReached } from './missions.js';
import { makeEconomy, openShop, closeShop, buyItem, tickEconomy, drawShop } from './economy.js';
import { makeActivities, startTaxi, updateTaxi, startRace, updateRace, collectPackages, drawActivities } from './activities.js';
import { makeAudio, unlockAudio, playShot, playPickup, playCash, playHonk, playWasted, updateAudio } from './audio.js';
import { saveGame, loadGame, applySave } from './save.js';
import { drawHud } from './hud.js';
import { drawMinimap } from './minimap.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const S = {
  mode: 'title', time: 0,
  city: buildCity(), clock: makeClock(),
  player: makePlayer(1600, 900),
  cars: [], traffic: spawnTraffic(),
  police: makePolice(), combat: makeCombat(),
  missions: makeMissions(), econ: makeEconomy(), activities: makeActivities(),
  audio: makeAudio(),
  camera: { x: 1600, y: 900, zoom: 1, fixed: false },
  keys: {}, mouse: { x: 0, y: 0, down: false },
  particles: [], skid: [],
  toast: '', toastTimer: 0,
  district: districtAt(1600, 900),
  roadsX: ROAD_X, roadsY: ROAD_Y,
  shot: 0, escapeTimer: 0, missionDelay: 0, shotFrame: 0,
};
S.cars = spawnParked(S.city);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function showToast(text, secs) {
  S.toast = text;
  S.toastTimer = secs || 3;
}

function armStep(mis, step) {
  if (step.heat) addHeat(S.police, step.heat);
  if (step.type === 'fight') spawnGang(S.combat, step.x, step.y, step.foes);
  if (step.type === 'escape') S.escapeTimer = 0;
}

function mouseWorld() {
  const z = S.camera.zoom;
  return {
    x: S.camera.x + (S.mouse.x - canvas.width / 2) / z,
    y: S.camera.y + (S.mouse.y - canvas.height / 2) / z,
  };
}

function nearestCar(x, y, maxD) {
  let best = null, bd = maxD;
  for (const c of S.cars) {
    const d = Math.hypot(c.x - x, c.y - y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function interact() {
  const p = S.player;
  if (S.econ.shopOpen) { closeShop(S.econ); return; }
  const pois = S.city.pois;
  if (Math.hypot(p.x - pois.gunShop.x, p.y - pois.gunShop.y) < 130) { openShop(S.econ, 'guns'); return; }
  if (Math.hypot(p.x - pois.carDealer.x, p.y - pois.carDealer.y) < 130) { openShop(S.econ, 'cars'); return; }
  if (Math.hypot(p.x - pois.safehouse.x, p.y - pois.safehouse.y) < 130) {
    if (S.econ.owned.safehouse) {
      saveGame(S);
      showToast('Game saved at the safehouse');
    } else {
      openShop(S.econ, 'property');
    }
    return;
  }
  if (p.car) {
    const c = p.car;
    p.car = null;
    p.x = c.x + 30; p.y = c.y + 30;
    c.driver = null;
    return;
  }
  const c = nearestCar(p.x, p.y, 70);
  if (c) {
    p.car = c;
    c.driver = 'player';
    if (!c.ownedByPlayer) {
      addHeat(S.police, 6);
      showToast('Car stolen — the cops noticed');
    }
  }
}

function tryShoot() {
  const p = S.player;
  if (p.dead) return;
  const aim = mouseWorld();
  p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);
  if (fire(S.combat, p, aim.x, aim.y)) {
    if (p.weapon !== 'fists') {
      playShot(S.audio);
      addHeat(S.police, 2);
      scatterPeds(S.traffic, p.x, p.y);
    } else {
      for (const f of S.combat.foes) {
        if (!f.dead && Math.hypot(f.x - p.x, f.y - p.y) < 46) {
          f.hp -= 12;
          if (f.hp <= 0) f.dead = true;
        }
      }
    }
  }
}

function startGame() {
  if (S.mode !== 'title') return;
  unlockAudio(S.audio);
  document.getElementById('title').style.display = 'none';
  S.mode = 'play';
  const saved = loadGame();
  if (saved) {
    applySave(S, saved);
    showToast('Save loaded — welcome back to Marisol');
  }
}

window.addEventListener('keydown', (e) => {
  unlockAudio(S.audio);
  S.keys[e.code] = true;
  if (e.code === 'Enter' && S.mode === 'title') startGame();
  if (S.mode !== 'play') return;
  if (e.code === 'KeyP') {
    S.mode = 'pause';
    document.getElementById('pause').style.display = 'flex';
    return;
  }
  if (e.code === 'KeyE') interact();
  if (e.code === 'KeyF') tryShoot();
  if (e.code === 'KeyM') S.audio.muted = !S.audio.muted;
  if (e.code === 'KeyH' && S.player.car) playHonk(S.audio);
  if (e.code === 'KeyS') { saveGame(S); showToast('Game saved'); }
  if (e.code === 'KeyT' && !S.activities.taxi && S.player.car) {
    const t = startTaxi(S.activities, S.player);
    showToast(`Taxi fare: $${t.fare} — follow the gold marker`);
  }
  if (e.code === 'KeyR') {
    if (S.player.dead) {
      S.player.dead = false;
      S.player.hp = TUNING.playerHp;
      S.player.money = Math.floor(S.player.money * 0.9);
      S.player.x = S.city.pois.safehouse.x;
      S.player.y = S.city.pois.safehouse.y;
      S.player.car = null;
      S.police.wanted = 0; S.police.heat = 0; S.police.cops = []; S.police.heli = null;
    } else if (!S.activities.race && S.player.car) {
      startRace(S.activities);
      showToast('Street race! Hit every checkpoint');
    }
  }
  if (e.code === 'Digit1' || e.code === 'Digit2') {
    if (S.econ.shopOpen) {
      const kind = S.econ.shopOpen;
      const idx = e.code === 'Digit1' ? 0 : 1;
      const items = kind === 'guns' ? ['pistol', 'smg'] : kind === 'cars' ? ['sportscar', 'truck'] : ['safehouse'];
      if (items[idx]) {
        const r = buyItem(S.econ, S.player, kind, items[idx]);
        if (r.ok) {
          playCash(S.audio);
          showToast(`${r.item.name} bought — $${r.item.price}`);
          if (items[idx] === 'sportscar') {
            const c = makeCar(S.city.pois.carDealer.x, S.city.pois.carDealer.y + 60, 0, 'sport');
            c.ownedByPlayer = true;
            c.color = '#d64545';
            S.cars.push(c);
          }
        } else {
          showToast(r.why);
        }
      }
    }
  }
  if (e.code === 'Escape' && S.econ.shopOpen) closeShop(S.econ);
});
window.addEventListener('keyup', (e) => { S.keys[e.code] = false; });
window.addEventListener('mousemove', (e) => { S.mouse.x = e.clientX; S.mouse.y = e.clientY; });
window.addEventListener('mousedown', () => {
  if (S.mode === 'title') startGame();
  else if (S.mode === 'play') tryShoot();
});
document.getElementById('title').addEventListener('click', startGame);
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' && S.mode === 'pause') {
    S.mode = 'play';
    document.getElementById('pause').style.display = 'none';
  }
});

function update(dt) {
  S.time += dt;
  advanceClock(S.clock, dt);
  const p = S.player;
  const k = S.keys;
  const input = {
    x: (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0),
    y: (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0),
    run: !!(k.ShiftLeft || k.ShiftRight),
  };
  if (S.shot === 1) { input.x = 0; input.y = 0; }
  if (!p.dead) {
    if (p.car) {
      const car = p.car;
      const drive = {
        throttle: (k.KeyW || k.ArrowUp || S.shot === 1) ? 1 : 0,
        brake: (k.KeyS || k.ArrowDown) ? 1 : 0,
        steer: input.x,
        handbrake: !!k.Space,
      };
      driveCar(car, drive, dt);
      pushOutOfBuildings(car, S.city.buildings);
      if (drive.handbrake && Math.abs(car.speed) > 200) {
        S.skid.push({ x: car.x, y: car.y, a: car.angle, life: 3 });
      }
      p.x = car.x; p.y = car.y; p.angle = car.angle;
    } else {
      moveOnFoot(p, input, dt, S.city.buildings);
    }
  }
  updateTraffic(S.traffic, dt, S.police.wanted > 0);
  updatePolice(S.police, p, dt, Math.random);
  const nearestCop = S.police.cops.reduce((m, c) => Math.min(m, Math.hypot(c.x - p.x, c.y - p.y)), 1e9);
  decayHeat(S.police, dt, nearestCop > 420 && !S.police.heli);
  updateCombat(S.combat, p, dt,
    (dmg) => { hurtPlayer(p, dmg); if (p.dead) playWasted(S.audio); },
    () => { p.money += 25; });
  // Missions.
  const m = S.missions;
  if (m.dialogTimer > 0) m.dialogTimer -= dt;
  if (m.flash > 0) m.flash -= dt;
  if (!m.active && !m.done) {
    S.missionDelay += dt;
    if (S.missionDelay > 2.5) {
      S.missionDelay = 0;
      startMission(m, armStep);
    }
  } else if (m.active) {
    const step = currentStep(m);
    let doneStep = stepReached(m, p, S.combat);
    if (step && step.type === 'escape') {
      S.escapeTimer += dt;
      if (S.escapeTimer > 15 || S.police.wanted === 0) doneStep = true;
    }
    if (doneStep) {
      const r = advanceStep(m, armStep);
      if (r.completed) {
        p.money += r.completed.pay;
        playCash(S.audio);
        showToast(`${r.completed.name} complete — +$${r.completed.pay}`);
        saveGame(S);
      }
    }
  }
  // Activities.
  const fare = updateTaxi(S.activities, p);
  if (fare) { p.money += fare; playCash(S.audio); showToast(`Fare paid — +$${fare}`); }
  const race = updateRace(S.activities, p, dt);
  if (race) {
    p.money += race.prize;
    playCash(S.audio);
    showToast(`Race finished in ${race.time.toFixed(1)}s — +$${race.prize}`);
  }
  const found = collectPackages(S.activities, p);
  if (found > 0) {
    p.money += 100 * found;
    playPickup(S.audio);
    showToast(`Package found — +$${100 * found}`);
  }
  const income = tickEconomy(S.econ, p, dt);
  if (income > 0) showToast(`Safehouse income — +$${income}`);
  // Particles and skid marks.
  S.skid = S.skid.filter((s) => (s.life -= dt) > 0);
  if (S.toastTimer > 0) S.toastTimer -= dt;
  // Camera.
  if (!S.camera.fixed) {
    const snap = S.shot > 0;
    const t = snap ? 1 : Math.min(1, 5 * dt);
    S.camera.x += (p.x - S.camera.x) * t;
    S.camera.y += (p.y - S.camera.y) * t;
  }
  S.district = districtAt(p.x, p.y);
  updateAudio(S.audio, p.car ? p.car.speed : p.speed, S.police.wanted, dt);
}

function render() {
  const w = canvas.width, h = canvas.height;
  const z = S.camera.zoom;
  const vx0 = S.camera.x - w / 2 / z, vy0 = S.camera.y - h / 2 / z;
  const view = { x0: vx0, y0: vy0, x1: vx0 + w / z, y1: vy0 + h / z };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0, 0, w, h);
  ctx.setTransform(z, 0, 0, z, w / 2 - S.camera.x * z, h / 2 - S.camera.y * z);
  drawCity(ctx, S.city, S.camera, view);
  drawActivities(ctx, S.activities, view);
  for (const s of S.skid) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.a);
    ctx.fillStyle = `rgba(20,20,20,${0.35 * s.life / 3})`;
    ctx.fillRect(-16, -8, 32, 4);
    ctx.fillRect(-16, 4, 32, 4);
    ctx.restore();
  }
  const night = phaseOf(S.clock) !== 'day';
  for (const c of S.traffic.cars) drawCar(ctx, c, night);
  for (const c of S.cars) drawCar(ctx, c, night);
  for (const c of S.police.cops) drawCar(ctx, c, night);
  drawPeds(ctx, S.traffic, view);
  drawPlayer(ctx, S.player, S.time);
  drawCombat(ctx, S.combat, S.player);
  drawPolice(ctx, S.police, view);
  drawLighting(ctx, S.clock, view, S.player, [...S.cars, ...S.police.cops]);
  drawRain(ctx, S.clock, view, S.time);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawHud(ctx, S, w, h);
  drawMinimap(ctx, S, w, h);
  if (S.econ.shopOpen) drawShop(ctx, S.econ, S.player, w, h);
}

function frame(now) {
  requestAnimationFrame(frame);
  if (S.mode !== 'play') { render(); return; }
  const dt = Math.min(0.05, (now - (S.last || now)) / 1000 || 0.016);
  S.last = now;
  update(dt);
  render();
}

// Screenshot mode: stage, simulate a fixed 1.5 s, freeze, signal ready.
const params = new URLSearchParams(location.search);
const shotNo = parseInt(params.get('shot') || '0', 10);
if (shotNo > 0) {
  S.shot = shotNo;
  document.getElementById('title').style.display = 'none';
  S.mode = 'play';
  stageShot(S, shotNo);
  for (let i = 0; i < 90; i++) update(1 / 60);
  render();
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}
