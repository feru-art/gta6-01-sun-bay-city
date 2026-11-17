// Sun Bay HUD: everything the player reads — wanted stars, money, speed, the
// mission objective, messages, banners, dialogue, and the title / pause /
// busted / wasted screens. The HUD is drawn in screen space, after the world.
import { currentMission, currentStep } from './missions.js';

export function createHud() {
  return {
    messageText: '',
    messageUntil: 0,
    bannerText: '',
    bannerSub: '',
    bannerUntil: 0,
    flashStars: 0,
    shake: 0,
    hitMarks: [],
  };
}

function hudApi(hud, state) {
  return {
    message(text, seconds) {
      hud.messageText = text;
      hud.messageUntil = state.time + seconds;
    },
    banner(title, sub) {
      hud.bannerText = title;
      hud.bannerSub = sub || '';
      hud.bannerUntil = state.time + 3.2;
    },
    hitMark(x, y) {
      hud.hitMarks.push({ x, y, until: state.time + 0.4 });
    },
  };
}

export function attachHud(state) {
  state.hud = { ...createHud(), ...hudApi(createHud(), state) };
  // Rebind the api to the live hud object so message/banner write the same one.
  const api = hudApi(state.hud, state);
  state.hud.message = api.message;
  state.hud.banner = api.banner;
  state.hud.hitMark = api.hitMark;
}

function drawStars(ctx, x, y, wanted, flash) {
  for (let i = 0; i < 5; i += 1) {
    const filled = i < wanted;
    ctx.fillStyle = filled ? (flash > 0 && Math.sin(Date.now() / 90) > 0 ? '#ffe066' : '#ffd640') : 'rgba(255, 255, 255, 0.25)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.5;
    const cx = x + i * 30;
    ctx.beginPath();
    for (let p = 0; p < 10; p += 1) {
      const r = p % 2 === 0 ? 12 : 5;
      const a = -Math.PI / 2 + (p * Math.PI) / 5;
      const px = cx + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10, 12, 18, 0.62)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

export function drawHUD(ctx, state) {
  const hud = state.hud;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  hud.flashStars = Math.max(0, hud.flashStars - 0.016);
  hud.shake = Math.max(0, hud.shake - 0.016);

  // Top right: wanted stars + money.
  panel(ctx, w - 250, 14, 236, 64);
  drawStars(ctx, w - 238, 40, state.wanted, hud.flashStars);
  ctx.fillStyle = '#7ddb8a';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${state.money.toLocaleString('en-US')}`, w - 26, 66);
  ctx.textAlign = 'left';

  // Top left: district + health.
  const district = state.district;
  panel(ctx, 14, 14, 210, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(district ? district.name : 'Sun Bay', 26, 38);
  ctx.font = '13px Arial, sans-serif';
  ctx.fillStyle = '#c8c8c8';
  ctx.fillText(district ? district.blurb : '', 26, 58);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(26, 64, 186, 6);
  ctx.fillStyle = state.player.health > 30 ? '#7ddb8a' : '#ff4d4d';
  ctx.fillRect(26, 64, 186 * (state.player.health / 100), 6);

  // Top centre: current objective.
  const mission = currentMission(state.missions);
  const step = currentStep(state.missions);
  if (mission && step) {
    ctx.font = 'bold 16px Arial, sans-serif';
    const text = `${mission.name} — ${step.objective}`;
    const tw = ctx.measureText(text).width;
    panel(ctx, w / 2 - tw / 2 - 16, 14, tw + 32, 34);
    ctx.fillStyle = '#ffd640';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 37);
    ctx.textAlign = 'left';
  }

  // Bottom right: speed + gear hint.
  if (state.player.car) {
    panel(ctx, w - 190, h - 78, 176, 64);
    const kmh = Math.round(Math.abs(state.player.car.speed) * 0.45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${kmh}`, w - 58, h - 40);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#c8c8c8';
    ctx.fillText('km/h', w - 26, h - 40);
    ctx.textAlign = 'left';
    // Damage bar.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(w - 176, h - 30, 148, 6);
    ctx.fillStyle = state.player.car.damage > 70 ? '#ff4d4d' : '#e8a13a';
    ctx.fillRect(w - 176, h - 30, 148 * (1 - state.player.car.damage / 100), 6);
  } else {
    panel(ctx, w - 190, h - 78, 176, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('ON FOOT', w - 176, h - 52);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#c8c8c8';
    ctx.fillText(state.player.armed ? `Pistol — ${state.player.ammo} rounds (F)` : 'E — enter car   Space — punch', w - 176, h - 32);
  }

  // Message line.
  if (state.time < hud.messageUntil) {
    ctx.font = 'bold 17px Arial, sans-serif';
    const tw = ctx.measureText(hud.messageText).width;
    panel(ctx, w / 2 - tw / 2 - 14, h - 118, tw + 28, 32);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(hud.messageText, w / 2, h - 96);
    ctx.textAlign = 'left';
  }

  // Mission dialogue.
  if (state.time < state.missions.dialogUntil && state.missions.dialog) {
    ctx.font = '16px Arial, sans-serif';
    const tw = Math.min(w - 120, ctx.measureText(state.missions.dialog).width);
    panel(ctx, w / 2 - tw / 2 - 14, 62, tw + 28, 34);
    ctx.fillStyle = '#e8e0c8';
    ctx.textAlign = 'center';
    ctx.fillText(state.missions.dialog, w / 2, 85);
    ctx.textAlign = 'left';
  }

  // Banner (mission start / complete).
  if (state.time < hud.bannerUntil) {
    const alpha = Math.min(1, (hud.bannerUntil - state.time) / 0.6);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hud.bannerText, w / 2, h * 0.32);
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#ffd640';
    ctx.fillText(hud.bannerSub, w / 2, h * 0.32 + 32);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // Hit markers.
  for (let i = hud.hitMarks.length - 1; i >= 0; i -= 1) {
    const mark = hud.hitMarks[i];
    if (state.time > mark.until) { hud.hitMarks.splice(i, 1); continue; }
    const sx = mark.x - state.camera.x;
    const sy = mark.y - state.camera.y;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx - 8, sy - 8); ctx.lineTo(sx - 3, sy - 3);
    ctx.moveTo(sx + 8, sy - 8); ctx.lineTo(sx + 3, sy - 3);
    ctx.moveTo(sx - 8, sy + 8); ctx.lineTo(sx - 3, sy + 3);
    ctx.moveTo(sx + 8, sy + 8); ctx.lineTo(sx + 3, sy + 3);
    ctx.stroke();
  }
}

export function drawTitle(ctx, state, backdrop) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  if (backdrop && backdrop.complete && backdrop.naturalWidth > 0) {
    ctx.drawImage(backdrop, 0, 0, w, h);
    ctx.fillStyle = 'rgba(20, 10, 5, 0.45)';
    ctx.fillRect(0, 0, w, h);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#f7c873');
    grad.addColorStop(0.55, '#e88a4a');
    grad.addColorStop(1, '#3a2a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 92px Arial, sans-serif';
  ctx.fillText('SUN BAY', w / 2, h * 0.36);
  ctx.font = '26px Arial, sans-serif';
  ctx.fillStyle = '#ffd640';
  ctx.fillText('An open-world crime game', w / 2, h * 0.36 + 40);
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = '#f2e8d0';
  ctx.fillText('Explore the city on foot and by car. Take jobs from Rosa, Marco and Dena.', w / 2, h * 0.52);
  ctx.fillText('Steal cars, outrun the Sun Bay police — and mind the helicopter.', w / 2, h * 0.52 + 26);
  const blink = Math.sin(Date.now() / 350) > -0.2;
  if (blink) {
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Press ENTER to play', w / 2, h * 0.68);
  }
  ctx.font = '15px Arial, sans-serif';
  ctx.fillStyle = '#d8d0c0';
  ctx.fillText('WASD / arrows — move & drive    Shift — run    E — enter / exit car    Space — punch / handbrake    F — shoot    P — pause    M — sound', w / 2, h - 30);
  ctx.textAlign = 'left';
}

export function drawPause(ctx, state) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.fillStyle = 'rgba(8, 8, 14, 0.66)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Arial, sans-serif';
  ctx.fillText('PAUSED', w / 2, h / 2 - 20);
  ctx.font = '19px Arial, sans-serif';
  ctx.fillStyle = '#c8c8c8';
  ctx.fillText('P — resume    R — restart run    M — sound on / off', w / 2, h / 2 + 24);
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, state, kind) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.fillStyle = kind === 'busted' ? 'rgba(10, 20, 60, 0.72)' : 'rgba(60, 10, 10, 0.72)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 84px Arial, sans-serif';
  ctx.fillText(kind === 'busted' ? 'BUSTED' : 'WASTED', w / 2, h / 2 - 10);
  ctx.font = '20px Arial, sans-serif';
  ctx.fillStyle = '#e8e0c8';
  ctx.fillText(kind === 'busted'
    ? 'The Sun Bay police caught up with Kai. Bail set — the run goes on.'
    : 'Kai went down. The city keeps moving without him — for now.', w / 2, h / 2 + 34);
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillStyle = '#ffd640';
  ctx.fillText('Press ENTER to get back out there', w / 2, h / 2 + 84);
  ctx.textAlign = 'left';
}
