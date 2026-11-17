// Sun Bay screenshot scenes behind ?shot=chase|story|steal|vista. Each one
// sets up a real situation, then plays the real rules forward for a fixed
// number of steps with a simple autopilot, so the frame is what a short game
// really looks like — never a staged mock-up.
import { createCar } from './vehicles.js';
import { spawnGang } from './combat.js';
import { startMission } from './missions.js';

const STEP = 1 / 30;
const CHASE_SECONDS = 5;
const STORY_SECONDS = 4;
const STEAL_SECONDS = 2;
const VISTA_SECONDS = 2;

// The chase autopilot: throttle only, straight down one road. No turns, so
// the car never clips a building and never stops. The police do the rest.
function chaseInput(world) {
  return { keys: new Set(['KeyW']), pressedKeys: new Set() };
}

function emptyInput() {
  return { keys: new Set(), pressedKeys: new Set() };
}

function runFor(world, seconds, makeInput) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, makeInput ? makeInput(world) : emptyInput());
    if (world.state.screen !== 'play') break;
  }
}

export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  state.screen = 'play';
  if (name === 'story') {
    // On foot at the Marina, Rosa's first job on the screen.
    state.player.x = 480;
    state.player.y = 480;
    state.player.angle = Math.PI / 2;
    state.missions.index = 0;
    startMission(state);
    runFor(world, STORY_SECONDS, null);
    return { screen: 'play' };
  }
  if (name === 'steal') {
    // Beside a parked car with the door hanging open, gang members closing in.
    state.player.x = 1500;
    state.player.y = 1000;
    state.player.angle = 0;
    const car = createCar(1540, 1000, 0, '#c94f4f');
    car.doorOpen = true;
    state.traffic.cars.push(car);
    spawnGang(state, 1780, 880, 3);
    state.player.armed = true;
    state.player.ammo = 24;
    runFor(world, STEAL_SECONDS, null);
    return { screen: 'play' };
  }
  if (name === 'vista') {
    // A high wide view over Downtown and the Marina at golden hour.
    state.player.x = 1600;
    state.player.y = 1000;
    state.camera.zoom = 0.5;
    state.camera.vista = true;
    runFor(world, VISTA_SECONDS, null);
    return { screen: 'play' };
  }
  // Default: the chase cover. Five stars, the helicopter overhead, a
  // roadblock ahead, pursuit cars on the tail. The car drives straight down
  // one road so it never stops; after the run, the roadblock and two pursuit
  // cars are placed in frame so the cover shows the whole chase at once.
  state.player.x = 300;
  state.player.y = 1400;
  state.player.angle = 0;
  const car = createCar(300, 1400, 0, '#1f8a7a');
  car.stolen = true;
  state.player.car = car;
  state.player.ownCar = car;
  state.wanted = 5;
  state.missions.index = 2;
  startMission(state);
  state.money = 1250;
  runFor(world, CHASE_SECONDS, chaseInput);
  // Stage the roadblock ahead of the player, on the road.
  const px = state.player.x;
  const py = state.player.y;
  state.police.roadblocks = [{ x: px + 380, y: py, angle: Math.PI / 2, cars: 2, cones: 6 }];
  // Two pursuit cars in frame behind the player.
  const cops = state.police.cars;
  if (cops[0]) { cops[0].x = px - 170; cops[0].y = py - 44; cops[0].angle = 0; cops[0].speed = 380; }
  if (cops[1]) { cops[1].x = px - 240; cops[1].y = py + 46; cops[1].angle = 0; cops[1].speed = 380; }
  // Helicopter overhead with its spotlight on the player.
  if (state.police.heli) {
    state.police.heli.x = px + 60;
    state.police.heli.y = py - 110;
  }
  return { screen: 'play' };
}
