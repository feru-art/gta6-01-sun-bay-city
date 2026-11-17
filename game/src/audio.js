// Marisol — procedural sound: a WebAudio engine hum, sirens, gunshots,
// pickups and a bassline loop. No audio files — every sound is synthesized,
// so the game stays offline and light.

export function makeAudio() {
  return {
    ctx: null, muted: false, engineOsc: null, engineGain: null,
    musicTimer: 0, musicStep: 0, sirenOsc: null, sirenGain: null,
  };
}

// The AudioContext is created only after a real keypress, so the browser
// never logs an autoplay warning.
export function unlockAudio(a) {
  if (a.ctx) return;
  try {
    a.ctx = new (window.AudioContext || window.webkitAudioContext)();
    a.engineOsc = a.ctx.createOscillator();
    a.engineOsc.type = 'sawtooth';
    a.engineOsc.frequency.value = 55;
    a.engineGain = a.ctx.createGain();
    a.engineGain.gain.value = 0;
    a.engineOsc.connect(a.engineGain).connect(a.ctx.destination);
    a.engineOsc.start();
    a.sirenOsc = a.ctx.createOscillator();
    a.sirenOsc.type = 'triangle';
    a.sirenOsc.frequency.value = 750;
    a.sirenGain = a.ctx.createGain();
    a.sirenGain.gain.value = 0;
    a.sirenOsc.connect(a.sirenGain).connect(a.ctx.destination);
    a.sirenOsc.start();
  } catch (err) { /* audio unavailable — the game plays on silently */ }
}

function blip(a, freq, dur, type, vol) {
  if (!a.ctx || a.muted) return;
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol || 0.15, a.ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, a.ctx.currentTime + dur);
  o.connect(g).connect(a.ctx.destination);
  o.start();
  o.stop(a.ctx.currentTime + dur);
}

export function playShot(a) { blip(a, 180, 0.12, 'square', 0.2); }
export function playPickup(a) { blip(a, 880, 0.12, 'sine', 0.18); blip(a, 1320, 0.16, 'sine', 0.12); }
export function playCash(a) { blip(a, 660, 0.1, 'sine', 0.15); blip(a, 990, 0.18, 'sine', 0.15); }
export function playHonk(a) { blip(a, 370, 0.25, 'square', 0.12); }
export function playWasted(a) { blip(a, 220, 0.7, 'sawtooth', 0.2); blip(a, 165, 0.9, 'sawtooth', 0.2); }

export function updateAudio(a, speed, wanted, dt) {
  if (!a.ctx) return;
  if (a.engineGain) {
    const target = a.muted ? 0 : Math.min(0.09, 0.02 + Math.abs(speed) / 560 * 0.07);
    a.engineGain.gain.value += (target - a.engineGain.gain.value) * Math.min(1, dt * 6);
    a.engineOsc.frequency.value = 45 + Math.abs(speed) * 0.22;
  }
  if (a.sirenGain) {
    const target = a.muted || wanted === 0 ? 0 : 0.05;
    a.sirenGain.gain.value += (target - a.sirenGain.gain.value) * Math.min(1, dt * 3);
    a.sirenOsc.frequency.value = 700 + Math.sin(performance.now() / 240) * 180;
  }
  // A slow bassline: one note every 0.42 s, cycling a minor groove.
  if (!a.muted) {
    a.musicTimer += dt;
    if (a.musicTimer > 0.42) {
      a.musicTimer = 0;
      const scale = [110, 110, 130.8, 98, 110, 146.8, 130.8, 98];
      blip(a, scale[a.musicStep % scale.length], 0.38, 'triangle', 0.05);
      a.musicStep += 1;
    }
  }
}
