// Sun Bay minimap: the whole city in the corner, with blips for the player,
// the police, the mission waypoint and the helicopter. Drawn in screen space.
import { WORLD, ROADS, DISTRICTS } from './config.js';
import { currentStep } from './missions.js';

const MAP_W = 196;
const MAP_H = 150;

export function drawMinimap(ctx, state) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const x0 = 14;
  const y0 = h - MAP_H - 14;
  const sx = MAP_W / WORLD.width;
  const sy = MAP_H / WORLD.height;

  ctx.fillStyle = 'rgba(10, 12, 18, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x0 - 4, y0 - 4, MAP_W + 8, MAP_H + 8, 8);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0, MAP_W, MAP_H, 5);
  ctx.clip();

  // District ground.
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.ground;
    ctx.fillRect(x0 + d.x * sx, y0 + d.y * sy, d.w * sx, d.h * sy);
  }
  // Water edge.
  ctx.fillStyle = '#4a90b8';
  ctx.fillRect(x0, y0, 110 * sx, MAP_H);
  // Roads.
  ctx.strokeStyle = '#4a4640';
  ctx.lineWidth = 3;
  for (const ry of ROADS.horizontal) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + ry * sy);
    ctx.lineTo(x0 + MAP_W, y0 + ry * sy);
    ctx.stroke();
  }
  for (const rx of ROADS.vertical) {
    ctx.beginPath();
    ctx.moveTo(x0 + rx * sx, y0);
    ctx.lineTo(x0 + rx * sx, y0 + MAP_H);
    ctx.stroke();
  }
  const px = (x) => x0 + x * sx;
  const py = (y) => y0 + y * sy;

  // Mission waypoint.
  const step = currentStep(state.missions);
  if (step && step.need === 'reach') {
    const pulse = 1 + Math.sin(state.time * 5) * 0.25;
    ctx.fillStyle = '#ffd640';
    ctx.beginPath();
    ctx.arc(px(step.x), py(step.y), 5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Police blips (flashing red/blue).
  const flash = Math.sin(state.time * 9) > 0;
  for (const cop of state.police.cars) {
    ctx.fillStyle = flash ? '#ff2d2d' : '#2d5dff';
    ctx.beginPath();
    ctx.arc(px(cop.x), py(cop.y), 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (state.police.heli) {
    ctx.fillStyle = '#ff2d2d';
    ctx.beginPath();
    ctx.arc(px(state.police.heli.x), py(state.police.heli.y), 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Roadblocks.
  for (const block of state.police.roadblocks) {
    ctx.fillStyle = '#ff7a1a';
    ctx.fillRect(px(block.x) - 3, py(block.y) - 3, 6, 6);
  }
  // Player: a white arrow that turns with the car.
  const player = state.player;
  ctx.save();
  ctx.translate(px(player.x), py(player.y));
  ctx.rotate(player.angle);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // North marker.
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', x0 + MAP_W / 2, y0 + 12);
  ctx.textAlign = 'left';
}
