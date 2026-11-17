// Sun Bay — procedural sound: a WebAudio siren, engine hum, gunshot and
// coin chime. No audio files, no network; everything is synthesized.
export function createAudio() {
  return { ctx: null, muted: false, sirenNodes: null, engineNodes: null };
}

export function initAudio(G) {
  if (G.audio.ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    G.audio.ctx = new AC();
  } catch (e) { /* headless or blocked: stay silent */ }
}

function tone(G, freq, dur, type, vol) {
  if (!G.audio.ctx || G.audio.muted) return;
  try {
    const ctx = G.audio.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) { /* ignore */ }
}

export function playSiren(G, on) {
  if (!G.audio.ctx || G.audio.muted) return;
  try {
    if (on && !G.audio.sirenNodes) {
      const ctx = G.audio.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 700;
      g.gain.value = 0.02;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.6;
      const lg = ctx.createGain();
      lg.gain.value = 220;
      lfo.connect(lg); lg.connect(o.frequency);
      o.connect(g); g.connect(ctx.destination);
      o.start(); lfo.start();
      G.audio.sirenNodes = { o, g, lfo };
    } else if (!on && G.audio.sirenNodes) {
      G.audio.sirenNodes.o.stop();
      G.audio.sirenNodes.lfo.stop();
      G.audio.sirenNodes = null;
    }
  } catch (e) { /* ignore */ }
}

export function playShot(G) { tone(G, 180, 0.12, 'square', 0.12); tone(G, 90, 0.18, 'sawtooth', 0.08); }
export function playCoin(G) { tone(G, 880, 0.12, 'sine', 0.1); tone(G, 1320, 0.2, 'sine', 0.08); }
export function playBump(G) { tone(G, 70, 0.15, 'sawtooth', 0.12); }
export function playMissionDone(G) { tone(G, 523, 0.15, 'sine', 0.1); tone(G, 659, 0.15, 'sine', 0.1); tone(G, 784, 0.3, 'sine', 0.1); }

export function updateAudio(G) {
  if (!G.audio.ctx) return;
  playSiren(G, G.wanted > 0 && !G.muted);
  // Engine hum follows the car speed.
  try {
    if (!G.player.onFoot && G.playerCar) {
      if (!G.audio.engineNodes) {
        const ctx = G.audio.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 60;
        g.gain.value = 0.015;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        G.audio.engineNodes = { o, g };
      }
      G.audio.engineNodes.o.frequency.value = 50 + Math.abs(G.playerCar.speed) * 0.5;
    } else if (G.audio.engineNodes) {
      G.audio.engineNodes.o.stop();
      G.audio.engineNodes = null;
    }
  } catch (e) { /* ignore */ }
}
