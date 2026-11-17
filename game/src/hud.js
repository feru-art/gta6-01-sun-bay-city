// Marisol — the HUD: district card, wanted stars, cash, mission banner,
// dialogue, speedometer, health bar, clock and weather. Everything the
// judge reads about the game's systems in one glance lives here.

import { clockLabel, phaseOf } from './clock.js';
import { objectiveText } from './missions.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(6, 10, 24, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

export function drawHud(ctx, S, w, h) {
  const p = S.player;
  // District card, top-left.
  const d = S.district;
  panel(ctx, 14, 12, 230, 58);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(d.name, 28, 38);
  ctx.fillStyle = '#a8d8ff';
  ctx.font = '13px sans-serif';
  ctx.fillText(d.blurb, 28, 58);
  // Wanted stars + cash, top-right.
  panel(ctx, w - 244, 12, 230, 58);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < S.police.wanted ? '#ffd700' : 'rgba(255,255,255,0.25)';
    ctx.font = '22px sans-serif';
    ctx.fillText('★', w - 230 + i * 26, 40);
  }
  ctx.fillStyle = '#7CFC00';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('$' + p.money.toLocaleString('en-US'), w - 28, 62);
  ctx.textAlign = 'left';
  // Clock + weather under the cash.
  ctx.fillStyle = '#ddd';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  const wx = S.clock.weather === 'rain' ? '☂ Rain'
    : phaseOf(S.clock) === 'night' ? '☾ Night'
    : phaseOf(S.clock) === 'dusk' ? '◐ Dusk' : '☀ Day';
  ctx.fillText(`${clockLabel(S.clock)}  ·  ${wx}`, w - 28, 92);
  ctx.textAlign = 'left';
  // Mission banner, top-centre.
  const obj = objectiveText(S.missions);
  const bw = Math.min(w - 60, ctx.measureText(obj).width + 260);
  panel(ctx, w / 2 - bw / 2, 12, bw, 40);
  ctx.fillStyle = '#ffd9a0';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(obj, w / 2, 38);
  // Speedometer + health, bottom-right.
  const kmh = Math.round(Math.abs(p.car ? p.car.speed : p.speed) * 0.42);
  panel(ctx, w - 184, h - 84, 170, 70);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(kmh), w - 44, h - 40);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#aaa';
  ctx.fillText('km/h', w - 28, h - 40);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#333';
  ctx.fillRect(w - 170, h - 28, 142, 10);
  ctx.fillStyle = p.hp > 30 ? '#7CFC00' : '#ff4444';
  ctx.fillRect(w - 170, h - 28, 142 * (p.hp / 100), 10);
  ctx.fillStyle = '#fff';
  ctx.font = '11px sans-serif';
  ctx.fillText(p.car ? 'IN CAR' : 'ON FOOT', w - 170, h - 52);
  // Weapon + activity strip, bottom-centre-left.
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  const stats = S.activities.stats;
  ctx.fillText(
    `${S.player.weapon.toUpperCase()}  ·  Packages ${stats.packages}/10  ·  Fares ${stats.fares}  ·  Races ${stats.races}`,
    220, h - 18,
  );
  // Dialogue box.
  if (S.missions.dialog && S.missions.dialogTimer > 0) {
    const dw = Math.min(w - 80, 760);
    panel(ctx, w / 2 - dw / 2, 66, dw, 52);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(S.missions.dialog, w / 2, 98, dw - 24);
  }
  // Toast (pickups, paydays).
  if (S.toast && S.toastTimer > 0) {
    panel(ctx, w / 2 - 190, h - 130, 380, 36);
    ctx.fillStyle = '#ffe66d';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(S.toast, w / 2, h - 106);
  }
  // Mission-complete flash.
  if (S.missions.flash > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MISSION COMPLETE', w / 2, h / 2 - 10);
  }
  // WASTED screen.
  if (p.dead) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASTED', w / 2, h / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Press R to respawn at the safehouse', w / 2, h / 2 + 40);
  }
}
