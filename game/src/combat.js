// Sun Bay combat: fists and a pistol. Punching is always available; the
// pistol comes from the gun shop run and carries limited ammo. Gang members
// guard the heist route and fight back. Violence in public raises the heat.
import { TUNE, distance } from './config.js';
import { addWanted } from './police.js';

export function createCombat() {
  return {
    bullets: [],
    enemies: [],
    shotsFired: 0,
    punchCooldown: 0,
    shootCooldown: 0,
    muzzle: 0,
  };
}

export function spawnGang(state, x, y, count) {
  for (let i = 0; i < count; i += 1) {
    state.combat.enemies.push({
      x: x + (Math.random() - 0.5) * 120,
      y: y + (Math.random() - 0.5) * 120,
      angle: Math.random() * Math.PI * 2,
      speed: 0,
      health: 100,
      punchCooldown: 0,
      walkPhase: Math.random() * 6,
    });
  }
}

export function tryPunch(state) {
  const combat = state.combat;
  const player = state.player;
  if (combat.punchCooldown > 0 || player.car) return;
  combat.punchCooldown = 0.45;
  state.audio.punch();
  const reachX = player.x + Math.cos(player.angle) * TUNE.punchRange;
  const reachY = player.y + Math.sin(player.angle) * TUNE.punchRange;
  // Enemies take the hit first.
  for (const enemy of combat.enemies) {
    if (distance(reachX, reachY, enemy.x, enemy.y) < 34) {
      enemy.health -= TUNE.punchDamage;
      enemy.x += Math.cos(player.angle) * 18;
      enemy.y += Math.sin(player.angle) * 18;
      state.hud.hitMark(enemy.x, enemy.y);
      return;
    }
  }
  // Hitting a bystander is a crime the whole street sees.
  for (const ped of state.traffic.peds) {
    if (distance(reachX, reachY, ped.x, ped.y) < 30) {
      ped.panic = 3;
      addWanted(state, 1, 'Assault reported!');
      return;
    }
  }
}

export function tryShoot(state) {
  const combat = state.combat;
  const player = state.player;
  if (combat.shootCooldown > 0 || !player.armed || player.ammo <= 0) return;
  combat.shootCooldown = 0.28;
  combat.muzzle = 0.08;
  combat.shotsFired += 1;
  player.ammo -= 1;
  state.audio.shot();
  combat.bullets.push({
    x: player.x + Math.cos(player.angle) * 20,
    y: player.y + Math.sin(player.angle) * 20,
    vx: Math.cos(player.angle) * TUNE.bulletSpeed,
    vy: Math.sin(player.angle) * TUNE.bulletSpeed,
    life: 0.9,
  });
  addWanted(state, 1, 'Shots fired!');
}

export function updateCombat(state, dt) {
  const combat = state.combat;
  const player = state.player;
  combat.punchCooldown = Math.max(0, combat.punchCooldown - dt);
  combat.shootCooldown = Math.max(0, combat.shootCooldown - dt);
  combat.muzzle = Math.max(0, combat.muzzle - dt);
  // Bullets fly straight and die on a hit.
  for (let i = combat.bullets.length - 1; i >= 0; i -= 1) {
    const b = combat.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0;
    for (const enemy of combat.enemies) {
      if (distance(b.x, b.y, enemy.x, enemy.y) < 16) {
        enemy.health -= TUNE.bulletDamage;
        state.hud.hitMark(enemy.x, enemy.y);
        dead = true;
        break;
      }
    }
    if (dead) combat.bullets.splice(i, 1);
  }
  // Gang members close in and swing back.
  for (let i = combat.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = combat.enemies[i];
    if (enemy.health <= 0) {
      combat.enemies.splice(i, 1);
      state.money += 25;
      state.score += 50;
      state.hud.message('Gang member down — $25 taken.', 1.6);
      continue;
    }
    enemy.punchCooldown = Math.max(0, enemy.punchCooldown - dt);
    const d = distance(enemy.x, enemy.y, player.x, player.y);
    if (d < 420 && !player.car) {
      const target = Math.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.angle = target;
      enemy.speed = d > 34 ? 130 : 0;
      enemy.walkPhase += dt * 10;
      enemy.x += Math.cos(target) * enemy.speed * dt;
      enemy.y += Math.sin(target) * enemy.speed * dt;
      if (d < 36 && enemy.punchCooldown <= 0) {
        enemy.punchCooldown = 0.9;
        player.health = Math.max(0, player.health - 12);
        state.hud.shake = 0.3;
        state.audio.punch();
        if (player.health <= 0) state.screen = 'wasted';
      }
    } else {
      enemy.speed = 0;
    }
  }
  // The pistol is bought, once, at the Palms gun shop.
  if (!player.armed && player.x > 2400 && player.y > 900 && player.y < 1500 && state.money >= 200) {
    player.armed = true;
    player.ammo = 24;
    state.money -= 200;
    state.hud.message('Pistol bought — $200. Press F to shoot.', 3);
  }
}

export function drawCombat(ctx, state, cam) {
  const combat = state.combat;
  for (const b of combat.bullets) {
    const sx = b.x - cam.x;
    const sy = b.y - cam.y;
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx - b.vx * 0.012, sy - b.vy * 0.012);
    ctx.lineTo(sx, sy);
    ctx.stroke();
  }
  for (const enemy of combat.enemies) {
    const sx = enemy.x - cam.x;
    const sy = enemy.y - cam.y;
    if (sx < -30 || sy < -30 || sx > cam.w + 30 || sy > cam.h + 30) continue;
    const bob = Math.sin(enemy.walkPhase) * 1.2;
    ctx.fillStyle = 'rgba(60, 30, 10, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx + 2, sy + 7, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a2a2a';
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 4.4, 0, Math.PI * 2);
    ctx.fill();
    // Health bar.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(sx - 12, sy - 20, 24, 4);
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(sx - 12, sy - 20, 24 * (enemy.health / 100), 4);
  }
  // Muzzle flash.
  if (combat.muzzle > 0) {
    const player = state.player;
    const sx = player.x + Math.cos(player.angle) * 22 - cam.x;
    const sy = player.y + Math.sin(player.angle) * 22 - cam.y;
    ctx.fillStyle = 'rgba(255, 230, 120, 0.9)';
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}
