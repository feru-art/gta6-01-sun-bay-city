// Sun Bay — traffic cars and pedestrians: they drive the road grid and
// walk the sidewalks, so the city feels alive even when the player idles.
import { ROAD_XS, ROAD_YS, collideBuildings } from './city.js';
import { makeRng } from './config.js';

const CAR_COLORS = ['#d64541', '#3a7bd5', '#f2c14e', '#7bc47f', '#e8e8e8', '#8e44ad', '#2ecc71', '#e67e22'];
const SHIRT_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#ecf0f1', '#fd79a8'];

export function spawnTraffic(G, rng, nCars, nPeds) {
  G.traffic = [];
  for (let i = 0; i < nCars; i++) {
    const vertical = rng() < 0.5;
    const road = vertical ? ROAD_XS[Math.floor(rng() * ROAD_XS.length)] : ROAD_YS[Math.floor(rng() * ROAD_YS.length)];
    const along = rng() * (vertical ? 1900 : 2600);
    G.traffic.push({
      kind: 'car', x: vertical ? road + (rng() < 0.5 ? -22 : 22) : along,
      y: vertical ? along : road + (rng() < 0.5 ? -22 : 22),
      angle: vertical ? (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (rng() < 0.5 ? 0 : Math.PI),
      speed: 60 + rng() * 50, color: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)],
      vertical, road, w: 34, h: 18, brake: 0,
    });
  }
  G.peds = [];
  for (let i = 0; i < nPeds; i++) {
    const x = 120 + rng() * 2400;
    const y = 120 + rng() * 1700;
    G.peds.push({
      x, y, angle: rng() * Math.PI * 2, speed: 22 + rng() * 18,
      color: SHIRT_COLORS[Math.floor(rng() * SHIRT_COLORS.length)],
      panic: 0, walkPhase: rng() * 6,
    });
  }
}

function nearestRoad(value, roads) {
  let best = roads[0], bd = 1e9;
  for (const r of roads) { const d = Math.abs(r - value); if (d < bd) { bd = d; best = r; } }
  return best;
}

export function updateTraffic(G, dt) {
  const px = G.player.x, py = G.player.y;
  for (const c of G.traffic) {
    // Brake for the car ahead / the player.
    let ahead = 1e9;
    for (const o of G.traffic) {
      if (o === c) continue;
      const dx = o.x - c.x, dy = o.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d < 90 && Math.cos(Math.atan2(dy, dx) - c.angle) > 0.7) ahead = Math.min(ahead, d);
    }
    const pd = Math.hypot(px - c.x, py - c.y);
    if (pd < 70 && Math.cos(Math.atan2(py - c.y, px - c.x) - c.angle) > 0.6) ahead = Math.min(ahead, pd);
    const target = ahead < 70 ? 0 : c.speed;
    c.cur = (c.cur ?? c.speed) + (target - (c.cur ?? c.speed)) * Math.min(1, dt * 3);
    c.x += Math.cos(c.angle) * c.cur * dt;
    c.y += Math.sin(c.angle) * c.cur * dt;
    // At an intersection, sometimes turn onto the crossing road.
    const onV = Math.abs(c.x - nearestRoad(c.x, ROAD_XS)) < 6;
    const onH = Math.abs(c.y - nearestRoad(c.y, ROAD_YS)) < 6;
    if (onV && onH && Math.random() < 0.01) {
      const dirs = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
      c.angle = dirs[Math.floor(Math.random() * dirs.length)];
      c.vertical = Math.abs(Math.sin(c.angle)) > 0.5;
    }
    if (c.x < 60) { c.x = 60; c.angle = 0; }
    if (c.x > 2540) { c.x = 2540; c.angle = Math.PI; }
    if (c.y < 60) { c.y = 60; c.angle = Math.PI / 2; }
    if (c.y > 1840) { c.y = 1840; c.angle = -Math.PI / 2; }
  }
  for (const p of G.peds) {
    const d = Math.hypot(px - p.x, py - p.y);
    if (d < 120) {
      p.panic = 1;
      p.angle = Math.atan2(p.y - py, p.x - px);
    } else if (p.panic > 0) p.panic = Math.max(0, p.panic - dt * 0.5);
    if (Math.random() < 0.005) p.angle += (Math.random() - 0.5) * 2;
    const sp = p.speed * (p.panic ? 3.2 : 1);
    const nx = p.x + Math.cos(p.angle) * sp * dt;
    const ny = p.y + Math.sin(p.angle) * sp * dt;
    if (!collideBuildings(G.city, nx, ny, 8) && nx > 100 && nx < 2550 && ny > 60 && ny < 1850) {
      p.x = nx; p.y = ny;
    } else {
      p.angle += Math.PI / 2;
    }
    p.walkPhase += dt * (p.panic ? 14 : 6);
  }
}

function drawCarShape(ctx, x, y, angle, color, w, h, siren) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 5);
  ctx.fill();
  ctx.fillStyle = '#222831';
  ctx.fillRect(-w / 6, -h / 2 + 3, w / 3, h - 6);
  ctx.fillStyle = '#dfe6ee';
  ctx.fillRect(w / 4, -h / 2 + 3, 4, h - 6);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(w / 2 - 2, -h / 2 + 2, 2, 4);
  ctx.fillRect(w / 2 - 2, h / 2 - 6, 2, 4);
  if (siren) {
    ctx.fillStyle = siren === 'red' ? '#ff2d2d' : '#2d7dff';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawTraffic(ctx, G) {
  for (const c of G.traffic) drawCarShape(ctx, c.x, c.y, c.angle, c.color, c.w, c.h, null);
  for (const p of G.peds) {
    const bob = Math.sin(p.walkPhase) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 4, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y + bob * 0.3, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2d2a26';
    ctx.beginPath(); ctx.arc(p.x, p.y - 7 + bob * 0.3, 4, 0, Math.PI * 2); ctx.fill();
  }
}

export { drawCarShape };
