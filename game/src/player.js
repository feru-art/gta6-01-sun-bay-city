// Marisol — the player on foot: movement, health, entering cars, and the
// little figure the camera follows when no car is under him.

import { TUNING, clamp } from './config.js';

export function makePlayer(x, y) {
  return {
    x, y, angle: -Math.PI / 2, hp: TUNING.playerHp, money: 350,
    car: null, weapon: 'fists', speed: 0, dead: false, punchTimer: 0,
  };
}

export function moveOnFoot(p, input, dt, solids) {
  const mag = Math.hypot(input.x, input.y);
  const top = input.run ? TUNING.runSpeed : TUNING.walkSpeed;
  if (mag > 0.1) {
    const nx = input.x / mag, ny = input.y / mag;
    p.angle = Math.atan2(ny, nx);
    p.speed = top;
    const nx2 = p.x + nx * top * dt, ny2 = p.y + ny * top * dt;
    if (!hitsSolid(nx2, p.y, solids)) p.x = nx2;
    if (!hitsSolid(p.x, ny2, solids)) p.y = ny2;
  } else {
    p.speed = 0;
  }
  p.x = clamp(p.x, 20, 4780); p.y = clamp(p.y, 20, 3580);
  if (p.punchTimer > 0) p.punchTimer -= dt;
}

export function hitsSolid(x, y, solids) {
  for (const b of solids) {
    if (x > b.x - 6 && x < b.x + b.w + 6 && y > b.y - 6 && y < b.y + b.h + 6) return true;
  }
  return false;
}

export function hurtPlayer(p, amount) {
  p.hp -= amount;
  if (p.hp <= 0) { p.hp = 0; p.dead = true; }
}

export function drawPlayer(ctx, p, time) {
  if (p.car) return;
  const bob = p.speed > 0 ? Math.sin(time * 14) * 2 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob * 0.3);
  ctx.rotate(p.angle);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(2, 3, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: jacket, head, legs.
  ctx.fillStyle = '#e63946';
  ctx.fillRect(-9, -7, 18, 14);
  ctx.fillStyle = '#ffd9b3';
  ctx.beginPath(); ctx.arc(10, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2d42';
  ctx.fillRect(-12, -8, 6, 5);
  ctx.fillRect(-12, 3, 6, 5);
  if (p.weapon !== 'fists') {
    ctx.fillStyle = '#222';
    ctx.fillRect(8, -2, 12, 4);
  }
  ctx.restore();
}
