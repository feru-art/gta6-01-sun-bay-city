// Marisol — combat: fists, the pistol and the SMG, bullets and muzzle
// flash, and the street gang that fights back during the heist missions.

import { TUNING } from './config.js';

export const WEAPONS = {
  fists: { name: 'Fists', damage: TUNING.punchDamage, rate: 0.45, range: 42, auto: false },
  pistol: { name: 'Pistol', damage: TUNING.shotDamage, rate: 0.32, range: 420, auto: false },
  smg: { name: 'SMG', damage: 18, rate: 0.11, range: 360, auto: true },
};

export function makeCombat() {
  return { bullets: [], foes: [], muzzle: 0, cooldown: 0, shells: [] };
}

// Aim is always the mouse in world space; fire spawns a bullet.
export function fire(combat, player, aimX, aimY) {
  const w = WEAPONS[player.weapon] || WEAPONS.fists;
  if (combat.cooldown > 0) return false;
  combat.cooldown = w.rate;
  if (player.weapon === 'fists') {
    player.punchTimer = 0.3;
    return true;
  }
  const a = Math.atan2(aimY - player.y, aimX - player.x);
  combat.bullets.push({
    x: player.x + Math.cos(a) * 18, y: player.y + Math.sin(a) * 18,
    vx: Math.cos(a) * 900, vy: Math.sin(a) * 900,
    life: w.range / 900, damage: w.damage,
  });
  combat.muzzle = 0.06;
  combat.shells.push({ x: player.x, y: player.y, vx: (Math.random() - 0.5) * 120, vy: -60, life: 0.5 });
  return true;
}

export function spawnGang(combat, x, y, n) {
  for (let i = 0; i < n; i++) {
    combat.foes.push({
      x: x + (Math.random() - 0.5) * 220, y: y + (Math.random() - 0.5) * 220,
      angle: 0, hp: 60, speed: 120, shootTimer: 1 + Math.random() * 2, dead: false,
    });
  }
}

export function updateCombat(combat, player, dt, onPlayerHit, onFoeDown) {
  if (combat.cooldown > 0) combat.cooldown -= dt;
  if (combat.muzzle > 0) combat.muzzle -= dt;
  for (const b of combat.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const f of combat.foes) {
      if (!f.dead && Math.hypot(f.x - b.x, f.y - b.y) < 16) {
        f.hp -= b.damage; b.life = 0;
        if (f.hp <= 0) { f.dead = true; onFoeDown && onFoeDown(f); }
      }
    }
  }
  combat.bullets = combat.bullets.filter((b) => b.life > 0);
  for (const s of combat.shells) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; s.life -= dt;
  }
  combat.shells = combat.shells.filter((s) => s.life > 0);
  for (const f of combat.foes) {
    if (f.dead) continue;
    const d = Math.hypot(player.x - f.x, player.y - f.y);
    f.angle = Math.atan2(player.y - f.y, player.x - f.x);
    if (d > 260) {
      f.x += Math.cos(f.angle) * f.speed * dt;
      f.y += Math.sin(f.angle) * f.speed * dt;
    } else if (d > 40) {
      f.shootTimer -= dt;
      if (f.shootTimer <= 0) {
        f.shootTimer = 1.1 + Math.random();
        if (Math.random() < 0.55) onPlayerHit && onPlayerHit(9);
      }
    }
  }
}

export function drawCombat(ctx, combat, player) {
  for (const b of combat.bullets) {
    ctx.fillStyle = '#ffe66d';
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  for (const s of combat.shells) {
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(s.x - 1, s.y - 1, 3, 2);
  }
  if (combat.muzzle > 0 && player.weapon !== 'fists') {
    ctx.fillStyle = 'rgba(255, 220, 80, 0.9)';
    ctx.beginPath(); ctx.arc(player.x + Math.cos(player.angle) * 26, player.y + Math.sin(player.angle) * 26, 7, 0, Math.PI * 2); ctx.fill();
  }
  for (const f of combat.foes) {
    if (f.dead) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(f.x, f.y, 12, 7, f.angle, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    ctx.fillStyle = '#6c2bd9';
    ctx.fillRect(-9, -7, 18, 14);
    ctx.fillStyle = '#ffd9b3';
    ctx.beginPath(); ctx.arc(10, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(8, -2, 12, 4);
    ctx.restore();
    ctx.fillStyle = '#c00';
    ctx.fillRect(f.x - 12, f.y - 22, 24 * Math.max(0, f.hp / 60), 4);
  }
}
