// Marisol — screenshot staging: each shot sets up one dense, readable
// scene (chase, story, shop, vista), simulates it briefly, and freezes it
// for the headless browser to capture.

import { makeCar } from './vehicles.js';
import { startMission } from './missions.js';
import { addHeat } from './police.js';
import { spawnGang } from './combat.js';

function armStep(S, step) {
  if (step.heat) addHeat(S.police, step.heat);
  if (step.type === 'fight') spawnGang(S.combat, step.x, step.y, step.foes);
}

export function stageShot(S, n) {
  S.shot = n;
  const p = S.player;
  S.camera.zoom = 1;
  S.camera.fixed = false;
  if (n === 1) {
    // COVER: night rain chase, 5 stars, heli, roadblock, Neon Tide.
    S.clock.minutes = 21 * 60 + 35;
    S.clock.weather = 'rain';
    p.money = 1050;
    p.hp = 78;
    p.x = 1800; p.y = 2000;
    const car = makeCar(1800, 2000, 0, 'sport');
    car.driver = 'player';
    car.speed = 430;
    car.color = '#e8c33c';
    S.cars.push(car);
    p.car = car;
    S.missions.idx = 5;
    startMission(S.missions, (mis, step) => armStep(S, step));
    S.missions.dialogTimer = 0;
    S.police.roadblock = { x: 2950, y: 2000, vertical: false };
    S.police.spikes = { x: 2830, y: 2000 };
    // The helicopter hovers in frame from the start, spotlight on the chase.
    // Staged ahead of the player's path: the car drives east into the shot.
    S.police.heli = { x: 2650, y: 1820, angle: 0.4, rotor: 0 };
    // Three pursuit cars staged along the chase line.
    const spots = [[2240, 1952], [2310, 2052], [2720, 1956]];
    for (const [x, y] of spots) {
      const cop = makeCar(x, y, 0, 'police');
      cop.driver = 'cop';
      cop.siren = true;
      cop.speed = 480;
      cop.color = '#1d3557';
      S.police.cops.push(cop);
    }
    S.camera.x = p.x; S.camera.y = p.y;
  } else if (n === 2) {
    // STORY: daylight dialogue with Mira at Harborfront, First Fare.
    S.clock.minutes = 10 * 60 + 5;
    S.clock.weather = 'sun';
    p.x = 3100; p.y = 660;
    p.angle = -Math.PI / 2;
    p.money = 350;
    const taxi = makeCar(3040, 720, Math.PI / 2, 'taxi');
    taxi.color = '#f5c518';
    S.cars.push(taxi);
    S.missions.idx = 0;
    startMission(S.missions, (mis, step) => armStep(S, step));
    S.missions.dialogTimer = 99;
    S.camera.x = p.x; S.camera.y = p.y;
  } else if (n === 3) {
    // SHOP: the car dealer, Veloce GT on offer, cash in hand.
    S.clock.minutes = 14 * 60 + 20;
    S.clock.weather = 'sun';
    p.x = 2500; p.y = 1800;
    p.angle = -Math.PI / 2;
    p.money = 3200;
    const gt = makeCar(2420, 1720, 0, 'sport');
    gt.color = '#d64545';
    S.cars.push(gt);
    S.missions.idx = 1;
    startMission(S.missions, (mis, step) => armStep(S, step));
    S.missions.dialogTimer = 0;
    S.econ.shopOpen = 'cars';
    S.camera.x = p.x; S.camera.y = p.y;
  } else if (n === 4) {
    // VISTA: the whole city at dusk from above, five districts in frame.
    S.clock.minutes = 18 * 60 + 45;
    S.clock.weather = 'sun';
    p.x = 2200; p.y = 2000;
    const car = makeCar(2200, 2000, 0, 'sedan');
    car.driver = 'player';
    car.speed = 200;
    car.color = '#3f7fd1';
    S.cars.push(car);
    p.car = car;
    S.missions.idx = 2;
    startMission(S.missions, (mis, step) => armStep(S, step));
    S.missions.dialogTimer = 0;
    S.camera.x = 2750; S.camera.y = 1800;
    S.camera.zoom = 0.35;
    S.camera.fixed = true;
  }
}
