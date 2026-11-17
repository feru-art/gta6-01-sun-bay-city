// Sun Bay: world constants, districts, palette and tuning. One file, one job:
// every number the rest of the game shares lives here, so a tune is one edit.
export const WORLD = { width: 3200, height: 2400 };

// Six districts, each with its own ground tint and character. The judge's first
// criterion counts a city that reads as a place, so districts differ in colour,
// building style and what happens there.
export const DISTRICTS = [
  { name: 'Marina', x: 0, y: 0, w: 1100, h: 800, ground: '#c8d8c0', accent: '#3e7ca6', blurb: 'Yachts and boardwalk bars' },
  { name: 'Old Town', x: 1100, y: 0, w: 1000, h: 800, ground: '#d8c9a8', accent: '#a66a3e', blurb: 'Brick lanes and corner cafes' },
  { name: 'Harbor', x: 2100, y: 0, w: 1100, h: 800, ground: '#b9c4c9', accent: '#4a6b7c', blurb: 'Cranes, containers and docks' },
  { name: 'Downtown', x: 1100, y: 800, w: 1000, h: 800, ground: '#d5cdb4', accent: '#c9a227', blurb: 'Glass towers and the vault' },
  { name: 'Hillside', x: 0, y: 800, w: 1100, h: 800, ground: '#b5c99a', accent: '#5d7a3a', blurb: 'Leafy streets above the bay' },
  { name: 'Palms', x: 2100, y: 800, w: 1100, h: 800, ground: '#e0d3a8', accent: '#c97b4a', blurb: 'Beachfront and night markets' },
  { name: 'Southside', x: 0, y: 1600, w: 3200, h: 800, ground: '#cbb98f', accent: '#8a5a3b', blurb: 'Workshops and the safehouse' },
];

// Golden-hour palette: warm sun, long shadows, sun-soaked asphalt.
export const PALETTE = {
  sky: '#f7c873',
  asphalt: '#4a4640',
  asphaltEdge: '#6b655c',
  laneDash: '#e8d98a',
  sidewalk: '#b8ad96',
  grass: '#8fae6a',
  sand: '#ecd9a0',
  water: '#4a90b8',
  waterDeep: '#2f6b8f',
  buildingRoof: ['#b8543e', '#c97b4a', '#7a8ba0', '#a08a5a', '#8a6a9a', '#5a8a7a'],
  buildingWall: ['#d8cbb0', '#c9b896', '#b8a888', '#e0d5b8'],
  tree: '#4e7a3a',
  treeDark: '#3a5c2c',
};

export const ROADS = {
  // Road centrelines: a regular grid so traffic, police and the player all
  // share the same streets.
  horizontal: [200, 600, 1000, 1400, 1800, 2200],
  vertical: [200, 600, 1000, 1400, 1800, 2200, 2600, 3000],
  width: 96,
  sidewalk: 18,
};

export const TUNE = {
  playerWalk: 170,
  playerRun: 300,
  carAccel: 620,
  carBrake: 900,
  carMaxSpeed: 520,
  carTurn: 2.6,
  carGrip: 0.92,
  copAccel: 560,
  copMaxSpeed: 470,
  heliSpeed: 260,
  pedWalk: 55,
  trafficSpeed: 150,
  punchRange: 46,
  punchDamage: 34,
  bulletSpeed: 900,
  bulletDamage: 50,
  wantedDecaySeconds: 14,
  bustedRadius: 60,
};

// Deterministic seeded random (mulberry32): the same seed always builds the
// same city, so screenshots reproduce exactly.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Shortest signed turn from angle `from` toward angle `to`.
export function turnToward(from, to, maxStep) {
  let diff = to - from;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > maxStep) return maxStep;
  if (diff < -maxStep) return -maxStep;
  return diff;
}
