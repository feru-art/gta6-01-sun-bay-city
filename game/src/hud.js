// Sun Bay — HUD: wanted stars, cash, speed, mission objective, messages,
// dialog, start screen (with the golden-hour backdrop), pause and game over.
import { currentMission, missionDone } from './missions.js';
import { districtAt } from './city.js';

export function drawHUD(ctx, G, canvas) {
  const W = canvas.width, H = canvas.height;
  // Wanted stars, top right.
  ctx.textAlign = 'right';
  for (let i = 0; i < 5; i++) {
    ctx.font = '28px sans-serif';
    ctx.fillStyle = i < G.wanted ? '#ffd166' : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', W - 24 - i * 30, 40);
  }
  ctx.textAlign = 'left';
  // Cash + score, top left.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(12, 12, 190, 56);
  ctx.fillStyle = '#7ee081';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('$' + G.cash, 22, 36);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('SCORE ' + G.score + '   •   ' + districtAt(G.player.x, G.player.y), 22, 58);
  // Speed, bottom right (when driving).
  if (!G.player.onFoot && G.playerCar) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(W - 150, H - 64, 138, 52);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(Math.abs(G.playerCar.speed) * 0.36) + ' km/h', W - 24, H - 30);
    ctx.textAlign = 'left';
  }
  // Mission objective bar, top centre.
  if (!missionDone(G) && !G.gameOver) {
    const m = currentMission(G);
    const label = m.title + ' — ' + m.text;
    ctx.font = '15px sans-serif';
    const w = Math.min(W - 260, ctx.measureText(label).width + 28);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect((W - w) / 2, 12, w, 34);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(label, (W - w) / 2 + 14, 34);
    if (m.kind === 'escape' || m.kind === 'survive') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0:' + String(Math.max(0, Math.ceil(G.escapeLeft))).padStart(2, '0'), W / 2, 72);
      ctx.textAlign = 'left';
    }
    if (m.kind === 'collect') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sun coins: ' + G.missionProgress + '/' + m.count, W / 2, 72);
      ctx.textAlign = 'left';
    }
  }
  // Message toast.
  if (G.message && G.messageT > 0) {
    ctx.font = '15px sans-serif';
    const w = ctx.measureText(G.message).width + 24;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect((W - w) / 2, H - 120, w, 30);
    ctx.fillStyle = '#fff';
    ctx.fillText(G.message, (W - w) / 2 + 12, H - 100);
  }
  // Controls hint, bottom left.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '12px sans-serif';
  ctx.fillText('WASD move/drive • E enter car • F punch • Click shoot • Shift run • P pause • M mute', 14, H - 14);
  // NPC dialog box.
  if (G.dialog && G.time < G.dialog.until) {
    ctx.fillStyle = 'rgba(10,10,30,0.85)';
    ctx.fillRect(60, H - 190, W - 120, 56);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(G.dialog.npc, 76, H - 166);
    ctx.fillStyle = '#fff';
    ctx.font = '15px sans-serif';
    ctx.fillText(G.dialog.text, 76, H - 144);
  }
  if (G.gameOver === 'busted') drawEndCard(ctx, W, H, 'BUSTED', 'The SBPD caught Kai. Sun Bay waits for no one.');
  if (G.gameOver === 'wasted') drawEndCard(ctx, W, H, 'WASTED', 'Kai is down. The city keeps moving.');
  if (G.gameOver === 'win') drawEndCard(ctx, W, H, 'SUN BAY IS YOURS', 'Every mission complete. Press R to keep roaming.');
}

function drawEndCard(ctx, W, H, title, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, H / 2 - 10);
  ctx.font = '18px sans-serif';
  ctx.fillText(sub, W / 2, H / 2 + 28);
  ctx.font = '15px sans-serif';
  ctx.fillText('Press R to restart', W / 2, H / 2 + 64);
  ctx.textAlign = 'left';
}

export function drawStartScreen(ctx, G, canvas) {
  const W = canvas.width, H = canvas.height;
  if (G.backdrop && G.backdrop.complete && G.backdrop.naturalWidth > 0) {
    ctx.drawImage(G.backdrop, 0, 0, W, H);
    ctx.fillStyle = 'rgba(10,10,30,0.45)';
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#f7b267');
    grad.addColorStop(0.6, '#e07a5f');
    grad.addColorStop(1, '#2d2a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 84px sans-serif';
  ctx.fillText('SUN BAY', W / 2, H / 2 - 90);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('An open-world story of cars, heat and second chances', W / 2, H / 2 - 48);
  ctx.fillStyle = '#fff';
  ctx.font = '17px sans-serif';
  ctx.fillText('Explore the city on foot or by car — steal rides, dodge the SBPD, run missions for Rosa, Marco and Dena.', W / 2, H / 2 + 6);
  ctx.fillText('WASD move / drive  •  E enter a car  •  F punch  •  Click to shoot  •  Shift to run', W / 2, H / 2 + 36);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Press ENTER to start — ' + G.variantLabel, W / 2, H / 2 + 92);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '13px sans-serif';
  ctx.fillText('A fully original city. No real places, people or brands. Sound: M to mute. Progress saves automatically.', W / 2, H - 24);
  ctx.textAlign = 'left';
}
