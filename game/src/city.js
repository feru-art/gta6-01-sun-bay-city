// Sun Bay — the city: road grid, buildings, districts, parks and beach.
// Roads run on a 300px grid; buildings fill the blocks between them.
import { WORLD_W, WORLD_H, ROAD, DISTRICTS, makeRng } from './config.js';

export const ROAD_XS = [150, 450, 750, 1050, 1350, 1650, 1950, 2250, 2500];
export const ROAD_YS = [150, 450, 750, 1050, 1350, 1650];

const ROOF_COLORS = ['#c96f4a', '#8a6f4d', '#5d7a8c', '#a8574e', '#6d8a5f', '#b08954', '#7a6a8a', '#4e7a6d'];

export function buildCity(seed) {
  const rng = makeRng(seed);
  const buildings = [];
  for (let bx = 0; bx < 8; bx++) {
    for (let by = 0; by < 5; by++) {
      const x0 = ROAD_XS[bx] + ROAD / 2 + 14;
      const x1 = ROAD_XS[bx + 1] - ROAD / 2 - 14;
      const y0 = ROAD_YS[by] + ROAD / 2 + 14;
      const y1 = ROAD_YS[by + 1] - ROAD / 2 - 14;
      // Park in a few blocks, buildings in the rest.
      if ((bx === 2 && by === 2) || (bx === 5 && by === 3) || (bx === 6 && by === 1)) continue;
      const n = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const w = 60 + rng() * 70;
        const h = 60 + rng() * 70;
        const x = x0 + rng() * Math.max(1, x1 - x0 - w);
        const y = y0 + rng() * Math.max(1, y1 - y0 - h);
        const district = DISTRICTS.find(d => x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h);
        buildings.push({
          x, y, w, h,
          color: ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)],
          tall: district && district.name === 'Downtown' ? 1 : 0,
          district: district ? district.name : 'Sun Bay',
        });
      }
    }
  }
  const parks = [
    { x: ROAD_XS[2] + ROAD / 2, y: ROAD_YS[2] + ROAD / 2, w: 200, h: 200, name: 'Palm Court Park' },
    { x: ROAD_XS[5] + ROAD / 2, y: ROAD_YS[3] + ROAD / 2, w: 200, h: 200, name: 'Hibiscus Green' },
    { x: ROAD_XS[6] + ROAD / 2, y: ROAD_YS[1] + ROAD / 2, w: 200, h: 200, name: 'Harbor View Park' },
  ];
  return { buildings, parks, beach: { x: 0, y: 0, w: 90, h: WORLD_H } };
}

export function districtAt(x, y) {
  const d = DISTRICTS.find(d => x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h);
  return d ? d.name : 'Sun Bay';
}

export function collideBuildings(city, x, y, r) {
  for (const b of city.buildings) {
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
  }
  return null;
}

export function drawCity(ctx, G, cam) {
  const pal = G.palette;
  const { x: vx, y: vy, w: vw, h: vh } = cam;
  ctx.fillStyle = pal.grass;
  ctx.fillRect(vx, vy, vw, vh);
  // District ground tints.
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.ground;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.globalAlpha = 1;
  }
  // Ocean + sand on the west edge.
  ctx.fillStyle = '#2e86ab';
  ctx.fillRect(0, 0, 46, WORLD_H);
  ctx.fillStyle = '#f2d492';
  ctx.fillRect(46, 0, 54, WORLD_H);
  // Parks.
  for (const p of G.city.parks) {
    ctx.fillStyle = '#5d8a4a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#3f6d3a';
    for (let i = 0; i < 8; i++) {
      const tx = p.x + 20 + ((i * 53) % (p.w - 40));
      const ty = p.y + 20 + ((i * 37) % (p.h - 40));
      ctx.beginPath(); ctx.arc(tx, ty, 12, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Roads.
  ctx.fillStyle = pal.road;
  for (const x of ROAD_XS) ctx.fillRect(x - ROAD / 2, 0, ROAD, WORLD_H);
  for (const y of ROAD_YS) ctx.fillRect(0, y - ROAD / 2, WORLD_W, ROAD);
  // Centre dashes.
  ctx.fillStyle = pal.line;
  for (const x of ROAD_XS) {
    for (let y = 0; y < WORLD_H; y += 48) ctx.fillRect(x - 2, y, 4, 24);
  }
  for (const y of ROAD_YS) {
    for (let x = 0; x < WORLD_W; x += 48) ctx.fillRect(x, y - 2, 24, 4);
  }
  // Buildings with long golden-hour shadows.
  for (const b of G.city.buildings) {
    if (b.x > vx + vw + 80 || b.x + b.w < vx - 80 || b.y > vy + vh + 80 || b.y + b.h < vy - 80) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(b.x + 14, b.y + 18, b.w, b.h);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(b.x, b.y, b.w, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    const cols = Math.max(1, Math.floor(b.w / 26));
    const rows = Math.max(1, Math.floor(b.h / 26));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      ctx.fillRect(b.x + 8 + i * 26, b.y + 12 + j * 26, 10, 12);
    }
    if (b.tall) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x + b.w - 14, b.y, 6, b.h);
    }
  }
  // District labels (only when the label point is inside the viewport).
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  for (const d of DISTRICTS) {
    const lx = d.x + d.w / 2, ly = d.y + 34;
    if (lx < vx + 120 || lx > vx + vw - 120 || ly < vy + 20 || ly > vy + vh - 20) continue;
    ctx.fillText(d.name.toUpperCase(), lx, ly);
  }
  ctx.textAlign = 'left';
}
