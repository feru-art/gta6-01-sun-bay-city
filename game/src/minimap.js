// Marisol — the minimap: the whole city shrunk to a corner, with the
// player arrow, mission marker, cops, taxi target and race checkpoints.

import { WORLD_W, WORLD_H, HARBOR } from './config.js';
import { currentStep } from './missions.js';

const MW = 190, MH = 142;

export function drawMinimap(ctx, S, w, h) {
  const ox = 14, oy = h - MH - 14;
  const sx = MW / WORLD_W, sy = MH / WORLD_H;
  ctx.fillStyle = 'rgba(6, 10, 24, 0.78)';
  ctx.beginPath();
  ctx.roundRect(ox - 4, oy - 4, MW + 8, MH + 8, 8);
  ctx.fill();
  ctx.fillStyle = '#7fae5a';
  ctx.fillRect(ox, oy, MW, MH);
  // Harbour.
  ctx.fillStyle = '#2b6ea3';
  ctx.fillRect(ox + HARBOR.x * sx, oy, HARBOR.w * sx, MH);
  // Roads.
  ctx.strokeStyle = '#3a3a40';
  ctx.lineWidth = 3;
  for (const rx of S.roadsX) {
    ctx.beginPath(); ctx.moveTo(ox + rx * sx, oy); ctx.lineTo(ox + rx * sx, oy + MH); ctx.stroke();
  }
  for (const ry of S.roadsY) {
    ctx.beginPath(); ctx.moveTo(ox, oy + ry * sy); ctx.lineTo(ox + MW, oy + ry * sy); ctx.stroke();
  }
  // Mission marker.
  const step = currentStep(S.missions);
  if (step && (step.type === 'goto' || step.type === 'drive' || step.type === 'fight')) {
    const pulse = 5 + Math.sin(performance.now() / 200) * 2;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(ox + step.x * sx, oy + step.y * sy, pulse + 3, 0, Math.PI * 2); ctx.fill();
  }
  // Taxi destination.
  if (S.activities.taxi) {
    ctx.fillStyle = '#f5c518';
    ctx.beginPath(); ctx.arc(ox + S.activities.taxi.dx * sx, oy + S.activities.taxi.dy * sy, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Cops as blue dots, heli as a yellow dot.
  ctx.fillStyle = '#2979ff';
  for (const c of S.police.cops) {
    ctx.beginPath(); ctx.arc(ox + c.x * sx, oy + c.y * sy, 3, 0, Math.PI * 2); ctx.fill();
  }
  if (S.police.heli) {
    ctx.fillStyle = '#ffea00';
    ctx.beginPath(); ctx.arc(ox + S.police.heli.x * sx, oy + S.police.heli.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Player arrow.
  const p = S.player;
  ctx.save();
  ctx.translate(ox + p.x * sx, oy + p.y * sy);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(8, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  // North label.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('N', ox + MW / 2 - 3, oy + 12);
}
