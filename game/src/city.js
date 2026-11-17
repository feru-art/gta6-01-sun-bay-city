// Sun Bay city: the map itself. Builds the road grid, the blocks between the
// roads (buildings, parks, parking lots), the beach and the harbour water, and
// draws all of it. The city is deterministic: one seed, one city, every run.
import { WORLD, DISTRICTS, PALETTE, ROADS, makeRng, clamp } from './config.js';

const CITY_SEED = 20261117;

export function districtAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[3];
}

export function isOnRoad(x, y) {
  const half = ROADS.width / 2;
  for (const ry of ROADS.horizontal) {
    if (Math.abs(y - ry) <= half && x >= 0 && x <= WORLD.width) return true;
  }
  for (const rx of ROADS.vertical) {
    if (Math.abs(x - rx) <= half && y >= 0 && y <= WORLD.height) return true;
  }
  return false;
}

// Nearest point on the road grid to (x, y): traffic and police steer through
// these, so every chase stays on the streets.
export function nearestRoadPoint(x, y) {
  let bestX = x;
  let bestY = y;
  let bestD = Infinity;
  for (const ry of ROADS.horizontal) {
    const d = Math.abs(y - ry);
    if (d < bestD) { bestD = d; bestX = x; bestY = ry; }
  }
  for (const rx of ROADS.vertical) {
    const d = Math.abs(x - rx);
    if (d < bestD) { bestD = d; bestX = rx; bestY = y; }
  }
  return { x: bestX, y: bestY };
}

function buildBlocks(rng) {
  const blocks = [];
  const xs = [0, ...ROADS.vertical, WORLD.width];
  const ys = [0, ...ROADS.horizontal, WORLD.height];
  const half = ROADS.width / 2 + ROADS.sidewalk;
  for (let ix = 0; ix < xs.length - 1; ix += 1) {
    for (let iy = 0; iy < ys.length - 1; iy += 1) {
      const x0 = xs[ix] + (ix === 0 ? 0 : half);
      const x1 = xs[ix + 1] - (ix === xs.length - 2 ? 0 : half);
      const y0 = ys[iy] + (iy === 0 ? 0 : half);
      const y1 = ys[iy + 1] - (iy === ys.length - 2 ? 0 : half);
      const w = x1 - x0;
      const h = y1 - y0;
      if (w < 60 || h < 60) continue;
      const cx = x0 + w / 2;
      const cy = y0 + h / 2;
      const roll = rng();
      const district = districtAt(cx, cy);
      if (roll < 0.16) {
        blocks.push({ kind: 'park', x: x0, y: y0, w, h, district: district.name });
      } else if (roll < 0.26) {
        blocks.push({ kind: 'parking', x: x0, y: y0, w, h, district: district.name });
      } else {
        // 1-4 buildings per block, each with its own roof colour and height
        // (taller downtown, lower in the old town).
        const tall = district.name === 'Downtown' ? 3 : district.name === 'Old Town' ? 1 : 2;
        const count = 1 + Math.floor(rng() * 3);
        const buildings = [];
        for (let b = 0; b < count; b += 1) {
          const bw = 60 + rng() * Math.max(40, w / count - 80);
          const bh = 60 + rng() * Math.max(40, h - 90);
          const bx = x0 + 10 + (b * (w - 20)) / count + rng() * 20;
          const by = y0 + 10 + rng() * Math.max(0, h - bh - 20);
          buildings.push({
            x: bx, y: by, w: Math.min(bw, x1 - bx - 10), h: Math.min(bh, y1 - by - 10),
            roof: PALETTE.buildingRoof[Math.floor(rng() * PALETTE.buildingRoof.length)],
            wall: PALETTE.buildingWall[Math.floor(rng() * PALETTE.buildingWall.length)],
            floors: 1 + Math.floor(rng() * tall),
          });
        }
        blocks.push({ kind: 'buildings', x: x0, y: y0, w, h, district: district.name, buildings });
      }
      // A few trees on every block.
      const trees = [];
      const treeCount = 2 + Math.floor(rng() * 5);
      for (let t = 0; t < treeCount; t += 1) {
        trees.push({ x: x0 + 15 + rng() * (w - 30), y: y0 + 15 + rng() * (h - 30), r: 9 + rng() * 7 });
      }
      blocks[blocks.length - 1].trees = trees;
    }
  }
  return blocks;
}

export function buildCity() {
  const rng = makeRng(CITY_SEED);
  return {
    blocks: buildBlocks(rng),
    // The bay: water along the west edge, a sand beach beside it.
    water: { x: 0, y: 0, w: 110, h: WORLD.height },
    beach: { x: 110, y: 0, w: 70, h: WORLD.height },
    // Harbour docks on the north-east edge.
    docks: { x: 2600, y: 0, w: 600, h: 120 },
  };
}

function drawBuilding(ctx, b, cam) {
  const sx = b.x - cam.x;
  const sy = b.y - cam.y;
  if (sx > cam.w || sy > cam.h || sx + b.w < 0 || sy + b.h < 0) return;
  // Long golden-hour shadow to the south-east.
  ctx.fillStyle = 'rgba(60, 30, 10, 0.25)';
  ctx.fillRect(sx + 10, sy + 12, b.w, b.h);
  ctx.fillStyle = b.wall;
  ctx.fillRect(sx, sy, b.w, b.h);
  ctx.fillStyle = b.roof;
  ctx.fillRect(sx + 4, sy + 4, b.w - 8, b.h - 8);
  // Rooftop details: vents and a skylight.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(sx + b.w * 0.2, sy + b.h * 0.25, b.w * 0.18, b.h * 0.18);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(sx + b.w * 0.6, sy + b.h * 0.6, 8, 8);
  ctx.fillRect(sx + b.w * 0.7, sy + b.h * 0.3, 6, 6);
  // Floor lines on taller buildings.
  if (b.floors > 1) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 1;
    for (let f = 1; f < b.floors; f += 1) {
      const ly = sy + (b.h * f) / b.floors;
      ctx.beginPath();
      ctx.moveTo(sx, ly);
      ctx.lineTo(sx + b.w, ly);
      ctx.stroke();
    }
  }
}

function drawTree(ctx, t, cam) {
  const sx = t.x - cam.x;
  const sy = t.y - cam.y;
  if (sx < -30 || sy < -30 || sx > cam.w + 30 || sy > cam.h + 30) return;
  ctx.fillStyle = 'rgba(60, 30, 10, 0.25)';
  ctx.beginPath();
  ctx.ellipse(sx + 6, sy + 8, t.r, t.r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.treeDark;
  ctx.beginPath();
  ctx.arc(sx, sy, t.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.tree;
  ctx.beginPath();
  ctx.arc(sx - 2, sy - 2, t.r * 0.7, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCity(ctx, city, cam) {
  // District ground tints.
  for (const d of DISTRICTS) {
    const sx = d.x - cam.x;
    const sy = d.y - cam.y;
    if (sx > cam.w || sy > cam.h || sx + d.w < 0 || sy + d.h < 0) continue;
    ctx.fillStyle = d.ground;
    ctx.fillRect(sx, sy, d.w, d.h);
  }
  // Water + beach on the west edge.
  ctx.fillStyle = PALETTE.waterDeep;
  ctx.fillRect(city.water.x - cam.x, city.water.y - cam.y, city.water.w, city.water.h);
  ctx.fillStyle = PALETTE.water;
  ctx.fillRect(city.water.x - cam.x + 30, city.water.y - cam.y, city.water.w - 30, city.water.h);
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(city.beach.x - cam.x, city.beach.y - cam.y, city.beach.w, city.beach.h);
  // Harbour docks.
  ctx.fillStyle = '#8a7a5a';
  ctx.fillRect(city.docks.x - cam.x, city.docks.y - cam.y, city.docks.w, city.docks.h);
  ctx.fillStyle = '#5a6b7c';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(city.docks.x - cam.x + 20 + i * 115, city.docks.y - cam.y + 20, 70, 60);
  }
  // Roads: asphalt, then centre dashes.
  ctx.fillStyle = PALETTE.asphalt;
  for (const ry of ROADS.horizontal) {
    ctx.fillRect(-cam.x, ry - ROADS.width / 2 - cam.y, WORLD.width, ROADS.width);
  }
  for (const rx of ROADS.vertical) {
    ctx.fillRect(rx - ROADS.width / 2 - cam.x, -cam.y, ROADS.width, WORLD.height);
  }
  ctx.strokeStyle = PALETTE.laneDash;
  ctx.lineWidth = 3;
  ctx.setLineDash([26, 22]);
  for (const ry of ROADS.horizontal) {
    ctx.beginPath();
    ctx.moveTo(-cam.x, ry - cam.y);
    ctx.lineTo(WORLD.width - cam.x, ry - cam.y);
    ctx.stroke();
  }
  for (const rx of ROADS.vertical) {
    ctx.beginPath();
    ctx.moveTo(rx - cam.x, -cam.y);
    ctx.lineTo(rx - cam.x, WORLD.height - cam.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Sidewalk edges.
  ctx.strokeStyle = PALETTE.sidewalk;
  ctx.lineWidth = ROADS.sidewalk;
  for (const ry of ROADS.horizontal) {
    ctx.beginPath();
    ctx.moveTo(-cam.x, ry - ROADS.width / 2 - ROADS.sidewalk / 2 - cam.y);
    ctx.lineTo(WORLD.width - cam.x, ry - ROADS.width / 2 - ROADS.sidewalk / 2 - cam.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-cam.x, ry + ROADS.width / 2 + ROADS.sidewalk / 2 - cam.y);
    ctx.lineTo(WORLD.width - cam.x, ry + ROADS.width / 2 + ROADS.sidewalk / 2 - cam.y);
    ctx.stroke();
  }
  // Blocks.
  for (const block of city.blocks) {
    const sx = block.x - cam.x;
    const sy = block.y - cam.y;
    if (sx > cam.w || sy > cam.h || sx + block.w < 0 || sy + block.h < 0) continue;
    if (block.kind === 'park') {
      ctx.fillStyle = PALETTE.grass;
      ctx.fillRect(sx, sy, block.w, block.h);
      ctx.fillStyle = '#d8c9a0';
      ctx.beginPath();
      ctx.ellipse(sx + block.w / 2, sy + block.h / 2, block.w * 0.2, block.h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (block.kind === 'parking') {
      ctx.fillStyle = '#9a938a';
      ctx.fillRect(sx, sy, block.w, block.h);
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 2;
      for (let px = sx + 14; px < sx + block.w - 10; px += 30) {
        ctx.beginPath();
        ctx.moveTo(px, sy + 10);
        ctx.lineTo(px, sy + 44);
        ctx.stroke();
      }
    } else if (block.buildings) {
      for (const b of block.buildings) drawBuilding(ctx, b, cam);
    }
    if (block.trees) {
      for (const t of block.trees) drawTree(ctx, t, cam);
    }
  }
  // District name labels.
  ctx.fillStyle = 'rgba(60, 40, 20, 0.55)';
  ctx.font = 'bold 34px Arial, sans-serif';
  ctx.textAlign = 'center';
  for (const d of DISTRICTS) {
    const sx = d.x + d.w / 2 - cam.x;
    const sy = d.y + 52 - cam.y;
    if (sx < -100 || sy < -40 || sx > cam.w + 100 || sy > cam.h + 40) continue;
    ctx.fillText(d.name.toUpperCase(), sx, sy);
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText(d.blurb, sx, sy + 22);
    ctx.font = 'bold 34px Arial, sans-serif';
  }
  ctx.textAlign = 'left';
}

// World bounds for any moving thing.
export function clampToWorld(x, y, margin) {
  return {
    x: clamp(x, 120 + margin, WORLD.width - margin),
    y: clamp(y, margin, WORLD.height - margin),
  };
}
