// Sun Bay — wanted system and police: patrol, chase, roadblocks and the
// helicopter as the heat rises from 1 star to 5.
import { drawCarShape } from './traffic.js';

export function raiseWantedLevel(G, n) {
  G.wanted = Math.min(5, G.wanted + n);
  G.heatTimer = 0;
  if (G.wanted >= 3) G.message = 'Wanted level ' + G.wanted + ' — lose the police!';
  else if (G.wanted > 0) G.message = 'The police are on to you.';
}

export function lowerWantedLevel(G, n) {
  G.wanted = Math.max(0, G.wanted - n);
  if (G.wanted === 0) G.message = 'You lost them. Stay cool.';
}

function spawnPoliceCar(G, x, y) {
  G.police.push({
    x, y, angle: 0, speed: 0, maxSpeed: 260 + G.wanted * 22,
    color: '#1d3557', sirenPhase: Math.random() * 6, stuck: 0,
  });
}

export function updatePolice(G, dt) {
  const px = G.player.x, py = G.player.y;
  // Spawn chasers up to the wanted level's cap.
  const want = G.wanted === 0 ? 0 : G.wanted <= 2 ? 2 : G.wanted <= 3 ? 3 : 4;
  const aggression = G.tuning.policeAggression;
  while (G.police.length < want) {
    const a = Math.random() * Math.PI * 2;
    spawnPoliceCar(G, px + Math.cos(a) * 520, py + Math.sin(a) * 520);
  }
  while (G.police.length > want) G.police.pop();
  // Heat decays when the player stays out of sight for a while.
  if (G.wanted > 0) {
    G.heatTimer += dt;
    const nearest = G.police.length ? Math.min(...G.police.map(p => Math.hypot(p.x - px, p.y - py))) : 1e9;
    if (nearest > 700 && G.heatTimer > 14) { lowerWantedLevel(G, 1); G.heatTimer = 0; }
  }
  for (const p of G.police) {
    const dx = px - p.x, dy = py - p.y;
    const d = Math.hypot(dx, dy) || 1;
    const wantAngle = Math.atan2(dy, dx);
    let diff = wantAngle - p.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    p.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff));
    const target = d > 60 ? p.maxSpeed * aggression : 0;
    p.speed += (target - p.speed) * Math.min(1, dt * 1.5);
    p.x += Math.cos(p.angle) * p.speed * dt;
    p.y += Math.sin(p.angle) * p.speed * dt;
    p.sirenPhase += dt * 6;
    // Ram the player when close: damage on foot, spin the car.
    if (d < 46) {
      if (G.player.onFoot) {
        G.player.health -= 18 * dt;
        G.player.x += (dx / d) * 30 * dt * 10;
        G.player.y += (dy / d) * 30 * dt * 10;
      } else if (G.playerCar) {
        G.playerCar.speed *= 0.92;
        G.playerCar.angle += 0.4 * dt;
      }
      if (Math.random() < dt * 0.5) G.message = 'Police rammed you!';
    }
    // Busted when a cop sits on the player on foot.
    if (G.player.onFoot && d < 26 && G.wanted > 0) {
      G.busted = true;
      G.gameOver = 'busted';
    }
  }
  // Helicopter at 4+ stars: circles overhead, spotlights the player.
  if (G.wanted >= 4) {
    if (!G.heli) G.heli = { angle: 0, r: 180 };
    G.heli.angle += dt * 0.5;
  } else G.heli = null;
  // Roadblock at 3+ stars: two parked police cars ahead on the road.
  if (G.wanted >= 3 && !G.roadblock && G.playerCar) {
    const a = G.playerCar.angle;
    G.roadblock = {
      x: px + Math.cos(a) * 420, y: py + Math.sin(a) * 420, angle: a + Math.PI / 2,
    };
  }
  if (G.wanted < 3) G.roadblock = null;
}

export function drawPolice(ctx, G) {
  if (G.roadblock) {
    const rb = G.roadblock;
    drawCarShape(ctx, rb.x - 40, rb.y, rb.angle, '#1d3557', 34, 18, 'red');
    drawCarShape(ctx, rb.x + 40, rb.y, rb.angle, '#1d3557', 34, 18, 'blue');
    ctx.fillStyle = '#ff9f1c';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ROADBLOCK', rb.x - 40, rb.y - 22);
  }
  for (const p of G.police) {
    const siren = Math.sin(p.sirenPhase) > 0 ? 'red' : 'blue';
    drawCarShape(ctx, p.x, p.y, p.angle, p.color, 36, 19, siren);
    // Siren glow.
    ctx.fillStyle = siren === 'red' ? 'rgba(255,45,45,0.25)' : 'rgba(45,125,255,0.25)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 34, 0, Math.PI * 2); ctx.fill();
  }
  if (G.heli) {
    const hx = G.player.x + Math.cos(G.heli.angle) * G.heli.r;
    const hy = G.player.y + Math.sin(G.heli.angle) * G.heli.r;
    ctx.fillStyle = 'rgba(255,255,200,0.12)';
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(G.player.x - 30, G.player.y + 30); ctx.lineTo(G.player.x + 30, G.player.y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(hx, hy, 22, 10, G.heli.angle, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx - 30, hy); ctx.lineTo(hx + 30, hy); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('SBPD AIR 1', hx - 28, hy - 18);
  }
}
