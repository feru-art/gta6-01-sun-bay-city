// Marisol — the story: six chained missions with dialogue, objectives and
// paydays. Each mission is a small state machine over steps: go somewhere,
// do something, get paid.

export const MISSIONS = [
  {
    name: 'First Fare', giver: 'Mira', pay: 150,
    intro: 'Mira: "New in town, Dario? Prove you can drive. Take my cab, pick up a fare at the rank."',
    steps: [
      { type: 'goto', x: 1600, y: 900, text: 'Go to the taxi rank' },
      { type: 'drive', x: 3100, y: 620, text: 'Drop the fare at Harborfront' },
    ],
  },
  {
    name: 'Hot Wheels', giver: 'T-Bone', pay: 300,
    intro: 'T-Bone: "I need a Veloce GT for a buyer. Steal one and bring it to my garage. Quietly."',
    steps: [
      { type: 'steal', text: 'Steal any car (press E beside one)' },
      { type: 'goto', x: 700, y: 2300, text: 'Deliver the car to T-Bone\'s garage', inCar: true },
    ],
  },
  {
    name: 'Night Run', giver: 'Mira', pay: 500,
    intro: 'Mira: "A package needs to reach Dockside by midnight. The cops are watching the bridges — go fast."',
    steps: [
      { type: 'goto', x: 2000, y: 2900, text: 'Collect the package from Sofia' },
      { type: 'goto', x: 4200, y: 1700, text: 'Deliver it to Eddie at Dockside', inCar: true },
    ],
  },
  {
    name: 'The Getaway', giver: 'Sofia', pay: 700,
    intro: 'Sofia: "The club job went loud. Lose the heat and get to the safehouse — they will not stop at two stars."',
    steps: [
      { type: 'escape', text: 'Lose the cops — break line of sight', heat: 30 },
      { type: 'goto', x: 3700, y: 2800, text: 'Reach the safehouse', inCar: true },
    ],
  },
  {
    name: 'Harbor Heist', giver: 'Eddie', pay: 1000,
    intro: 'Eddie: "The warehouse guards the good stuff. Clear them out, grab the crate, and bring it to me."',
    steps: [
      { type: 'fight', x: 4300, y: 1200, foes: 4, text: 'Clear the warehouse guards' },
      { type: 'goto', x: 4200, y: 1700, text: 'Bring the crate to Eddie' },
    ],
  },
  {
    name: 'Neon Tide', giver: 'Mira', pay: 2000,
    intro: 'Mira: "Last job, Dario. The whole city is coming for you — outrun them all and vanish into the tide."',
    steps: [
      { type: 'escape', text: 'Outrun the 5-star manhunt', heat: 95 },
      { type: 'goto', x: 3700, y: 2800, text: 'Vanish at the safehouse', inCar: true },
    ],
  },
];

export function makeMissions() {
  return { idx: 0, step: 0, active: false, done: false, dialog: null, dialogTimer: 0, flash: 0 };
}

export function currentMission(m) {
  return m.idx < MISSIONS.length ? MISSIONS[m.idx] : null;
}

export function currentStep(m) {
  const mis = currentMission(m);
  return mis ? mis.steps[m.step] : null;
}

export function startMission(m, onStart) {
  const mis = currentMission(m);
  if (!mis) return;
  m.active = true;
  m.step = 0;
  m.dialog = mis.intro;
  m.dialogTimer = 7;
  onStart && onStart(mis, mis.steps[0]);
}

export function advanceStep(m, onStep) {
  const mis = currentMission(m);
  m.step += 1;
  if (m.step >= mis.steps.length) {
    m.active = false;
    m.idx += 1;
    m.flash = 2.5;
    if (m.idx >= MISSIONS.length) m.done = true;
    return { completed: mis, next: currentMission(m) };
  }
  const step = mis.steps[m.step];
  onStep && onStep(mis, step);
  return { completed: null, next: mis };
}

export function objectiveText(m) {
  if (m.done) return 'All missions complete — Marisol is yours.';
  const mis = currentMission(m);
  if (!mis) return '';
  if (!m.active) return `New mission: ${mis.name} — find ${mis.giver}`;
  const step = currentStep(m);
  return `${mis.name} — ${step ? step.text : ''}`;
}

// Step completion checks run each frame from main.js.
export function stepReached(m, player, combat) {
  const step = currentStep(m);
  if (!step || !m.active) return false;
  if (step.type === 'goto' || step.type === 'drive') {
    if (step.inCar && !player.car) return false;
    return Math.hypot(player.x - step.x, player.y - step.y) < 90;
  }
  if (step.type === 'steal') return !!player.car;
  if (step.type === 'fight') return combat.foes.every((f) => f.dead);
  if (step.type === 'escape') return false; // handled by the wanted system
  return false;
}
