// Marisol — saving: mission progress, money, position and owned items in
// localStorage. Autosaves after every mission; S saves on demand.

const KEY = 'marisol-neon-tide-save-v1';

export function saveGame(S) {
  try {
    const data = {
      missionIdx: S.missions.idx,
      money: S.player.money,
      x: S.player.x, y: S.player.y,
      owned: S.econ.owned,
      packages: S.activities.stats.packages,
      fares: S.activities.stats.fares,
      races: S.activities.stats.races,
      weapon: S.player.weapon,
      clock: S.clock.minutes,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (err) { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data.money !== 'number' || typeof data.missionIdx !== 'number') return null;
    return data;
  } catch (err) { return null; }
}

export function applySave(S, data) {
  S.missions.idx = data.missionIdx;
  S.player.money = data.money;
  S.player.x = data.x; S.player.y = data.y;
  S.econ.owned = data.owned || {};
  S.activities.stats.packages = data.packages || 0;
  S.activities.stats.fares = data.fares || 0;
  S.activities.stats.races = data.races || 0;
  if (data.weapon) S.player.weapon = data.weapon;
  if (typeof data.clock === 'number') S.clock.minutes = data.clock;
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (err) { return false; }
}
