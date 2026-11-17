// Sun Bay — vehicles: the player's car, stealing, arcade driving physics
// and damage. A stolen car raises the wanted level, like the genre demands.
import { collideBuildings } from './city.js';
import { drawCarShape } from './traffic.js';
import { raiseWantedLevel } from './police.js';

const CAR_COLORS = ['#d64541', '#3a7bd5', '#f2c14e', '#7bc47f', '#e8e8e8', '#8e44ad'];

export function createCar(x, y, angle, color) {
  return { x, y, angle, speed: 0, color: color || '#f2c14e', damage: 0, stolen: false, w: 36, h: 19 };
}

export function updatePlayerCar(G, dt) {
  const car = G.playerCar;
  if (!car || G.player.onFoot) return;
  const k = G.keys;
  const accel = (k['KeyW'] || k['ArrowUp']) ? 420 : 0;
  const brake = (k['KeyS'] || k['ArrowDown']) ? 520 : 0;
  if (accel) car.speed += accel * dt;
  if (brake) car.speed -= brake * dt * (car.speed > 0 ? 1 : 0.5);
  car.speed *= Math.pow(0.4, dt); // drag
  car.speed = Math.max(-140, Math.min(340, car.speed));
  const steer = (k['KeyA'] || k['ArrowLeft'] ? -1 : 0) + (k['KeyD'] || k['ArrowRight'] ? 1 : 0);
  if (Math.abs(car.speed) > 10) car.angle += steer * 2.4 * dt * Math.sign(car.speed);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const hit = collideBuildings(G.city, nx, ny, 18);
  if (hit) {
    car.speed *= -0.3;
    car.damage = Math.min(100, car.damage + 4);
    G.message = car.damage > 70 ? 'Your car is falling apart!' : 'Careful — the paint!';
  } else {
    car.x = nx; car.y = ny;
  }
  car.x = Math.max(70, Math.min(2530, car.x));
  car.y = Math.max(70, Math.min(1830, car.y));
  G.player.x = car.x;
  G.player.y = car.y;
  G.player.angle = car.angle;
  if (car.damage >= 100) {
    G.message = 'Your car is wrecked — get out!';
    exitCar(G);
  }
  // Handbrake skid marks.
  if (k['Space'] && Math.abs(car.speed) > 100) {
    G.skids.push({ x: car.x, y: car.y, angle: car.angle, t: 3 });
    car.speed *= Math.pow(0.2, dt);
  }
  for (const s of G.skids) s.t -= dt;
  G.skids = G.skids.filter(s => s.t > 0);
}

export function nearestTrafficCar(G, maxDist) {
  let best = null, bd = maxDist;
  for (const c of G.traffic) {
    const d = Math.hypot(c.x - G.player.x, c.y - G.player.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function stealCar(G) {
  const c = nearestTrafficCar(G, 60);
  if (!c) { G.message = 'No car close enough to take.'; return; }
  G.traffic = G.traffic.filter(t => t !== c);
  const car = createCar(c.x, c.y, c.angle, c.color);
  car.stolen = true;
  G.playerCar = car;
  G.player.onFoot = false;
  raiseWantedLevel(G, 1);
  G.message = 'You took a ' + c.color + ' sedan — the owner is calling it in!';
}

export function enterCar(G) {
  if (!G.player.onFoot) return;
  if (G.playerCar && Math.hypot(G.playerCar.x - G.player.x, G.playerCar.y - G.player.y) < 60) {
    G.player.onFoot = false;
    return;
  }
  stealCar(G);
}

export function exitCar(G) {
  if (!G.playerCar) return;
  G.player.onFoot = true;
  const a = G.playerCar.angle + Math.PI / 2;
  G.player.x = G.playerCar.x + Math.cos(a) * 30;
  G.player.y = G.playerCar.y + Math.sin(a) * 30;
}

export function drawPlayerCar(ctx, G) {
  const car = G.playerCar;
  if (!car) return;
  for (const s of G.skids) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * s.t / 3) + ')';
    ctx.fillRect(-14, -9, 28, 3);
    ctx.fillRect(-14, 6, 28, 3);
    ctx.restore();
  }
  drawCarShape(ctx, car.x, car.y, car.angle, car.color, car.w, car.h, null);
  if (car.damage > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(car.x - 10, car.y - 6, 4 + car.damage / 25, 0, Math.PI * 2); ctx.fill();
  }
  // "STOLEN" tag is diegetic: the car's alarm blinks.
  if (car.stolen) {
    ctx.fillStyle = Math.sin(G.time * 8) > 0 ? '#ff2d2d' : '#fff';
    ctx.beginPath(); ctx.arc(car.x, car.y - 12, 3, 0, Math.PI * 2); ctx.fill();
  }
}

export { CAR_COLORS };
