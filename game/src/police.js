// Marisol — the wanted system: stars that rise with crime, police cars
// that chase and ram, roadblocks and spike strips at high heat, and the
// police helicopter that joins at three stars.

import { TUNING, angleLerp, clamp } from './config.js';
import { makeCar } from './vehicles.js';
import { nearestRoad } from './city.js';

export function makePolice() {
  return {
    wanted: 0, heat: 0, cops: [], heli: null,
    roadblock: null, spikes: null, cooldown: 0,
  };
}

export function addHeat(pol, amount) {
  pol.heat += amount;
  const stars = pol.heat >= 90 ? 5 : pol.heat >= 65 ? 4 : pol.heat >= 42 ? 3
    : pol.heat >= 20 ? 2 : pol.heat >= 6 ? 1 : 0;
  if (stars > pol.wanted) pol.wanted = stars;
}

export function decayHeat(pol, dt, hidden) {
  if (pol.wanted === 0) return;
  pol.cooldown += dt;
  if (hidden && pol.cooldown > 6) {
    pol.heat = Math.max(0, pol.heat - 9 * dt);
    const stars = pol.heat >= 90 ? 5 : pol.heat >= 65 ? 4 : pol.heat >= 42 ? 3
      : pol.heat >= 20 ? 2 : pol.heat >= 6 ? 1 : 0;
    pol.wanted = stars;
    if (pol.wanted < 3) pol.heli = null;
    if (pol.wanted < 4) { pol.roadblock = null; pol.spikes = null; }
  } else if (!hidden) {
    pol.cooldown = 0;
  }
}

function spawnCopNear(pol, px, py, rng) {
  const spot = nearestRoad(px + (rng() - 0.5) * 1400, py + (rng() - 0.5) * 1400);
  const c = makeCar(spot.x, spot.y, spot.vertical ? Math.PI / 2 : 0, 'police');
  c.driver = 'cop';
  c.siren = true;
  c.color = '#1d3557';
  pol.cops.push(c);
}

export function updatePolice(pol, player, dt, rng) {
  const want = Math.min(pol.wanted, 5);
  const target = want === 0 ? 0 : want + 1;
  while (pol.cops.length < target) spawnCopNear(pol, player.x, player.y, rng);
  while (pol.cops.length > target) pol.cops.pop();
  for (const c of pol.cops) {
    const wantAngle = Math.atan2(player.y - c.y, player.x - c.x);
    c.angle = angleLerp(c.angle, wantAngle, Math.min(1, 2.2 * dt));
    const d = Math.hypot(player.x - c.x, player.y - c.y);
    const top = d > 500 ? TUNING.copMax : TUNING.copMax * 0.8;
    c.speed = Math.min(top, c.speed + TUNING.copAccel * dt);
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    // Ram: nudge the player sideways on contact.
    if (d < 46) {
      const push = 130 * dt;
      player.x += Math.cos(c.angle) * push;
      player.y += Math.sin(c.angle) * push;
      if (player.car) { player.car.x = player.x; player.car.y = player.y; }
    }
  }
  if (pol.wanted >= 3 && !pol.heli) {
    pol.heli = { x: player.x - 500, y: player.y - 400, angle: 0, rotor: 0 };
  }
  if (pol.heli) {
    const h = pol.heli;
    h.rotor += dt * 30;
    const wantAngle = Math.atan2(player.y - h.y, player.x - h.x);
    h.angle = angleLerp(h.angle, wantAngle, Math.min(1, 1.5 * dt));
    const d = Math.hypot(player.x - h.x, player.y - h.y);
    if (d > 260) {
      h.x += Math.cos(h.angle) * TUNING.heliSpeed * dt;
      h.y += Math.sin(h.angle) * TUNING.heliSpeed * dt;
    }
  }
  if (pol.wanted >= 4 && !pol.roadblock) {
    const ahead = nearestRoad(player.x + 500, player.y);
    pol.roadblock = { x: ahead.x, y: player.y, vertical: ahead.vertical };
    pol.spikes = { x: ahead.x - (ahead.vertical ? 0 : 120), y: player.y - (ahead.vertical ? 120 : 0) };
  }
}

export function drawPolice(ctx, pol, view) {
  if (pol.roadblock) {
    const r = pol.roadblock;
    ctx.fillStyle = '#ff6b35';
    for (let i = -1; i <= 1; i++) {
      const ox = r.vertical ? 0 : i * 34;
      const oy = r.vertical ? i * 34 : 0;
      ctx.fillRect(r.x + ox - 12, r.y + oy - 8, 24, 16);
      ctx.fillStyle = '#fff';
      ctx.fillRect(r.x + ox - 12, r.y + oy - 8, 24, 5);
      ctx.fillStyle = '#ff6b35';
    }
  }
  if (pol.spikes) {
    ctx.fillStyle = '#222';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(pol.spikes.x - 30 + i * 12, pol.spikes.y - 6);
      ctx.lineTo(pol.spikes.x - 24 + i * 12, pol.spikes.y + 6);
      ctx.lineTo(pol.spikes.x - 30 + i * 12, pol.spikes.y + 6);
      ctx.fill();
    }
  }
  if (pol.heli) {
    const h = pol.heli;
    // Searchlight cone on the ground.
    const gx = h.x + Math.cos(h.angle) * 60;
    const gy = h.y + Math.sin(h.angle) * 60;
    const g = ctx.createRadialGradient(gx, gy, 8, gx, gy, 190);
    g.addColorStop(0, 'rgba(255, 250, 200, 0.30)');
    g.addColorStop(1, 'rgba(255, 250, 200, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, gy, 190, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(10, 14, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14213d';
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fca311';
    ctx.fillRect(-6, -4, 18, 8);
    ctx.strokeStyle = '#0b0e1a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30 * Math.cos(h.rotor), -30 * Math.sin(h.rotor));
    ctx.lineTo(30 * Math.cos(h.rotor), 30 * Math.sin(h.rotor));
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MPD AIR 1', h.x, h.y - 34);
  }
}
