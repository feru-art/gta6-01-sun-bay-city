// Sun Bay traffic: civilian cars that drive the road grid and pedestrians who
// walk the sidewalks. They make the city feel alive and give the chase
// something to weave through. All deterministic from the city seed.
import { WORLD, ROADS, TUNE, makeRng, distance } from './config.js';
import { nearestRoadPoint } from './city.js';

const CAR_COLOURS = ['#c94f4f', '#4f7ac9', '#e8e0c8', '#5a5a5a', '#7ac94f', '#c9a24f', '#8a5ac9', '#4fc9b8', '#d8d8d8', '#3a3a6a'];
const SHIRT_COLOURS = ['#e85d75', '#5d8ae8', '#e8c85d', '#5de88a', '#b85de8', '#e88a5d', '#5dd8e8', '#f2f2f2'];

export function createTraffic(city) {
  const rng = makeRng(777001);
  const cars = [];
  for (let i = 0; i < 26; i += 1) {
    const horizontal = rng() < 0.5;
    const road = horizontal
      ? ROADS.horizontal[Math.floor(rng() * ROADS.horizontal.length)]
      : ROADS.vertical[Math.floor(rng() * ROADS.vertical.length)];
    const along = 100 + rng() * (WORLD.width - 200);
    cars.push({
      x: horizontal ? along : road,
      y: horizontal ? road : along,
      angle: horizontal ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2),
      speed: TUNE.trafficSpeed * (0.8 + rng() * 0.5),
      colour: CAR_COLOURS[Math.floor(rng() * CAR_COLOURS.length)],
      horizontal,
      turnCooldown: 2 + rng() * 6,
      stopped: 0,
    });
  }
  const peds = [];
  for (let i = 0; i < 40; i += 1) {
    const road = ROADS.horizontal[Math.floor(rng() * ROADS.horizontal.length)];
    const side = rng() < 0.5 ? -1 : 1;
    peds.push({
      x: 100 + rng() * (WORLD.width - 200),
      y: road + side * (ROADS.width / 2 + ROADS.sidewalk / 2),
      angle: rng() < 0.5 ? 0 : Math.PI,
      speed: TUNE.pedWalk * (0.7 + rng() * 0.6),
      shirt: SHIRT_COLOURS[Math.floor(rng() * SHIRT_COLOURS.length)],
      panic: 0,
      walkPhase: rng() * Math.PI * 2,
    });
  }
  return { cars, peds };
}

function carAhead(car, others) {
  const lookX = car.x + Math.cos(car.angle) * 70;
  const lookY = car.y + Math.sin(car.angle) * 70;
  for (const o of others) {
    if (o === car) continue;
    if (distance(lookX, lookY, o.x, o.y) < 34) return true;
  }
  return false;
}

export function updateTraffic(traffic, state, dt) {
  const player = state.player;
  // Civilian cars: drive their road, turn at intersections, brake for the
  // car ahead and for the player's car.
  for (const car of traffic.cars) {
    car.turnCooldown -= dt;
    const nearIntersection = ROADS.vertical.some((rx) => Math.abs(car.x - rx) < 40)
      || ROADS.horizontal.some((ry) => Math.abs(car.y - ry) < 40);
    if (nearIntersection && car.turnCooldown <= 0) {
      car.turnCooldown = 4 + Math.random() * 6;
      if (Math.random() < 0.4) {
        car.horizontal = !car.horizontal;
        car.angle = car.horizontal
          ? (Math.random() < 0.5 ? 0 : Math.PI)
          : (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        const snap = nearestRoadPoint(car.x, car.y);
        car.x = snap.x;
        car.y = snap.y;
      }
    }
    const blocked = carAhead(car, traffic.cars)
      || (player.car && distance(car.x + Math.cos(car.angle) * 70, car.y + Math.sin(car.angle) * 70, player.x, player.y) < 40);
    const target = blocked ? 0 : TUNE.trafficSpeed;
    car.speed += (target - car.speed) * Math.min(1, dt * 2.5);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    // Wrap around the city edges so traffic never runs out.
    if (car.x < 100) car.x = WORLD.width - 120;
    if (car.x > WORLD.width - 100) car.x = 120;
    if (car.y < 60) car.y = WORLD.height - 80;
    if (car.y > WORLD.height - 60) car.y = 80;
  }
  // Pedestrians: stroll the sidewalks, scatter when a car barrels at them or
  // a shot rings out.
  for (const ped of traffic.peds) {
    const danger = distance(ped.x, ped.y, player.x, player.y) < 110
      && ((player.car && player.speed > 200) || state.combat.shotsFired > 0);
    if (danger) ped.panic = 2.5;
    ped.panic = Math.max(0, ped.panic - dt);
    const speed = ped.panic > 0 ? TUNE.pedWalk * 2.6 : ped.speed;
    let dir = ped.angle;
    if (ped.panic > 0) {
      // Run away from the player.
      dir = Math.atan2(ped.y - player.y, ped.x - player.x);
      ped.angle = dir;
    }
    ped.x += Math.cos(dir) * speed * dt;
    ped.y += Math.sin(dir) * speed * dt;
    ped.walkPhase += dt * (ped.panic > 0 ? 14 : 7);
    if (ped.x < 130 || ped.x > WORLD.width - 20) ped.angle = Math.PI - ped.angle;
    if (ped.y < 20 || ped.y > WORLD.height - 20) ped.angle = -ped.angle;
    ped.x = Math.max(125, Math.min(WORLD.width - 15, ped.x));
    ped.y = Math.max(15, Math.min(WORLD.height - 15, ped.y));
  }
}

function drawCarBody(ctx, x, y, angle, colour, w, h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(60, 30, 10, 0.3)';
  ctx.fillRect(-w / 2 + 3, -h / 2 + 5, w, h);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(20, 30, 40, 0.85)';
  ctx.beginPath();
  ctx.roundRect(-w * 0.18, -h * 0.36, w * 0.36, h * 0.72, 4);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(w / 2 - 3, -h / 2 + 3, 3, 6);
  ctx.fillRect(w / 2 - 3, h / 2 - 9, 3, 6);
  ctx.fillStyle = '#ff4d4d';
  ctx.fillRect(-w / 2, -h / 2 + 3, 3, 6);
  ctx.fillRect(-w / 2, h / 2 - 9, 3, 6);
  ctx.restore();
}

export function drawTraffic(ctx, traffic, cam) {
  for (const car of traffic.cars) {
    const sx = car.x - cam.x;
    const sy = car.y - cam.y;
    if (sx < -60 || sy < -60 || sx > cam.w + 60 || sy > cam.h + 60) continue;
    drawCarBody(ctx, sx, sy, car.angle, car.colour, 46, 24);
  }
  for (const ped of traffic.peds) {
    const sx = ped.x - cam.x;
    const sy = ped.y - cam.y;
    if (sx < -20 || sy < -20 || sx > cam.w + 20 || sy > cam.h + 20) continue;
    const bob = Math.sin(ped.walkPhase) * 1.5;
    ctx.fillStyle = 'rgba(60, 30, 10, 0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + 2, sy + 5, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ped.shirt;
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.arc(sx, sy + bob - 1, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export { drawCarBody };
