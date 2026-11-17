// Sun Bay police: the wanted system and the force that answers it. V3's
// heart is the heat escalation — patrol, chase, roadblock, spike strip, then
// the helicopter — so every star visibly changes what the player faces.
import { WORLD, TUNE, clamp, distance, angleTo, turnToward } from './config.js';
import { nearestRoadPoint } from './city.js';
import { drawCarBody } from './traffic.js';

export const COP_COLOURS = { body: '#1c2f4a', stripe: '#e8e8e8' };

// How many pursuit cars each wanted level fields.
const PURSUIT_COUNT = [0, 1, 2, 3, 4, 5];

export function createPolice() {
  return {
    cars: [],
    heli: null,
    roadblocks: [],
    spikes: [],
    bustedTimer: 0,
    decayTimer: 0,
    sirenPhase: 0,
  };
}

export function addWanted(state, amount, reason) {
  const before = state.wanted;
  state.wanted = clamp(state.wanted + amount, 0, 5);
  if (state.wanted > before) {
    state.hud.flashStars = 1.2;
    if (reason) state.hud.message(reason, 2.2);
  }
}

function spawnCopCar(state, atEdge) {
  const player = state.player;
  let x;
  let y;
  if (atEdge) {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { x = player.x - 700; y = player.y; }
    else if (side === 1) { x = player.x + 700; y = player.y; }
    else if (side === 2) { x = player.x; y = player.y - 500; }
    else { x = player.x; y = player.y + 500; }
  } else {
    x = player.x + (Math.random() - 0.5) * 900;
    y = player.y + (Math.random() - 0.5) * 700;
  }
  const snap = nearestRoadPoint(x, y);
  return {
    x: clamp(snap.x, 130, WORLD.width - 20),
    y: clamp(snap.y, 20, WORLD.height - 20),
    angle: angleTo(snap.x, snap.y, player.x, player.y),
    speed: 0,
    siren: Math.random() * Math.PI * 2,
    ramCooldown: 0,
  };
}

function placeRoadblock(state) {
  const player = state.player;
  // Ahead of the player's direction of travel, on the nearest road.
  const ahead = 420;
  const ax = player.x + Math.cos(player.angle) * ahead;
  const ay = player.y + Math.sin(player.angle) * ahead;
  const snap = nearestRoadPoint(ax, ay);
  const roadAngle = Math.abs(snap.x - ax) > Math.abs(snap.y - ay) ? Math.PI / 2 : 0;
  const block = {
    x: clamp(snap.x, 150, WORLD.width - 30),
    y: clamp(snap.y, 30, WORLD.height - 30),
    angle: roadAngle,
    cars: 2,
    cones: 6,
  };
  state.police.roadblocks = [block];
  state.hud.message('Roadblock ahead!', 2.0);
}

function placeSpikes(state) {
  const player = state.player;
  const ax = player.x + Math.cos(player.angle) * 300;
  const ay = player.y + Math.sin(player.angle) * 300;
  const snap = nearestRoadPoint(ax, ay);
  state.police.spikes = [{ x: snap.x, y: snap.y, angle: player.angle + Math.PI / 2, hit: false }];
}

export function updatePolice(state, dt) {
  const police = state.police;
  const player = state.player;
  const wanted = state.wanted;
  police.sirenPhase += dt * 9;

  // Field the right number of pursuit cars.
  const want = PURSUIT_COUNT[wanted];
  while (police.cars.length < want) police.cars.push(spawnCopCar(state, police.cars.length === 0));
  while (police.cars.length > want) police.cars.pop();

  // Roadblocks from 3 stars, spike strips from 4, helicopter at 5.
  if (wanted >= 3 && police.roadblocks.length === 0) placeRoadblock(state);
  if (wanted < 3) police.roadblocks = [];
  if (wanted >= 4 && police.spikes.length === 0) placeSpikes(state);
  if (wanted < 4) police.spikes = [];
  if (wanted >= 5 && !police.heli) {
    police.heli = { x: player.x - 300, y: player.y - 300, angle: 0, rotor: 0 };
    state.hud.message('SBPD AIR 1 is overhead!', 2.4);
  }
  if (wanted < 5) police.heli = null;

  // Pursuit: steer toward the player, ram when close, ease off to re-aim.
  for (const cop of police.cars) {
    cop.siren += dt * 7;
    cop.ramCooldown = Math.max(0, cop.ramCooldown - dt);
    const target = angleTo(cop.x, cop.y, player.x, player.y);
    cop.angle += turnToward(cop.angle, target, 2.4 * dt);
    const dist = distance(cop.x, cop.y, player.x, player.y);
    const wantSpeed = dist > 320 ? TUNE.copMaxSpeed : TUNE.copMaxSpeed * 0.72;
    cop.speed += (wantSpeed - cop.speed) * Math.min(1, dt * 1.6);
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    cop.x = clamp(cop.x, 125, WORLD.width - 15);
    cop.y = clamp(cop.y, 15, WORLD.height - 15);
    // Ram: a hard shove when the cop reaches the player's car.
    if (player.car && dist < 52 && cop.ramCooldown <= 0) {
      cop.ramCooldown = 1.4;
      player.car.damage = Math.min(100, (player.car.damage || 0) + 9);
      player.car.speed *= 0.82;
      player.car.x += Math.cos(cop.angle) * 14;
      player.car.y += Math.sin(cop.angle) * 14;
      state.hud.shake = 0.35;
      state.audio.crash();
    }
  }

  // Helicopter: keeps station above the player, spotlight sweeping.
  if (police.heli) {
    const heli = police.heli;
    heli.rotor += dt * 30;
    const tx = player.x + Math.cos(state.time * 0.5) * 40;
    const ty = player.y - 90 + Math.sin(state.time * 0.4) * 30;
    heli.x += (tx - heli.x) * Math.min(1, dt * 1.4);
    heli.y += (ty - heli.y) * Math.min(1, dt * 1.4);
    heli.angle = angleTo(heli.x, heli.y, player.x, player.y);
  }

  // Spike strip: shreds tyres when the player's car crosses it.
  for (const strip of police.spikes) {
    if (!strip.hit && player.car && distance(player.x, player.y, strip.x, strip.y) < 46) {
      strip.hit = true;
      player.car.speed *= 0.45;
      player.car.damage = Math.min(100, (player.car.damage || 0) + 22);
      state.hud.message('Spike strip! Tyres shredded.', 2.2);
      state.hud.shake = 0.5;
      state.audio.crash();
    }
  }

  // Wanted decay: break line of sight and the heat cools off.
  if (wanted > 0) {
    const nearestCop = police.cars.reduce((m, c) => Math.min(m, distance(c.x, c.y, player.x, player.y)), Infinity);
    const hidden = nearestCop > 620 && !police.heli;
    if (hidden) {
      police.decayTimer += dt;
      if (police.decayTimer > TUNE.wantedDecaySeconds) {
        police.decayTimer = 0;
        state.wanted = Math.max(0, state.wanted - 1);
        if (state.wanted === 0) state.hud.message('You lost them. Heat is off.', 2.4);
      }
    } else {
      police.decayTimer = 0;
    }
  }

  // Busted: on foot, slow, and a cop right on top of the player.
  if (!player.car && wanted > 0) {
    const nearestCop = police.cars.reduce((m, c) => Math.min(m, distance(c.x, c.y, player.x, player.y)), Infinity);
    if (nearestCop < TUNE.bustedRadius && player.speed < 40) {
      police.bustedTimer += dt;
      if (police.bustedTimer > 1.6) {
        state.screen = 'busted';
        state.audio.busted();
      }
    } else {
      police.bustedTimer = Math.max(0, police.bustedTimer - dt * 2);
    }
  } else {
    police.bustedTimer = 0;
  }
}

function drawCopCar(ctx, cop, cam, sirenPhase) {
  const sx = cop.x - cam.x;
  const sy = cop.y - cam.y;
  if (sx < -60 || sy < -60 || sx > cam.w + 60 || sy > cam.h + 60) return;
  drawCarBody(ctx, sx, sy, cop.angle, COP_COLOURS.body, 48, 25);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(cop.angle);
  ctx.fillStyle = COP_COLOURS.stripe;
  ctx.fillRect(-14, -12, 28, 3);
  ctx.fillRect(-14, 9, 28, 3);
  // Flashing light bar.
  const on = Math.sin(cop.siren) > 0;
  ctx.fillStyle = on ? '#ff2d2d' : '#7a1a1a';
  ctx.beginPath();
  ctx.arc(-4, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = on ? '#2d5dff' : '#1a2a7a';
  ctx.beginPath();
  ctx.arc(4, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Siren glow on the road.
  const glow = Math.sin(cop.siren) > 0 ? 'rgba(255, 45, 45, 0.18)' : 'rgba(45, 93, 255, 0.18)';
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, 44, 0, Math.PI * 2);
  ctx.fill();
}

export function drawPolice(ctx, state, cam) {
  const police = state.police;
  // Roadblocks: two cop cars across the road + cones.
  for (const block of police.roadblocks) {
    const sx = block.x - cam.x;
    const sy = block.y - cam.y;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(block.angle);
    drawCarBody(ctx, -30, 0, 0, COP_COLOURS.body, 48, 25);
    drawCarBody(ctx, 30, 0, 0, COP_COLOURS.body, 48, 25);
    ctx.fillStyle = '#ff7a1a';
    for (let i = 0; i < block.cones; i += 1) {
      const cx = -70 + i * 28;
      ctx.beginPath();
      ctx.moveTo(cx - 5, 22);
      ctx.lineTo(cx, 10);
      ctx.lineTo(cx + 5, 22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  // Spike strips.
  for (const strip of police.spikes) {
    if (strip.hit) continue;
    const sx = strip.x - cam.x;
    const sy = strip.y - cam.y;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(strip.angle);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(-34, -4, 68, 8);
    ctx.fillStyle = '#c8c8c8';
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-30 + i * 8, -4);
      ctx.lineTo(-26 + i * 8, -10);
      ctx.lineTo(-22 + i * 8, -4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  for (const cop of police.cars) drawCopCar(ctx, cop, cam, police.sirenPhase);
  // Helicopter with its spotlight cone.
  if (police.heli) {
    const heli = police.heli;
    const hx = heli.x - cam.x;
    const hy = heli.y - cam.y;
    const px = state.player.x - cam.x;
    const py = state.player.y - cam.y;
    const grad = ctx.createRadialGradient(px, py, 10, px, py, 130);
    grad.addColorStop(0, 'rgba(255, 244, 180, 0.4)');
    grad.addColorStop(1, 'rgba(255, 244, 180, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 244, 180, 0.10)';
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy + 6);
    ctx.lineTo(hx + 8, hy + 6);
    ctx.lineTo(px + 60, py);
    ctx.lineTo(px - 60, py);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(20, 20, 30, 0.5)';
    ctx.beginPath();
    ctx.ellipse(hx + 14, hy + 18, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(heli.angle);
    ctx.fillStyle = '#1c2f4a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(14, -2, 16, 4);
    ctx.fillStyle = '#ff2d2d';
    ctx.beginPath();
    ctx.arc(-20, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Rotor blur.
    ctx.strokeStyle = 'rgba(220, 220, 230, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 34, 6, heli.rotor % Math.PI, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SBPD AIR 1', hx, hy - 30);
    ctx.textAlign = 'left';
  }
}
