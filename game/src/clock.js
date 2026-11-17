// Marisol — the day/night clock and the weather. One job: time of day,
// light level, rain, and the lighting overlay the renderer draws.

export function makeClock() {
  return { minutes: 8 * 60 + 20, weather: 'sun', weatherTimer: 0 };
}

// One real second = one game minute, so a full day takes 24 real minutes.
export function advanceClock(clock, dt) {
  clock.minutes = (clock.minutes + dt) % 1440;
  clock.weatherTimer += dt;
  if (clock.weather === 'sun' && clock.weatherTimer > 150) {
    clock.weather = 'rain'; clock.weatherTimer = 0;
  } else if (clock.weather === 'rain' && clock.weatherTimer > 75) {
    clock.weather = 'sun'; clock.weatherTimer = 0;
  }
}

export function phaseOf(clock) {
  const h = clock.minutes / 60;
  if (h >= 6 && h < 18) return 'day';
  if (h >= 18 && h < 20.5) return 'dusk';
  return 'night';
}

export function clockLabel(clock) {
  const h = Math.floor(clock.minutes / 60);
  const m = Math.floor(clock.minutes % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// 0 = full daylight, 1 = deepest night.
export function darkness(clock) {
  const p = phaseOf(clock);
  if (p === 'day') return 0;
  if (p === 'dusk') return 0.35;
  return 0.62;
}

export function drawLighting(ctx, clock, view, player, cars) {
  const d = darkness(clock);
  if (d <= 0) return;
  ctx.fillStyle = `rgba(8, 10, 32, ${d})`;
  ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
  // Headlight cones punch holes in the dark around every moving car.
  ctx.globalCompositeOperation = 'lighter';
  for (const c of cars) {
    if (c.speed < 20 && c !== player.car) continue;
    const gx = c.x + Math.cos(c.angle) * 90;
    const gy = c.y + Math.sin(c.angle) * 90;
    const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, 150);
    g.addColorStop(0, 'rgba(255, 244, 180, 0.35)');
    g.addColorStop(1, 'rgba(255, 244, 180, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(gx, gy, 150, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

export function drawRain(ctx, clock, view, time) {
  if (clock.weather !== 'rain') return;
  ctx.strokeStyle = 'rgba(180, 210, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const seed = Math.floor(time * 24);
  for (let i = 0; i < 130; i++) {
    const rx = view.x0 + ((i * 173 + seed * 7) % Math.max(1, view.x1 - view.x0));
    const ry = view.y0 + ((i * 97 + seed * 31) % Math.max(1, view.y1 - view.y0));
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 7, ry + 16);
  }
  ctx.stroke();
  // Wet sheen on the roads.
  ctx.fillStyle = 'rgba(160, 200, 255, 0.05)';
  ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
}
