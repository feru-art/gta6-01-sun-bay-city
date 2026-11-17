// Sun Bay missions: the story. Four jobs from Rosa, Marco and Dena that carry
// the player across the city and through the heat levels. Each mission is a
// chain of waypoints with dialogue; finishing one pays and unlocks the next.
import { distance } from './config.js';

export const MISSIONS = [
  {
    id: 'first-wheels',
    name: 'First Wheels',
    giver: 'Rosa',
    briefing: 'Rosa: "Kai, I need wheels. Borrow something quick and meet me at the Marina — no questions."',
    reward: 150,
    steps: [
      { objective: 'Steal a car (press E near one)', need: 'car', x: 0, y: 0, radius: 0 },
      { objective: 'Drive to Rosa at the Marina', need: 'reach', x: 480, y: 420, radius: 70 },
    ],
  },
  {
    id: 'harbor-run',
    name: 'Harbor Run',
    giver: 'Marco',
    briefing: 'Marco: "Package for the Harbor docks. Cops are watching the bridges — keep it smooth."',
    reward: 300,
    steps: [
      { objective: 'Pick up the package in Old Town', need: 'reach', x: 1500, y: 420, radius: 70 },
      { objective: 'Deliver it to the Harbor docks', need: 'reach', x: 2850, y: 300, radius: 80 },
    ],
  },
  {
    id: 'the-getaway',
    name: 'The Getaway',
    giver: 'Dena',
    briefing: 'Dena: "Job went loud. Lose the heat and get to the Southside safehouse — they will not stop at two stars."',
    reward: 500,
    steps: [
      { objective: 'Lose the cops — break line of sight', need: 'heat', heat: 0, x: 0, y: 0, radius: 0 },
      { objective: 'Reach the Southside safehouse', need: 'reach', x: 1600, y: 2050, radius: 80 },
    ],
  },
  {
    id: 'sun-bay-heist',
    name: 'Sun Bay Heist',
    giver: 'Rosa',
    briefing: 'Rosa: "The Downtown vault. One last job, Kai — then we are gone. Expect the whole city to answer."',
    reward: 1000,
    steps: [
      { objective: 'Reach the Downtown vault', need: 'reach', x: 1600, y: 1200, radius: 70 },
      { objective: 'Escape to the Palms marina with the take', need: 'reach', x: 2650, y: 1200, radius: 80 },
    ],
  },
];

export function createMissions() {
  return {
    index: 0,
    step: 0,
    active: true,
    done: false,
    startedAt: 0,
    dialog: '',
    dialogUntil: 0,
  };
}

export function currentMission(missions) {
  if (!missions.active || missions.index >= MISSIONS.length) return null;
  return MISSIONS[missions.index];
}

export function currentStep(missions) {
  const mission = currentMission(missions);
  if (!mission) return null;
  return mission.steps[missions.step] || null;
}

export function startMission(state) {
  const mission = currentMission(state.missions);
  if (!mission) return;
  state.missions.step = 0;
  state.missions.startedAt = state.time;
  state.missions.dialog = mission.briefing;
  state.missions.dialogUntil = state.time + 5.5;
  state.hud.banner(mission.name, mission.giver);
  state.audio.mission();
}

export function updateMissions(state, dt) {
  const missions = state.missions;
  if (!missions.active) return;
  const mission = currentMission(missions);
  if (!mission) {
    missions.active = false;
    missions.done = true;
    state.hud.banner('All missions complete', 'Sun Bay is yours');
    return;
  }
  const step = currentStep(missions);
  if (!step) return;
  const player = state.player;
  let complete = false;
  if (step.need === 'car') {
    complete = !!player.car;
  } else if (step.need === 'reach') {
    complete = distance(player.x, player.y, step.x, step.y) < step.radius;
  } else if (step.need === 'heat') {
    complete = state.wanted <= step.heat;
  }
  if (complete) {
    missions.step += 1;
    state.audio.pickup();
    if (missions.step >= mission.steps.length) {
      // Mission complete: pay out, advance.
      state.money += mission.reward;
      state.score += mission.reward * 2;
      state.hud.banner('Mission complete', `+$${mission.reward} — ${mission.name}`);
      state.hud.message(`$${mission.reward} banked. Next job is waiting.`, 3);
      missions.index += 1;
      missions.step = 0;
      if (missions.index < MISSIONS.length) {
        startMission(state);
      } else {
        missions.active = false;
        missions.done = true;
      }
    } else {
      const next = currentStep(missions);
      state.hud.message(next.objective, 3);
    }
  }
  // Mission 3 opens hot: the job went loud, so the heat starts at 2 stars.
  if (mission.id === 'the-getaway' && missions.step === 0 && state.wanted < 2 && state.time - missions.startedAt > 1) {
    state.wanted = 2;
  }
  // Mission 4 opens hotter: the vault trip draws 3 stars at the vault.
  if (mission.id === 'sun-bay-heist' && missions.step === 1 && state.wanted < 3) {
    state.wanted = 3;
  }
}

export function drawMissionMarkers(ctx, state, cam) {
  const step = currentStep(state.missions);
  if (!step || step.need !== 'reach') return;
  const sx = step.x - cam.x;
  const sy = step.y - cam.y;
  const pulse = 1 + Math.sin(state.time * 4) * 0.15;
  ctx.fillStyle = 'rgba(255, 214, 64, 0.25)';
  ctx.beginPath();
  ctx.arc(sx, sy, step.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd640';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sx, sy, step.radius * pulse, 0, Math.PI * 2);
  ctx.stroke();
  // Waypoint beacon pillar.
  const grad = ctx.createLinearGradient(sx, sy - 120, sx, sy);
  grad.addColorStop(0, 'rgba(255, 214, 64, 0)');
  grad.addColorStop(1, 'rgba(255, 214, 64, 0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(sx - 6, sy - 120, 12, 120);
  ctx.fillStyle = '#ffd640';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 132);
  ctx.lineTo(sx - 9, sy - 112);
  ctx.lineTo(sx + 9, sy - 112);
  ctx.closePath();
  ctx.fill();
}
