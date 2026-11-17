// Marisol — side activities: taxi fares, a street race with checkpoints,
// and ten hidden packages scattered across the city.

import { mulberry32 } from './config.js';
import { nearestRoad } from './city.js';

export function makeActivities() {
  const rng = mulberry32(31337);
  const packages = [];
  const spots = [
    [400, 350], [1000, 900], [1600, 1450], [2200, 2000], [2800, 2550],
    [3400, 3100], [4000, 350], [4400, 1450], [700, 3100], [3700, 620],
  ];
  for (const [x, y] of spots) {
    packages.push({ x: x + (rng() - 0.5) * 60, y: y + (rng() - 0.5) * 60, taken: false });
  }
  return {
    packages,
    taxi: null, // {px, py, dx, dy, fare, picked}
    race: null, // {points, next, timer}
    stats: { packages: 0, fares: 0, races: 0 },
  };
}

export function startTaxi(a, player) {
  const dest = nearestRoad(player.x + 900 + Math.random() * 1200, player.y + (Math.random() - 0.5) * 1600);
  a.taxi = {
    px: player.x, py: player.y, dx: dest.x, dy: dest.y,
    fare: 60 + Math.floor(Math.random() * 90), picked: true,
  };
  return a.taxi;
}

export function updateTaxi(a, player) {
  if (!a.taxi) return null;
  const t = a.taxi;
  if (Math.hypot(player.x - t.dx, player.y - t.dy) < 100) {
    const fare = t.fare;
    a.taxi = null;
    a.stats.fares += 1;
    return fare;
  }
  return null;
}

const RACE_POINTS = [
  [1000, 2000], [1000, 900], [2200, 900], [2200, 2000],
  [3400, 2000], [3400, 900], [2200, 350], [1000, 350],
];

export function startRace(a) {
  a.race = { points: RACE_POINTS, next: 0, timer: 0, best: null };
  return a.race;
}

export function updateRace(a, player, dt) {
  if (!a.race) return null;
  const r = a.race;
  r.timer += dt;
  const [tx, ty] = r.points[r.next];
  if (Math.hypot(player.x - tx, player.y - ty) < 110) {
    r.next += 1;
    if (r.next >= r.points.length) {
      const time = r.timer;
      const prize = time < 75 ? 500 : time < 110 ? 250 : 100;
      a.race = null;
      a.stats.races += 1;
      return { time, prize };
    }
  }
  return null;
}

export function collectPackages(a, player) {
  let found = 0;
  for (const p of a.packages) {
    if (!p.taken && Math.hypot(player.x - p.x, player.y - p.y) < 42) {
      p.taken = true;
      a.stats.packages += 1;
      found += 1;
    }
  }
  return found;
}

export function drawActivities(ctx, a, view) {
  for (const p of a.packages) {
    if (p.taken) continue;
    if (p.x < view.x0 || p.x > view.x1 || p.y < view.y0 || p.y > view.y1) continue;
    ctx.fillStyle = '#ffde59';
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 222, 89, 0.25)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fill();
  }
  if (a.taxi) {
    const t = a.taxi;
    ctx.fillStyle = '#f5c518';
    ctx.beginPath(); ctx.arc(t.dx, t.dy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', t.dx, t.dy + 4);
  }
  if (a.race) {
    const r = a.race;
    r.points.forEach(([x, y], i) => {
      if (i < r.next) return;
      ctx.strokeStyle = i === r.next ? '#00e676' : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.stroke();
    });
  }
}
