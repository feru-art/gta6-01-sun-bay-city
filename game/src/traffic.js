// Marisol — the living street: traffic cars that follow the road grid and
// pedestrians who stroll the sidewalks and scatter when shots ring out.

import { ROAD_X, ROAD_Y, ROAD_W, TUNING, mulberry32 } from './config.js';
import { makeCar, driveCar } from './vehicles.js';
import { nearestRoad } from './city.js';

const SHIRTS = ['#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#e9c46a', '#9b5de5', '#f15bb5', '#6a994e'];

export function spawnTraffic() {
  const rng = mulberry32(4242);
  const cars = [];
  for (let i = 0; i < 16; i++) {
    const vertical = rng() > 0.5;
    const rx = ROAD_X[Math.floor(rng() * ROAD_X.length)];
    const ry = ROAD_Y[Math.floor(rng() * ROAD_Y.length)];
    const c = makeCar(rx, 200 + rng() * 3200, vertical ? Math.PI / 2 : 0, 'sedan');
    if (!vertical) { c.x = 200 + rng() * 4200; c.y = ry; c.angle = 0; }
    c.driver = 'traffic';
    c.speed = TUNING.trafficSpeed * (0.8 + rng() * 0.5);
    c.vertical = vertical;
    cars.push(c);
  }
  const peds = [];
  for (let i = 0; i < 34; i++) {
    const rx = ROAD_X[Math.floor(rng() * ROAD_X.length)];
    const ry = ROAD_Y[Math.floor(rng() * ROAD_Y.length)];
    const vertical = rng() > 0.5;
    peds.push({
      x: vertical ? rx + ROAD_W / 2 + 12 : 200 + rng() * 4200,
      y: vertical ? 200 + rng() * 3200 : ry + ROAD_W / 2 + 12,
      angle: vertical ? (rng() > 0.5 ? Math.PI / 2 : -Math.PI / 2) : (rng() > 0.5 ? 0 : Math.PI),
      speed: TUNING.pedSpeed * (0.7 + rng() * 0.7),
      shirt: SHIRTS[Math.floor(rng() * SHIRTS.length)],
      state: 'walk', tx: 0, ty: 0,
    });
  }
  return { cars, peds };
}

// Traffic drives straight along its road, turning at intersections.
export function updateTraffic(t, dt, danger) {
  for (const c of t.cars) {
    const ahead = nearestRoad(c.x + Math.cos(c.angle) * 120, c.y + Math.sin(c.angle) * 120);
    if (ahead.vertical !== c.vertical) {
      // Reaching an intersection: pick a new heading along the crossing road.
      c.vertical = ahead.vertical;
      c.angle = ahead.vertical ? (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2) : (Math.random() > 0.5 ? 0 : Math.PI);
    }
    c.x += Math.cos(c.angle) * c.speed * dt;
    c.y += Math.sin(c.angle) * c.speed * dt;
    if (c.x < 60 || c.x > 4460 || c.y < 60 || c.y > 3540) c.angle += Math.PI;
    if (danger) c.speed = Math.max(60, c.speed - 200 * dt);
    else c.speed = Math.min(TUNING.trafficSpeed * 1.2, c.speed + 40 * dt);
  }
  for (const p of t.peds) {
    if (p.state === 'flee') {
      p.x += Math.cos(p.angle) * TUNING.pedSpeed * 2.4 * dt;
      p.y += Math.sin(p.angle) * TUNING.pedSpeed * 2.4 * dt;
      if (Math.hypot(p.x - p.tx, p.y - p.ty) > 320) p.state = 'walk';
    } else {
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (p.x < 60 || p.x > 4460 || p.y < 60 || p.y > 3540) p.angle += Math.PI;
      if (Math.random() < dt * 0.02) p.angle += (Math.random() - 0.5) * 1.2;
    }
  }
}

export function scatterPeds(t, x, y) {
  for (const p of t.peds) {
    if (Math.hypot(p.x - x, p.y - y) < 260) {
      p.state = 'flee';
      p.angle = Math.atan2(p.y - y, p.x - x);
      p.tx = x; p.ty = y;
    }
  }
}

export function drawPeds(ctx, t, view) {
  for (const p of t.peds) {
    if (p.x < view.x0 || p.x > view.x1 || p.y < view.y0 || p.y > view.y1) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(1, 2, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.shirt;
    ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = '#ffd9b3';
    ctx.beginPath(); ctx.arc(7, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
