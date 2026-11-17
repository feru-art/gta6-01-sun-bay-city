// Sun Bay vehicles: arcade car physics. Acceleration, braking, steering that
// bites harder at speed, a handbrake slide, building collisions and damage
// that smokes, then strands the car. One model serves the player, the police
// and traffic's parked cars.
import { WORLD, TUNE, clamp } from './config.js';
import { drawCarBody } from './traffic.js';

export function createCar(x, y, angle, colour) {
  return {
    x, y, angle,
    speed: 0,
    colour,
    damage: 0,
    stolen: false,
    smoke: 0,
    horn: 0,
  };
}

function hitsBuilding(city, x, y) {
  for (const block of city.blocks) {
    if (block.kind !== 'buildings' || !block.buildings) continue;
    for (const b of block.buildings) {
      if (x > b.x - 8 && x < b.x + b.w + 8 && y > b.y - 8 && y < b.y + b.h + 8) return true;
    }
  }
  return false;
}

export function updateCar(state, car, dt, input) {
  const wrecked = car.damage >= 100;
  // Throttle / brake / reverse.
  if (!wrecked) {
    if (input.down('KeyW') || input.down('ArrowUp')) car.speed += TUNE.carAccel * dt;
    else if (input.down('KeyS') || input.down('ArrowDown')) {
      if (car.speed > 20) car.speed -= TUNE.carBrake * dt;
      else car.speed = Math.max(-140, car.speed - TUNE.carAccel * 0.6 * dt);
    } else {
      car.speed -= car.speed * Math.min(1, dt * 0.7);
    }
  } else {
    car.speed -= car.speed * Math.min(1, dt * 2);
  }
  car.speed = clamp(car.speed, -150, TUNE.carMaxSpeed);
  // Steering: sharper at low speed, steadier at full tilt; handbrake slides.
  const handbrake = input.down('Space');
  const steerInput = (input.down('KeyA') || input.down('ArrowLeft') ? -1 : 0)
    + (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0);
  const grip = handbrake ? 0.45 : TUNE.carGrip;
  const speedFactor = clamp(Math.abs(car.speed) / TUNE.carMaxSpeed, 0.25, 1);
  car.angle += steerInput * TUNE.carTurn * speedFactor * (car.speed >= 0 ? 1 : -1) * dt * (handbrake ? 1.5 : 1);
  // Move, with a building check at the nose.
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const noseX = nx + Math.cos(car.angle) * 24;
  const noseY = ny + Math.sin(car.angle) * 24;
  if (hitsBuilding(state.city, noseX, noseY)) {
    if (Math.abs(car.speed) > 120) {
      car.damage = Math.min(100, car.damage + Math.abs(car.speed) * 0.03);
      state.hud.shake = 0.4;
      state.audio.crash();
    }
    car.speed *= -0.25;
  } else {
    car.x = nx;
    car.y = ny;
  }
  // Water is not drivable: the bay stops the car.
  if (car.x < 190) { car.x = 190; car.speed *= -0.2; }
  car.x = clamp(car.x, 125, WORLD.width - 15);
  car.y = clamp(car.y, 15, WORLD.height - 15);
  // Damage smoke.
  car.smoke = car.damage > 55 ? Math.min(1, (car.damage - 55) / 45) : 0;
  if (input.pressed('KeyH')) {
    car.horn = 0.4;
    state.audio.horn();
  }
  car.horn = Math.max(0, car.horn - dt);
}

export function drawCar(ctx, car, cam, isPlayer) {
  const sx = car.x - cam.x;
  const sy = car.y - cam.y;
  if (sx < -70 || sy < -70 || sx > cam.w + 70 || sy > cam.h + 70) return;
  drawCarBody(ctx, sx, sy, car.angle, car.colour, 48, 25);
  // Damage smoke.
  if (car.smoke > 0) {
    const puffs = 2 + Math.floor(car.smoke * 4);
    for (let i = 0; i < puffs; i += 1) {
      const t = (Date.now() / 300 + i * 1.7) % 1;
      ctx.fillStyle = `rgba(80, 80, 80, ${0.5 * (1 - t) * car.smoke})`;
      ctx.beginPath();
      ctx.arc(sx + Math.cos(car.angle) * 20 - t * 10, sy + Math.sin(car.angle) * 20 - t * 18, 5 + t * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (isPlayer) {
    // A subtle white ring so the player's car reads at a glance.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 32, 20, car.angle, 0, Math.PI * 2);
    ctx.stroke();
  }
}
