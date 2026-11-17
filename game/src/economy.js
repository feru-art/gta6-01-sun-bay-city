// Marisol — money and what it buys: the gun shop, the car dealer and the
// safehouse. Spending is the progression that rewards play.

export const SHOP_ITEMS = {
  guns: [
    { id: 'pistol', name: 'Pistol', price: 200, desc: 'Reliable sidearm. 34 damage a shot.' },
    { id: 'smg', name: 'SMG', price: 800, desc: 'Full-auto spray. 18 damage, very fast.' },
  ],
  cars: [
    { id: 'sportscar', name: 'Veloce GT', price: 2500, desc: 'The fastest car in Marisol. Spawns at the dealer.' },
    { id: 'truck', name: 'Hauler Truck', price: 1200, desc: 'Slow, but it shrugs off rams.' },
  ],
  property: [
    { id: 'safehouse', name: 'Safehouse', price: 5000, desc: 'Your own place. Saves the game and banks $200 a day.' },
  ],
};

export function makeEconomy() {
  return { owned: {}, shopOpen: null, incomeTimer: 0 };
}

export function openShop(econ, kind) { econ.shopOpen = kind; }
export function closeShop(econ) { econ.shopOpen = null; }

export function buyItem(econ, player, kind, id) {
  const item = SHOP_ITEMS[kind].find((i) => i.id === id);
  if (!item || econ.owned[id]) return { ok: false, why: 'Already owned' };
  if (player.money < item.price) return { ok: false, why: 'Not enough cash' };
  player.money -= item.price;
  econ.owned[id] = true;
  if (id === 'pistol' || id === 'smg') player.weapon = id;
  return { ok: true, item };
}

// The safehouse pays a daily dividend while the player owns it.
export function tickEconomy(econ, player, dt) {
  if (!econ.owned.safehouse) return 0;
  econ.incomeTimer += dt;
  if (econ.incomeTimer > 120) {
    econ.incomeTimer = 0;
    player.money += 200;
    return 200;
  }
  return 0;
}

export function drawShop(ctx, econ, player, w, h) {
  if (!econ.shopOpen) return;
  const kind = econ.shopOpen;
  const items = SHOP_ITEMS[kind];
  const title = kind === 'guns' ? 'AMMU-NATION' : kind === 'cars' ? 'VELOCE MOTORS' : 'MARISOL ESTATES';
  ctx.fillStyle = 'rgba(6, 10, 24, 0.88)';
  ctx.fillRect(w / 2 - 300, h / 2 - 190, 600, 380);
  ctx.strokeStyle = '#fca311';
  ctx.lineWidth = 3;
  ctx.strokeRect(w / 2 - 300, h / 2 - 190, 600, 380);
  ctx.fillStyle = '#ffd9a0';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, h / 2 - 150);
  ctx.fillStyle = '#7fe7ff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Cash: $${player.money}`, w / 2, h / 2 - 118);
  items.forEach((item, i) => {
    const y = h / 2 - 70 + i * 86;
    const owned = !!econ.owned[item.id];
    ctx.fillStyle = owned ? 'rgba(80, 200, 120, 0.25)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(w / 2 - 260, y - 28, 520, 66);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}. ${item.name} — $${item.price}`, w / 2 - 240, y);
    ctx.fillStyle = '#bbb';
    ctx.font = '15px sans-serif';
    ctx.fillText(item.desc, w / 2 - 240, y + 22);
    if (owned) {
      ctx.fillStyle = '#7CFC00';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('OWNED', w / 2 + 240, y);
    }
  });
  ctx.fillStyle = '#ccc';
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Press 1-2 to buy · E or Esc to close', w / 2, h / 2 + 160);
}
