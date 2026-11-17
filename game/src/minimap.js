// Sun Bay — minimap: the whole city scaled into a corner, with blips for
// the player, police, mission target and gang members.
import { WORLD_W, WORLD_H } from './config.js';
import { currentMission, missionDone } from './missions.js';

export function drawMinimap(ctx, G, canvas) {
  const size = 190;
  const x0 = canvas.width - size - 14;
  const y0 = 66;
  const sx = size / WORLD_W, sy = size / WORLD_H;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x0 - 4, y0 - 4, size + 8, size + 8);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, size, size);
  ctx.clip();
  ctx.fillStyle = '#2e4a3a';
  ctx.fillRect(x0, y0, size, size);
  ctx.fillStyle = '#3c3f45';
  for (const x of [150, 450, 750, 1050, 1350, 1650, 1950, 2250, 2500]) {
    ctx.fillRect(x0 + x * sx - 2, y0, 4, size);
  }
  for (const y of [150, 450, 750, 1050, 1350, 1650]) {
    ctx.fillRect(x0, y0 + y * sy - 2, size, 4);
  }
  ctx.fillStyle = '#2e86ab';
  ctx.fillRect(x0, y0, 4, size);
  // Mission target blip.
  if (!missionDone(G)) {
    const m = currentMission(G);
    if (m.target) {
      const pulse = 5 + Math.sin(G.time * 5) * 2;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(x0 + m.target.x * sx, y0 + m.target.y * sy, pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x0 + m.target.x * sx, y0 + m.target.y * sy, pulse + 3, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // Police blips (blue-red).
  for (const p of G.police) {
    ctx.fillStyle = Math.sin(G.time * 6 + p.x) > 0 ? '#ff2d2d' : '#2d7dff';
    ctx.beginPath(); ctx.arc(x0 + p.x * sx, y0 + p.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Gang blips.
  ctx.fillStyle = '#c77dff';
  for (const e of G.enemies || []) {
    ctx.beginPath(); ctx.arc(x0 + e.x * sx, y0 + e.y * sy, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Player arrow.
  const px = x0 + G.player.x * sx, py = y0 + G.player.y * sy;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(G.player.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  // North marker.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('N', x0 + size / 2 - 4, y0 - 8);
  ctx.restore();
}
