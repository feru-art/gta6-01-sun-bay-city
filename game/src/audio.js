// Sun Bay audio: every sound is synthesized with WebAudio — no audio files.
// Sirens sweep, the engine hums with speed, gunshots crack, pickups chime.
// The context starts on the first key press (browsers demand a gesture).
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    sirenNodes: null,
    engineNodes: null,
    started: false,
    unlocked: false,
  };

  function ensure() {
    // Never create the context before a real user gesture: browsers log an
    // autoplay warning for every context made without one.
    if (!audio.unlocked) return false;
    if (audio.started) return !!audio.ctx;
    audio.started = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      audio.ctx = new AC();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.35;
      audio.master.connect(audio.ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure() || audio.muted) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, vol, lowpass) {
    if (!ensure() || audio.muted) return;
    const t = audio.ctx.currentTime;
    const len = Math.floor(audio.ctx.sampleRate * dur);
    const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audio.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = audio.ctx.createGain();
    gain.gain.value = vol || 0.3;
    let node = src;
    if (lowpass) {
      const filter = audio.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      src.connect(filter);
      node = filter;
    }
    node.connect(gain);
    gain.connect(audio.master);
    src.start(t);
  }

  function startSiren() {
    if (!ensure() || audio.muted || audio.sirenNodes) return;
    const osc = audio.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 750;
    const lfo = audio.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.9;
    const lfoGain = audio.ctx.createGain();
    lfoGain.gain.value = 320;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const gain = audio.ctx.createGain();
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start();
    lfo.start();
    audio.sirenNodes = { osc, lfo, gain };
  }

  function stopSiren() {
    if (!audio.sirenNodes) return;
    try {
      audio.sirenNodes.osc.stop();
      audio.sirenNodes.lfo.stop();
    } catch (e) { /* already stopped */ }
    audio.sirenNodes = null;
  }

  function startEngine() {
    if (!ensure() || audio.muted || audio.engineNodes) return;
    const osc = audio.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = audio.ctx.createGain();
    gain.gain.value = 0.045;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    osc.start();
    audio.engineNodes = { osc, gain };
  }

  function stopEngine() {
    if (!audio.engineNodes) return;
    try { audio.engineNodes.osc.stop(); } catch (e) { /* already stopped */ }
    audio.engineNodes = null;
  }

  return {
    unlock() {
      audio.unlocked = true;
      ensure();
    },
    toggleMute() {
      audio.muted = !audio.muted;
      if (audio.muted) { stopSiren(); stopEngine(); }
      return audio.muted;
    },
    setSiren(on) { if (on) startSiren(); else stopSiren(); },
    setEngine(speed) {
      if (speed > 20) {
        startEngine();
        if (audio.engineNodes) {
          audio.engineNodes.osc.frequency.value = 55 + Math.abs(speed) * 0.16;
        }
      } else {
        stopEngine();
      }
    },
    shot() { noise(0.14, 0.5, 2400); tone(160, 0.1, 'square', 0.18, 60); },
    punch() { noise(0.08, 0.35, 900); },
    pickup() { tone(880, 0.12, 'sine', 0.22); setTimeout(() => tone(1320, 0.16, 'sine', 0.2), 90); },
    mission() { tone(523, 0.14, 'triangle', 0.2); setTimeout(() => tone(659, 0.14, 'triangle', 0.2), 130); setTimeout(() => tone(784, 0.22, 'triangle', 0.2), 260); },
    crash() { noise(0.3, 0.5, 700); },
    door() { tone(220, 0.07, 'square', 0.12, 140); },
    alarm() { tone(1100, 0.12, 'square', 0.1); setTimeout(() => tone(880, 0.12, 'square', 0.1), 140); },
    horn() { tone(370, 0.35, 'square', 0.12); tone(466, 0.35, 'square', 0.1); },
    busted() { tone(392, 0.3, 'triangle', 0.2, 196); setTimeout(() => tone(311, 0.4, 'triangle', 0.2, 155), 280); },
  };
}
