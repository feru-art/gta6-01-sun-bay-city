// Marisol — cars: arcade driving physics, the parked fleet, and the
// top-down car drawing with headlights and brake lights.

import { TUNING, clamp, mulberry32 } from './config.js';
import { nearestRoad } from './city.js';

const PAINT = ['#d64545', '#3f7fd1', '#e8c33c', '#4caf7d', '#c9c9c9', '#7a5fd0', '#e07b39', '#2f9e8f'];

export function makeCar(x, y, angle, kind) {
  return {
    x, y, angle, speed: 0, kind: kind || 'sedan',
    color: PAINT[Math.floor(Math.random() * PAINT.length)],
    driver: null, siren: false, wrecked: false, honk: 0,
  };
}

export function spawnParked(city) {
  const rng = mulberry32(777);
  const cars = [];
  const spots = [
    [1000, 1450], [2200, 900], [3400, 2000], [4000, 350], [1600, 2550],
    [2800, 3100], [400, 2000], [2200, 2550], [3400, 900], [1000, 3100],
    [4400, 1450], [1600, 350], [2800, 1450], [400, 900], [2200, 3100],
  ];
  for (const [x, y] of spots) {
    const c = makeCar(x + (rng() - 0.5) * 30, y + (rng() - 0.5) * 30,
      rng() > 0.5 ? 0 : Math.PI / 2, rng() > 0.8 ? 'sport' : 'sedan');
    cars.push(c);
  }
  // A taxi waiting at the rank.
  const taxi = makeCar(1600, 900, 0, 'taxi');
  taxi.color = '#f5c518';
  cars.push(taxi);
  return cars;
}

// Arcade driving: throttle/brake along the heading, steering that bites
// harder at speed, and a handbrake that kills grip for slides.
export function driveCar(car, input, dt) {
  const top = car.kind === 'sport' ? TUNING.carMax * 1.25 : TUNING.carMax;
  if (input.throttle > 0) car.speed += TUNING.carAccel * input.throttle * dt;
  if (input.brake > 0) {
    car.speed -= (car.speed > 0 ? TUNING.carBrake : TUNING.carAccel * 0.6) * input.brake * dt;
  }
  if (input.handbrake) car.speed *= Math.max(0, 1 - 2.2 * dt);
  car.speed *= Math.max(0, 1 - 0.35 * dt);
  car.speed = clamp(car.speed, -TUNING.carReverse, top);
  const steer = input.steer * clamp(Math.abs(car.speed) / 120, 0, 1) * (car.speed < 0 ? -1 : 1);
  car.angle += steer * 2.4 * dt * (input.handbrake ? 1.6 : 1);
  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
  car.x = clamp(car.x, 20, 4500); car.y = clamp(car.y, 20, 3580);
}

export function pushOutOfBuildings(car, solids) {
  for (const b of solids) {
    const cx = clamp(car.x, b.x, b.x + b.w);
    const cy = clamp(car.y, b.y, b.y + b.h);
    const dx = car.x - cx, dy = car.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < 22 && d > 0.01) {
      car.x = cx + (dx / d) * 22;
      car.y = cy + (dy / d) * 22;
      car.speed *= 0.35;
    }
  }
}

export function drawCar(ctx, c, night) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-24, -10, 48, 22);
  const len = c.kind === 'truck' ? 56 : 46;
  const wid = c.kind === 'truck' ? 24 : 20;
  ctx.fillStyle = c.kind === 'police' ? '#1d3557' : c.color;
  ctx.beginPath();
  ctx.roundRect(-len / 2, -wid / 2, len, wid, 6);
  ctx.fill();
  if (c.kind === 'police') {
    ctx.fillStyle = '#f1faee';
    ctx.fillRect(-8, -wid / 2, 16, wid);
    ctx.fillStyle = c.siren && Math.floor(performance.now() / 300) % 2 === 0 ? '#ff1744' : '#2979ff';
    ctx.fillRect(-4, -wid / 2 - 3, 8, 5);
  }
  // Windshield + rear window.
  ctx.fillStyle = 'rgba(200,230,255,0.85)';
  ctx.fillRect(len / 2 - 16, -wid / 2 + 3, 8, wid - 6);
  ctx.fillRect(-len / 2 + 6, -wid / 2 + 3, 8, wid - 6);
  if (c.kind === 'taxi') {
    ctx.fillStyle = '#111';
    ctx.fillRect(-6, -3, 12, 6);
  }
  // Headlights at night, brake lights when slowing.
  if (night) {
    ctx.fillStyle = 'rgba(255,244,170,0.9)';
    ctx.fillRect(len / 2 - 2, -wid / 2 + 1, 3, 4);
    ctx.fillRect(len / 2 - 2, wid / 2 - 5, 3, 4);
  }
  ctx.restore();
}
