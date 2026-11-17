// Sun Bay player: Kai, on foot. Walks, runs, gets in and out of cars, and
// talks to the world through the E key. When Kai is driving, the car owns the
// movement and this module just keeps the body in the seat.
import { TUNE, clamp, distance } from './config.js';
import { clampToWorld } from './city.js';

export function createPlayer(x, y) {
  return {
    x, y,
    angle: -Math.PI / 2,
    speed: 0,
    car: null,
    health: 100,
    armed: false,
    ammo: 0,
    walkPhase: 0,
    enterCooldown: 0,
  };
}

// Nearest drivable car within reach (a parked civilian car or the player's own).
export function nearestCar(state, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const car of state.traffic.cars) {
    const d = distance(state.player.x, state.player.y, car.x, car.y);
    if (d < bestD) { bestD = d; best = car; }
  }
  if (state.player.ownCar) {
    const d = distance(state.player.x, state.player.y, state.player.ownCar.x, state.player.ownCar.y);
    if (d < bestD) { bestD = d; best = state.player.ownCar; }
  }
  return best;
}

export function updatePlayer(state, dt, input) {
  const player = state.player;
  player.enterCooldown = Math.max(0, player.enterCooldown - dt);

  // Driving: the car module moves the body; the player just rides.
  if (player.car) {
    player.x = player.car.x;
    player.y = player.car.y;
    player.angle = player.car.angle;
    player.speed = Math.abs(player.car.speed);
    if (input.pressed('KeyE') && player.enterCooldown <= 0) {
      // Step out beside the car.
      const out = player.car;
      player.car = null;
      player.enterCooldown = 0.6;
      player.x = out.x + Math.cos(out.angle + Math.PI / 2) * 34;
      player.y = out.y + Math.sin(out.angle + Math.PI / 2) * 34;
      player.speed = 0;
      state.audio.door();
    }
    return;
  }

  // On foot: WASD / arrows, Shift to run.
  let mx = 0;
  let my = 0;
  if (input.down('KeyW') || input.down('ArrowUp')) my -= 1;
  if (input.down('KeyS') || input.down('ArrowDown')) my += 1;
  if (input.down('KeyA') || input.down('ArrowLeft')) mx -= 1;
  if (input.down('KeyD') || input.down('ArrowRight')) mx += 1;
  const running = input.down('ShiftLeft') || input.down('ShiftRight');
  const target = running ? TUNE.playerRun : TUNE.playerWalk;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    player.angle = Math.atan2(my, mx);
    player.speed += (target - player.speed) * Math.min(1, dt * 10);
    player.walkPhase += dt * (running ? 13 : 8);
  } else {
    player.speed += (0 - player.speed) * Math.min(1, dt * 10);
  }
  player.x += Math.cos(player.angle) * player.speed * dt;
  player.y += Math.sin(player.angle) * player.speed * dt;
  const clamped = clampToWorld(player.x, player.y, 12);
  player.x = clamped.x;
  player.y = clamped.y;

  // Enter a nearby car.
  if (input.pressed('KeyE') && player.enterCooldown <= 0) {
    const car = nearestCar(state, 52);
    if (car) {
      player.car = car;
      player.enterCooldown = 0.6;
      state.audio.door();
      // Taking a stranger's car is a crime: the heat notices.
      if (car !== state.player.ownCar && !car.stolen) {
        car.stolen = true;
        state.audio.alarm();
      }
    }
  }
}

export function drawPlayer(ctx, player, cam) {
  if (player.car) return; // The car drawing carries the driver.
  const sx = player.x - cam.x;
  const sy = player.y - cam.y;
  if (sx < -30 || sy < -30 || sx > cam.w + 30 || sy > cam.h + 30) return;
  const bob = Math.sin(player.walkPhase) * 1.2;
  ctx.fillStyle = 'rgba(60, 30, 10, 0.35)';
  ctx.beginPath();
  ctx.ellipse(sx + 2, sy + 7, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs (two feet stepping).
  const step = Math.sin(player.walkPhase) * 4;
  ctx.fillStyle = '#2a3a5a';
  ctx.beginPath();
  ctx.arc(sx + Math.cos(player.angle + Math.PI / 2) * 4 - Math.cos(player.angle) * step, sy + Math.sin(player.angle + Math.PI / 2) * 4 - Math.sin(player.angle) * step, 3.4, 0, Math.PI * 2);
  ctx.arc(sx - Math.cos(player.angle + Math.PI / 2) * 4 + Math.cos(player.angle) * step, sy - Math.sin(player.angle + Math.PI / 2) * 4 + Math.sin(player.angle) * step, 3.4, 0, Math.PI * 2);
  ctx.fill();
  // Jacket (Kai's teal jacket) and head.
  ctx.fillStyle = '#1f8a7a';
  ctx.beginPath();
  ctx.arc(sx, sy + bob, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c39a';
  ctx.beginPath();
  ctx.arc(sx, sy + bob, 4.6, 0, Math.PI * 2);
  ctx.fill();
  // Facing tick.
  ctx.strokeStyle = '#1f8a7a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx, sy + bob);
  ctx.lineTo(sx + Math.cos(player.angle) * 13, sy + bob + Math.sin(player.angle) * 13);
  ctx.stroke();
}
