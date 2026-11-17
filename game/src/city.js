// Marisol — the city itself: blocks, buildings, trees, lamps, and the
// helpers every system uses to ask where the roads and districts are.

import { WORLD_W, WORLD_H, ROAD_X, ROAD_Y, ROAD_W, DISTRICTS, HARBOR,
  PALETTE, mulberry32 } from './config.js';

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[0];
}

export function onRoad(x, y) {
  for (const rx of ROAD_X) if (Math.abs(x - rx) <= ROAD_W / 2) return true;
  for (const ry of ROAD_Y) if (Math.abs(y - ry) <= ROAD_W / 2) return true;
  return false;
}

// Nearest point on a road centreline, plus that road's direction.
export function nearestRoad(x, y) {
  let best = null;
  for (const rx of ROAD_X) {
    const d = Math.abs(x - rx);
    if (!best || d < best.d) best = { d, x: rx, y, vertical: true };
  }
  for (const ry of ROAD_Y) {
    const d = Math.abs(y - ry);
    if (!best || d < best.d) best = { d, x, y: ry, vertical: false };
  }
  return best;
}

function blockRects() {
  const xs = [0, ...ROAD_X, WORLD_W];
  const ys = [0, ...ROAD_Y, WORLD_H];
  const blocks = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i] + (i === 0 ? 0 : ROAD_W / 2) + 14;
      const x1 = xs[i + 1] - (i + 1 === xs.length - 1 ? 0 : ROAD_W / 2) - 14;
      const y0 = ys[j] + (j === 0 ? 0 : ROAD_W / 2) + 14;
      const y1 = ys[j + 1] - (j + 1 === ys.length - 1 ? 0 : ROAD_W / 2) - 14;
      if (x1 - x0 > 90 && y1 - y0 > 90 && x0 < HARBOR.x - 20) {
        blocks.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      }
    }
  }
  return blocks;
}

export function buildCity() {
  const rng = mulberry32(20261118);
  const buildings = [];
  const trees = [];
  const lamps = [];
  for (const b of blockRects()) {
    const n = 1 + Math.floor(rng() * 2);
    for (let k = 0; k < n; k++) {
      const w = 90 + rng() * Math.min(220, b.w - 110);
      const h = 80 + rng() * Math.min(180, b.h - 100);
      const x = b.x + 8 + rng() * Math.max(1, b.w - w - 16);
      const y = b.y + 8 + rng() * Math.max(1, b.h - h - 16);
      const roof = PALETTE.buildingRoof[Math.floor(rng() * PALETTE.buildingRoof.length)];
      buildings.push({ x, y, w, h, roof, tall: rng() > 0.72 });
    }
    const nt = 2 + Math.floor(rng() * 4);
    for (let k = 0; k < nt; k++) {
      trees.push({ x: b.x + rng() * b.w, y: b.y + rng() * b.h, r: 9 + rng() * 8 });
    }
  }
  for (const rx of ROAD_X) for (let y = 200; y < WORLD_H; y += 420) {
    lamps.push({ x: rx + ROAD_W / 2 + 8, y });
  }
  // Fixed points of interest: shops, contacts, race start, taxi rank.
  const pois = {
    gunShop: { x: 1300, y: 700, label: 'AMMU-NATION' },
    carDealer: { x: 2500, y: 1750, label: 'VELOCE MOTORS' },
    safehouse: { x: 3700, y: 2800, label: 'SAFEHOUSE' },
    mira: { x: 3100, y: 620, label: 'Mira' },
    tbone: { x: 700, y: 2300, label: 'T-Bone' },
    sofia: { x: 2000, y: 2900, label: 'Sofia' },
    eddie: { x: 4200, y: 1700, label: 'Eddie' },
    raceStart: { x: 1000, y: 2000, label: 'RACE' },
    taxiRank: { x: 1600, y: 900, label: 'TAXI' },
  };
  return { buildings, trees, lamps, pois };
}

export function drawCity(ctx, city, cam, view) {
  const { x0, y0, x1, y1 } = view;
  // Ground.
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // Harbour water.
  ctx.fillStyle = PALETTE.water;
  ctx.fillRect(HARBOR.x, Math.max(0, y0), HARBOR.w, Math.min(WORLD_H, y1) - Math.max(0, y0));
  ctx.fillStyle = PALETTE.waterDeep;
  for (let y = 60; y < WORLD_H; y += 240) {
    ctx.fillRect(HARBOR.x + 30, y, 190, 5);
  }
  // Sand strip beside the harbour.
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(HARBOR.x - 26, Math.max(0, y0), 26, Math.min(WORLD_H, y1) - Math.max(0, y0));
  // Sidewalks: light border around each block.
  ctx.fillStyle = PALETTE.sidewalk;
  for (const b of blockRects()) {
    if (b.x + b.w < x0 || b.x > x1 || b.y + b.h < y0 || b.y > y1) continue;
    ctx.fillRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20);
  }
  // Roads.
  ctx.fillStyle = PALETTE.asphalt;
  for (const rx of ROAD_X) ctx.fillRect(rx - ROAD_W / 2, Math.max(0, y0), ROAD_W, Math.min(WORLD_H, y1) - Math.max(0, y0));
  for (const ry of ROAD_Y) ctx.fillRect(Math.max(0, x0), ry - ROAD_W / 2, Math.min(WORLD_W, x1) - Math.max(0, x0), ROAD_W);
  // Lane dashes.
  ctx.fillStyle = PALETTE.lane;
  for (const rx of ROAD_X) {
    for (let y = 40; y < WORLD_H; y += 80) ctx.fillRect(rx - 3, y, 6, 38);
  }
  for (const ry of ROAD_Y) {
    for (let x = 40; x < WORLD_W; x += 80) ctx.fillRect(x, ry - 3, 38, 6);
  }
  // Buildings with a drop shadow and rooftop detail.
  for (const b of city.buildings) {
    if (b.x + b.w < x0 || b.x > x1 || b.y + b.h < y0 || b.y > y1) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);
    ctx.fillStyle = b.roof;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, 10);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(b.x + b.w / 2 - 14, b.y + b.h / 2 - 10, 28, 20);
    if (b.tall) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x + b.w - 22, b.y + 6, 12, 12);
    }
  }
  // Trees.
  for (const t of city.trees) {
    if (t.x < x0 || t.x > x1 || t.y < y0 || t.y > y1) continue;
    ctx.fillStyle = '#2f6b2f';
    ctx.beginPath(); ctx.arc(t.x + 3, t.y + 4, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8a3f';
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
  }
  // Lamps.
  ctx.fillStyle = '#5a5a66';
  for (const l of city.lamps) {
    if (l.x < x0 || l.x > x1 || l.y < y0 || l.y > y1) continue;
    ctx.fillRect(l.x - 2, l.y - 2, 4, 4);
  }
}
