// Sun Bay — save/load: cash, mission progress, health and position persist
// in localStorage so a session survives a reload.
const KEY = 'sunbay-save-v1';

export function saveGame(G) {
  try {
    const data = {
      cash: G.cash, score: G.score, missionIndex: G.missionIndex,
      hasGun: G.hasGun, x: G.player.x, y: G.player.y,
      health: G.player.health, variant: G.variant,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) { /* storage unavailable: play on without saving */ }
}

export function loadGame(G) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (typeof d.cash !== 'number') return false;
    G.cash = d.cash; G.score = d.score || 0;
    G.missionIndex = d.missionIndex || 0;
    G.hasGun = !!d.hasGun;
    G.player.x = d.x || G.player.x;
    G.player.y = d.y || G.player.y;
    G.player.health = d.health || 100;
    return true;
  } catch (e) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}
