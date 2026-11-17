// Sun Bay — missions and story: a chain of objectives with waypoints,
// NPC dialogue, rewards, and variant extras (races, deliveries, shops).
export const STORY = {
  chase: [
    { id: 'meet', title: 'Meet Rosa', text: 'Drive to Rosa at Marina Pier.', target: { x: 260, y: 620 }, kind: 'goto', reward: 150 },
    { id: 'lift', title: 'Borrow a ride', text: 'Take any car and reach the Old Town garage.', target: { x: 820, y: 320 }, kind: 'goto', reward: 250 },
    { id: 'escape', title: 'Lose the heat', text: 'Escape the police — stay out of sight for 42 seconds.', target: null, kind: 'escape', seconds: 42, reward: 500 },
    { id: 'deliver', title: 'Sunset delivery', text: 'Deliver the package to Harbor View Park.', target: { x: 2100, y: 620 }, kind: 'goto', reward: 400 },
  ],
  story: [
    { id: 'rosa', title: 'Rosa: The Call', text: 'Rosa: "Kai, the Harbor crew took my brother\'s boat. Find Marco."', target: { x: 260, y: 620 }, kind: 'talk', npc: 'Rosa', reward: 100 },
    { id: 'marco', title: 'Marco: The Debt', text: 'Marco: "Tell Dena I will pay — but the garage job comes first."', target: { x: 820, y: 320 }, kind: 'talk', npc: 'Marco', reward: 200 },
    { id: 'dena', title: 'Dena: The Choice', text: 'Dena: "Help me move this cargo, or walk away from Sun Bay forever."', target: { x: 2100, y: 620 }, kind: 'choice', npc: 'Dena', reward: 350 },
    { id: 'finale', title: 'Sunset Run', text: 'Outrun the Harbor crew to Sunset Beach before dawn breaks.', target: { x: 300, y: 1550 }, kind: 'race', reward: 800 },
  ],
  heat: [
    { id: 'heat1', title: 'One star', text: 'Bump a parked car — feel the patrol respond.', target: { x: 820, y: 620 }, kind: 'goto', reward: 100 },
    { id: 'heat3', title: 'Three stars', text: 'Steal a car in Downtown and hold the chase.', target: { x: 1500, y: 620 }, kind: 'steal', reward: 300 },
    { id: 'heat5', title: 'Five stars', text: 'Survive the full heat: roadblocks, spikes and the helicopter.', target: null, kind: 'survive', seconds: 45, reward: 900 },
    { id: 'cooldown', title: 'Cool off', text: 'Lose every star and park at Hillside.', target: { x: 1200, y: 1500 }, kind: 'goto', reward: 500 },
  ],
  golden: [
    { id: 'golden1', title: 'Golden hour', text: 'Cruise the Marina as the sun drops.', target: { x: 300, y: 900 }, kind: 'goto', reward: 150 },
    { id: 'golden2', title: 'Old Town lights', text: 'Reach Old Town as the street lamps come on.', target: { x: 900, y: 300 }, kind: 'goto', reward: 250 },
    { id: 'golden3', title: 'Downtown skyline', text: 'Photograph the skyline from Harbor View Park.', target: { x: 2100, y: 620 }, kind: 'goto', reward: 400 },
    { id: 'golden4', title: 'Sunset Beach', text: 'End the day where the city meets the sea.', target: { x: 300, y: 1550 }, kind: 'goto', reward: 600 },
  ],
  sandbox: [
    { id: 'race', title: 'Street race', text: 'Beat the rival coupe to Harbor View Park.', target: { x: 2100, y: 620 }, kind: 'race', reward: 600 },
    { id: 'parcel', title: 'Parcel run', text: 'Deliver three parcels across Sun Bay.', target: { x: 1500, y: 900 }, kind: 'goto', reward: 300 },
    { id: 'shop', title: 'Tool up', text: 'Buy a pistol at the Harbor gun shop.', target: { x: 2200, y: 900 }, kind: 'shop', reward: 0 },
    { id: 'collect', title: 'Sun coins', text: 'Collect 5 sun coins hidden around the city.', target: null, kind: 'collect', count: 5, reward: 500 },
  ],
};

export const NPCS = [
  { name: 'Rosa', x: 260, y: 620, color: '#e07a5f', line: 'Kai! Over here — the boat is gone.' },
  { name: 'Marco', x: 820, y: 320, color: '#2e86ab', line: 'The garage job pays double tonight.' },
  { name: 'Dena', x: 2100, y: 620, color: '#8e44ad', line: 'Cargo moves at sunset. Are you in?' },
];

export function currentMission(G) {
  const list = STORY[G.variant] || STORY.chase;
  return list[Math.min(G.missionIndex, list.length - 1)];
}

export function missionDone(G) {
  const list = STORY[G.variant] || STORY.chase;
  return G.missionIndex >= list.length;
}

export function startMission(G, index) {
  G.missionIndex = index;
  G.missionTimer = 0;
  G.missionProgress = 0;
  const m = currentMission(G);
  G.message = m.title + ' — ' + m.text;
  if (m.kind === 'escape' || m.kind === 'survive') {
    if (m.kind === 'escape') G.escapeLeft = m.seconds;
    if (m.kind === 'survive') { G.wanted = 5; G.escapeLeft = m.seconds; }
  }
  if (m.kind === 'collect') spawnSunCoins(G);
  if (m.kind === 'race') G.raceRival = { x: G.player.x + 60, y: G.player.y, angle: 0, speed: 0 };
}

export function spawnSunCoins(G) {
  const spots = [[450, 450], [1050, 750], [1650, 450], [750, 1350], [1950, 1350], [250, 1500], [2250, 300]];
  G.coins = spots.map(([x, y]) => ({ x, y, taken: false }));
}

export function completeMission(G) {
  const m = currentMission(G);
  G.cash += m.reward;
  G.score += m.reward;
  G.message = 'Mission complete: ' + m.title + '  +$' + m.reward;
  G.missionIndex++;
  if (!missionDone(G)) startMission(G, G.missionIndex);
  else G.message = 'All missions done — Sun Bay is yours. Free roam!';
}

export function updateMissions(G, dt) {
  if (missionDone(G) || G.gameOver) return;
  const m = currentMission(G);
  G.missionTimer += dt;
  const px = G.player.x, py = G.player.y;
  if (m.kind === 'goto' || m.kind === 'talk' || m.kind === 'choice' || m.kind === 'shop' || m.kind === 'race') {
    if (m.target && Math.hypot(px - m.target.x, py - m.target.y) < 70) {
      if (m.kind === 'shop') {
        if (G.cash >= 200 && !G.hasGun) { G.cash -= 200; G.hasGun = true; G.message = 'Bought a pistol — $200.'; completeMission(G); }
        else if (G.hasGun) completeMission(G);
        else G.message = 'Pistol costs $200 — earn more first.';
      } else if (m.kind === 'talk' || m.kind === 'choice') {
        G.dialog = { npc: m.npc, text: (NPCS.find(n => n.name === m.npc) || {}).line || m.text, until: G.time + 4 };
        completeMission(G);
      } else completeMission(G);
    }
  } else if (m.kind === 'escape') {
    const near = G.police.length && Math.min(...G.police.map(p => Math.hypot(p.x - px, p.y - py))) < 500;
    if (!near && G.wanted > 0) G.escapeLeft -= dt;
    if (G.escapeLeft <= 0) { G.wanted = 0; G.police = []; completeMission(G); }
  } else if (m.kind === 'survive') {
    G.escapeLeft -= dt;
    if (G.escapeLeft <= 0) completeMission(G);
  } else if (m.kind === 'steal') {
    if (!G.player.onFoot && G.playerCar && G.playerCar.stolen) completeMission(G);
  } else if (m.kind === 'collect') {
    for (const c of G.coins || []) {
      if (!c.taken && Math.hypot(px - c.x, py - c.y) < 40) {
        c.taken = true; G.missionProgress++;
        G.message = 'Sun coin ' + G.missionProgress + '/' + m.count;
      }
    }
    if (G.missionProgress >= m.count) completeMission(G);
  }
  // Escape mission auto-raises heat at start so the chase is real.
  if (m.kind === 'escape' && G.missionTimer < 0.1 && G.wanted < 3) G.wanted = 3;
}
