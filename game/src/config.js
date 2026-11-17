// Sun Bay — configuration: world size, districts, palette, variant tuning.
// One engine, five variants: the VARIANT flag below selects the flavour
// (chase / story / heat / golden / sandbox) while the world stays the same.
export const WORLD_W = 2600;
export const WORLD_H = 1900;
export const ROAD = 96; // road width in world pixels
export const BLOCK = 300; // city block pitch

// Variant is chosen by ?variant=chase|story|heat|golden|sandbox (default chase).
export function variantFromUrl() {
  const v = new URLSearchParams(location.search).get('variant') || 'chase';
  return ['chase', 'story', 'heat', 'golden', 'sandbox'].includes(v) ? v : 'chase';
}

// Seeded RNG (mulberry32) so staged screenshots are deterministic.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DISTRICTS = [
  { name: 'Marina', x: 0, y: 300, w: 620, h: 900, ground: '#e8c98a', accent: '#2e86ab' },
  { name: 'Old Town', x: 620, y: 0, w: 700, h: 700, ground: '#d9b48a', accent: '#b3543f' },
  { name: 'Downtown', x: 1320, y: 300, w: 700, h: 900, ground: '#8d99ae', accent: '#f4a259' },
  { name: 'Harbor', x: 2020, y: 300, w: 580, h: 900, ground: '#7d8a96', accent: '#3f6d8e' },
  { name: 'Hillside', x: 620, y: 1200, w: 1400, h: 700, ground: '#9db98a', accent: '#5b7d4f' },
  { name: 'Sunset Beach', x: 0, y: 1200, w: 620, h: 700, ground: '#f2d492', accent: '#e07a5f' },
];

// Golden-hour palette (V4) vs daylight palette (default).
export const PALETTES = {
  day: { sky: '#a8d8e8', grass: '#7fae62', road: '#3c3f45', line: '#e8c33c', sidewalk: '#b9b3a4' },
  golden: { sky: '#f7b267', grass: '#c99a4b', road: '#4a3a3a', line: '#ffd166', sidewalk: '#c9a06a' },
};

export const TUNING = {
  chase: { policeAggression: 1.0, traffic: 14, peds: 26, missionPace: 1.0, heat: 'normal' },
  story: { policeAggression: 0.8, traffic: 12, peds: 30, missionPace: 1.0, heat: 'normal' },
  heat: { policeAggression: 1.6, traffic: 12, peds: 22, missionPace: 1.0, heat: 'escalating' },
  golden: { policeAggression: 0.7, traffic: 12, peds: 30, missionPace: 1.0, heat: 'calm' },
  sandbox: { policeAggression: 0.9, traffic: 16, peds: 30, missionPace: 1.2, heat: 'normal' },
};
