// Sun Bay — the player on foot: walk, run, punch, enter and leave cars.
import { collideBuildings } from './city.js';

export function createPlayer(x, y) {
  return {
    x, y, angle: 0, speed: 0, onFoot: true, health: 100,
    punchCooldown: 0, walkPhase: 0,
  };
}

export function updatePlayer(G, dt) {
  const p = G.player;
  const k = G.keys;
  p.punchCooldown = Math.max(0, p.punchCooldown - dt);
  if (!p.onFoot) return;
  let mx = 0, my = 0;
  if (k['KeyW'] || k['ArrowUp']) my -= 1;
  if (k['KeyS'] || k['ArrowDown']) my += 1;
  if (k['KeyA'] || k['ArrowLeft']) mx -= 1;
  if (k['KeyD'] || k['ArrowRight']) mx += 1;
  const run = k['ShiftLeft'] || k['ShiftRight'];
  const sp = (run ? 230 : 140);
  if (mx || my) {
    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    p.angle = Math.atan2(my, mx);
    const nx = p.x + mx * sp * dt;
    const ny = p.y + my * sp * dt;
    if (!collideBuildings(G.city, nx, p.y, 12)) p.x = nx;
    if (!collideBuildings(G.city, p.x, ny, 12)) p.y = ny;
    p.x = Math.max(60, Math.min(2540, p.x));
    p.y = Math.max(60, Math.min(1840, p.y));
    p.walkPhase += dt * (run ? 14 : 9);
  }
  // Punch nearby gang members (combat.js handles the hit).
  if (k['KeyF'] && p.punchCooldown <= 0) {
    p.punchCooldown = 0.45;
    G.punch = { x: p.x + Math.cos(p.angle) * 26, y: p.y + Math.sin(p.angle) * 26, t: 0.18 };
  }
  if (G.punch) { G.punch.t -= dt; if (G.punch.t <= 0) G.punch = null; }
}

export function drawPlayer(ctx, G) {
  const p = G.player;
  if (!p.onFoot) return;
  const bob = Math.sin(p.walkPhase) * 2;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(2, 5, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Legs.
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(-5, -2 + bob, 4, 10);
  ctx.fillRect(2, -2 - bob, 4, 10);
  // Body: Kai in a teal jacket.
  ctx.fillStyle = '#0f766e';
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath(); ctx.arc(Math.cos(p.angle) * 6, Math.sin(p.angle) * 6, 3, 0, Math.PI * 2); ctx.fill();
  // Head.
  ctx.fillStyle = '#e8b48a';
  ctx.beginPath(); ctx.arc(0, -9, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d3557';
  ctx.beginPath(); ctx.arc(0, -11, 6, Math.PI, 0); ctx.fill();
  ctx.restore();
  if (G.punch) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(G.punch.x, G.punch.y, 12, 0, Math.PI * 2); ctx.stroke();
  }
  // Health bar when hurt.
  if (p.health < 100) {
    ctx.fillStyle = '#000';
    ctx.fillRect(p.x - 16, p.y - 26, 32, 5);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(p.x - 16, p.y - 26, 32 * Math.max(0, p.health) / 100, 5);
  }
}
