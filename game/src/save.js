// Sun Bay save: progress persists in localStorage — money, mission, best
// wanted level escaped. A fresh browser starts a fresh run; a returning one
// picks up where Kai left off.
const SAVE_KEY = 'sunbay-save-v1';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return {
      money: typeof data.money === 'number' ? data.money : 0,
      missionIndex: typeof data.missionIndex === 'number' ? data.missionIndex : 0,
      score: typeof data.score === 'number' ? data.score : 0,
      bestHeat: typeof data.bestHeat === 'number' ? data.bestHeat : 0,
    };
  } catch (e) {
    return null;
  }
}

export function saveGame(state) {
  try {
    const data = {
      money: state.money,
      missionIndex: state.missions.index,
      score: state.score,
      bestHeat: Math.max(state.bestHeat || 0, state.wanted),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full or blocked: the run continues without a save.
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch (e) { /* nothing to clear */ }
}
