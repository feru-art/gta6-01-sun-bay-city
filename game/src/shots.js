// Sun Bay — deterministic screenshot staging: ?shot=chase|story|steal|vista
// puts the live game into a composed scene, then fast-forwards the real
// simulation so every screenshot is a genuine render of the running game.
import { createCar } from './vehicles.js';
import { spawnGang } from './combat.js';
import { startMission } from './missions.js';
import { PALETTES } from './config.js';

export function applyShot(G, name) {
  G.started = true;
  G.shot = name;
  if (name === 'chase') {
    // Cover: police chase with wanted 3, mission escape running, downtown.
    G.playerCar = createCar(1500, 750, 0, '#f2c14e');
    G.playerCar.stolen = true;
    G.playerCar.speed = 180;
    G.player.onFoot = false;
    G.player.x = 1500; G.player.y = 750;
    G.wanted = 3;
    G.cash = 1240;
    G.score = 1240;
    G.missionIndex = 2;
    startMission(G, 2);
    G.escapeLeft = 42;
    G.police = [
      { x: 1380, y: 690, angle: 0, speed: 240, maxSpeed: 320, color: '#1d3557', sirenPhase: 0, stuck: 0 },
      { x: 1420, y: 820, angle: 0, speed: 230, maxSpeed: 320, color: '#1d3557', sirenPhase: 2, stuck: 0 },
    ];
    G.traffic = [
      { kind: 'car', x: 1650, y: 728, angle: 0, speed: 90, cur: 90, color: '#3a7bd5', vertical: false, road: 750, w: 34, h: 18 },
      { kind: 'car', x: 1350, y: 772, angle: Math.PI, speed: 80, cur: 80, color: '#d64541', vertical: false, road: 750, w: 34, h: 18 },
    ];
    G.peds = [
      { x: 1560, y: 690, angle: 0, speed: 24, color: '#e74c3c', panic: 0, walkPhase: 1 },
      { x: 1480, y: 810, angle: 2, speed: 22, color: '#3498db', panic: 0, walkPhase: 3 },
      { x: 1620, y: 700, angle: 1, speed: 26, color: '#f1c40f', panic: 0, walkPhase: 2 },
    ];
  } else if (name === 'story') {
    // On foot, walking up to Rosa at Marina Pier (far enough that the
    // mission does not auto-complete during the staging fast-forward).
    G.player.onFoot = true;
    G.player.x = 430; G.player.y = 720;
    G.missionIndex = 0;
    startMission(G, 0);
    G.dialog = { npc: 'Rosa', text: 'Kai! Over here — the boat is gone.', until: 9999 };
    G.cash = 320;
  } else if (name === 'steal') {
    // Stealing a car on the Harbor road while a gang member closes in.
    G.player.onFoot = true;
    G.player.x = 2050; G.player.y = 1025;
    G.hasGun = true;
    G.missionIndex = 1;
    startMission(G, 1);
    G.traffic = [
      { kind: 'car', x: 2130, y: 1050, angle: 0, speed: 0, cur: 0, color: '#8e44ad', vertical: false, road: 1050, w: 34, h: 18 },
    ];
    spawnGang(G, 2200, 1010, 2);
    G.bullets = [{ x: 2090, y: 1035, vx: 400, vy: -100, t: 0.5 }];
    G.cash = 860;
  } else if (name === 'vista') {
    // Golden-hour vista: Downtown skyline from Harbor View Park, on foot.
    G.variant = 'golden';
    G.paletteName = 'golden';
    G.palette = PALETTES.golden;
    G.player.onFoot = true;
    G.player.x = 2050; G.player.y = 560;
    G.missionIndex = 2;
    startMission(G, 2);
    G.cash = 2100;
    G.score = 2100;
  }
  // Fast-forward the real simulation so traffic, peds and police settle.
  for (let i = 0; i < 90; i++) G.step(1 / 60);
}
