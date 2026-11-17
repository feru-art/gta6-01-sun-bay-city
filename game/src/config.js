// Marisol — world constants, districts, palette and tuning. One job: the
// numbers every other module shares, so the city stays coherent.

export const WORLD_W = 4800;
export const WORLD_H = 3600;

// Road centrelines (px) and width. A regular grid, so the city reads as a
// real street plan from the vista shot.
export const ROAD_X = [400, 1000, 1600, 2200, 2800, 3400, 4000, 4400];
export const ROAD_Y = [350, 900, 1450, 2000, 2550, 3100];
export const ROAD_W = 96;

// Six districts, each with its own flavour line for the HUD.
export const DISTRICTS = [
  { name: 'Old Town', x: 0, y: 0, w: 1600, h: 1450, blurb: 'Cobblestones and cafés' },
  { name: 'Northgate', x: 1600, y: 0, w: 1200, h: 1450, blurb: 'Glass towers and banks' },
  { name: 'Harborfront', x: 2800, y: 0, w: 2000, h: 1450, blurb: 'Yachts, cranes and salt air' },
  { name: 'Las Colinas', x: 0, y: 1450, w: 1600, h: 2150, blurb: 'Hillside villas and palms' },
  { name: 'The Strip', x: 1600, y: 1450, w: 1800, h: 2150, blurb: 'Neon clubs and casinos' },
  { name: 'Dockside', x: 3400, y: 1450, w: 1400, h: 2150, blurb: 'Warehouses and container yards' },
];

// The harbour water on the east edge.
export const HARBOR = { x: 4520, y: 0, w: 280, h: 3600 };

export const PALETTE = {
  grass: '#7fae5a', grassDark: '#6f9c4e', sand: '#e8d9a0',
  water: '#2b6ea3', waterDeep: '#1d4f78',
  asphalt: '#3a3a40', asphaltEdge: '#2e2e33', lane: '#e8d44d',
  sidewalk: '#b9b3a4', buildingRoof: ['#c96f4a', '#7d9cc4', '#b8a05a', '#8fb08a', '#a97fb0', '#d08a8a'],
  wall: '#8f887a',
};

export const TUNING = {
  walkSpeed: 165, runSpeed: 265,
  carAccel: 620, carBrake: 900, carMax: 560, carReverse: 220,
  copAccel: 700, copMax: 620, heliSpeed: 300,
  pedSpeed: 55, trafficSpeed: 150,
  shotDamage: 34, punchDamage: 12, playerHp: 100,
};

// Small deterministic RNG so the city layout is identical every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
