// Sun Bay — combat: fists, a pistol, gang members who fight back, and
// the bullets and particles that make a fight readable at a glance.
import { raiseWantedLevel } from './police.js';

export function spawnGang(G, x, y, n) {
  G.enemies = G.enemies || [];
  for (let i = 0; i < n; i++) {
    G.enemies.push({
      x: x + (Math.random() - 0.5) * 120, y: y + (Math.random() - 0.5) * 120,
      health: 60, angle: 0, speed: 70 + Math.random() * 30, cooldown: 0,
      color: '#5b2c6f',
    });
  }
}

export function shootAt(G, tx, ty) {
  if (!G.hasGun || G.player.onFoot === false) return;
  const p = G.player;
  const a = Math.atan2(ty - p.y, tx - p.x);
  G.bullets.push({ x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, t: 0.8 });
  G.muzzle = { x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, t: 0.08 };
  if (Math.random() < 0.4) raiseWantedLevel(G, 1);
}

export function updateCombat(G, dt) {
  // Punch hits.
  if (G.punch) {
    for (const e of G.enemies || []) {
      if (Math.hypot(e.x - G.punch.x, e.y - G.punch.y) < 26) {
        e.health -= 25;
        e.x += Math.cos(G.player.angle) * 14;
        e.y += Math.sin(G.player.angle) * 14;
        burst(G, e.x, e.y, '#ffd166');
      }
    }
    for (const p of G.peds) {
      if (Math.hypot(p.x - G.punch.x, p.y - G.punch.y) < 26) { p.panic = 1; raiseWantedLevel(G, 1); }
    }
  }
  // Bullets.
  for (const b of G.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.t -= dt;
    for (const e of G.enemies || []) {
      if (e.health > 0 && Math.hypot(e.x - b.x, e.y - b.y) < 16) {
        e.health -= 34; b.t = 0; burst(G, e.x, e.y, '#ff6b6b');
        if (e.health <= 0) { G.cash += 50; G.score += 50; G.message = 'Gang member down — +$50.'; }
      }
    }
  }
  G.bullets = G.bullets.filter(b => b.t > 0);
  if (G.muzzle) { G.muzzle.t -= dt; if (G.muzzle.t <= 0) G.muzzle = null; }
  // Gang members chase and swing at the player on foot.
  for (const e of G.enemies || []) {
    if (e.health <= 0) continue;
    e.cooldown -= dt;
    const p = G.player;
    const d = Math.hypot(p.x - e.x, p.y - e.y);
    if (d < 320 && p.onFoot) {
      e.angle = Math.atan2(p.y - e.y, p.x - e.x);
      if (d > 24) { e.x += Math.cos(e.angle) * e.speed * dt; e.y += Math.sin(e.angle) * e.speed * dt; }
      else if (e.cooldown <= 0) {
        e.cooldown = 1.0;
        p.health -= 8;
        burst(G, p.x, p.y, '#fff');
        if (p.health <= 0) G.gameOver = 'wasted';
      }
    }
  }
  G.enemies = (G.enemies || []).filter(e => e.health > 0);
  for (const pt of G.particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.t -= dt; }
  G.particles = G.particles.filter(pt => pt.t > 0);
}

export function burst(G, x, y, color) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    G.particles.push({ x, y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, t: 0.4, color });
  }
}

export function drawCombat(ctx, G) {
  for (const e of G.enemies || []) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(e.x + 2, e.y + 4, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8b48a';
    ctx.beginPath(); ctx.arc(e.x, e.y - 9, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x - 12, e.y - 22, 24, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(e.x - 12, e.y - 22, 24 * Math.max(0, e.health) / 60, 4);
  }
  ctx.fillStyle = '#ffd166';
  for (const b of G.bullets) {
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  if (G.muzzle) {
    ctx.fillStyle = '#fff7ae';
    ctx.beginPath(); ctx.arc(G.muzzle.x, G.muzzle.y, 8, 0, Math.PI * 2); ctx.fill();
  }
  for (const pt of G.particles) {
    ctx.globalAlpha = Math.max(0, pt.t / 0.4);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  // Sun coins (sandbox collectibles).
  for (const c of G.coins || []) {
    if (c.taken) continue;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(c.x, c.y + Math.sin(G.time * 3 + c.x) * 2, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('S', c.x, c.y + 4);
    ctx.textAlign = 'left';
  }
}
