// ===== ДВИЖОК «СЕКТОР НОЛЬ» =====
const SAVE_KEY = 'sector-zero-save-v2';
const BASE_CARRY = 50;
const BELT_SLOTS = 3;

let S = null;        // состояние игры
let tab = 'loc';     // текущая вкладка
let view = null;     // открытый NPC / торговля: { npc, mode }

// ---------- утилиты ----------
const $ = (sel) => document.querySelector(sel);
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const chance = (p) => Math.random() < p;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('ru-RU');

function timeStr(t = S.time) {
  const d = Math.floor(t / 1440) + 1, h = Math.floor(t / 60) % 24, m = t % 60;
  return `День ${d}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function log(text, kind = '') {
  S.log.unshift({ t: timeStr(), text, kind });
  if (S.log.length > 60) S.log.length = 60;
}

// ---------- новая игра / сохранение ----------
function newGame() {
  S = {
    loc: START.loc, hp: 100, rad: 0, food: 100, water: 100, xp: 0, level: 1, money: START.money, time: 8 * 60,
    inv: [], equip: { weapon: null, armor: null, belt: [] }, nextUid: 1,
    quests: {}, flags: {}, kills: {}, log: [], combat: null, stats: { kills: 0, deaths: 0, found: 0 },
  };
  START.inv.forEach(([id, q]) => addItem(id, q));
  for (const slot of ['weapon', 'armor']) {
    const e = S.inv.find((x) => x.id === START.equip[slot]);
    if (e) S.equip[slot] = e.uid;
  }
  log('Двадцать лет назад выпал осадок, и эпицентром стал Сектор Ноль. Ты ушёл из Пустоши за хабаром и очнулся на нарах в бункере «Клён». Кузьмич сказал: «Жить хочешь — работай».', 'sys');
  save();
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* хранилище недоступно */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { S = JSON.parse(raw); return true; }
  } catch (e) { /* повреждённое сохранение */ }
  return false;
}

// ---------- инвентарь ----------
function addItem(id, qty = 1, cond = 100) {
  const it = ITEMS[id];
  if (it.stack) {
    const e = S.inv.find((x) => x.id === id);
    if (e) e.qty += qty; else S.inv.push({ uid: S.nextUid++, id, qty, cond: 100 });
  } else {
    for (let i = 0; i < qty; i++) S.inv.push({ uid: S.nextUid++, id, qty: 1, cond });
  }
}

function count(id) {
  return S.inv.filter((x) => x.id === id).reduce((s, x) => s + x.qty, 0);
}

function removeItem(id, qty = 1) {
  for (const e of [...S.inv]) {
    if (qty <= 0) break;
    if (e.id !== id || isEquipped(e.uid)) continue;
    const take = Math.min(e.qty, qty);
    e.qty -= take; qty -= take;
    if (e.qty <= 0) S.inv.splice(S.inv.indexOf(e), 1);
  }
}

function removeEntry(uid) {
  unequip(uid);
  S.inv = S.inv.filter((x) => x.uid !== uid);
}

const entry = (uid) => S.inv.find((x) => x.uid === uid);
const isEquipped = (uid) => S.equip.weapon === uid || S.equip.armor === uid || S.equip.belt.includes(uid);

function unequip(uid) {
  if (S.equip.weapon === uid) S.equip.weapon = null;
  if (S.equip.armor === uid) S.equip.armor = null;
  S.equip.belt = S.equip.belt.filter((u) => u !== uid);
}

function weight() {
  return S.inv.reduce((s, e) => s + ITEMS[e.id].weight * e.qty, 0);
}

function beltEff(key) {
  return S.equip.belt.reduce((s, u) => { const e = entry(u); return s + ((e && ITEMS[e.id].eff[key]) || 0); }, 0);
}

const carryMax = () => BASE_CARRY + beltEff('carry');
const weapon = () => { const e = entry(S.equip.weapon); return e ? { e, it: ITEMS[e.id] } : null; };
const armor = () => { const e = entry(S.equip.armor); return e ? { e, it: ITEMS[e.id] } : null; };

function protection() {
  const a = armor();
  return clamp((a ? a.it.prot * (0.4 + 0.6 * a.e.cond / 100) : 0) + beltEff('prot'), 0, 0.8);
}

function radProtection() {
  const a = armor();
  return a ? a.it.radProt * (0.4 + 0.6 * a.e.cond / 100) : 0;
}

// ---------- время и состояние тела ----------
function tick(minutes, envRad = 0) {
  S.time += minutes;
  const steps = Math.max(1, Math.round(minutes / 10));
  const over = weight() > carryMax();
  S.food = clamp(S.food - steps * (over ? 1.6 : 0.8), 0, 100);
  S.water = clamp(S.water - steps * (over ? 2 : 1.1), 0, 100);
  S.rad = clamp(S.rad + steps * (envRad * (1 - radProtection()) + beltEff('rad')) * 0.5, 0, 100);
  S.hp = clamp(S.hp + steps * beltEff('regen') * 0.5, 0, 100);
  if (S.food <= 0) { S.hp -= steps * 2; if (chance(0.3)) log('Живот сводит от голода. Нужно поесть.', 'bad'); }
  if (S.water <= 0) { S.hp -= steps * 3; if (chance(0.3)) log('Губы потрескались от жажды. Нужна вода.', 'bad'); }
  if (S.rad >= 50) { S.hp -= steps * (S.rad - 40) / 15; if (chance(0.25)) log('Тошнит, в глазах темнеет — радиация.', 'bad'); }
  if (S.hp <= 0) die('Организм не выдержал.');
}

// ---------- опыт и уровни ----------
const levelFromXp = (xp) => 1 + Math.floor(Math.sqrt(xp / 50));
const xpForLevel = (lvl) => 50 * (lvl - 1) ** 2;

function gainXp(n) {
  S.xp += n;
  const lvl = levelFromXp(S.xp);
  if (lvl > S.level) {
    S.level = lvl;
    S.hp = 100;
    log(`⭐ Новый уровень: ${lvl}! Урон +${(lvl - 1) * 3}%, здоровье восстановлено.`, 'good');
  }
}

function die(reason) {
  S.stats.deaths++;
  const lost = Math.floor(S.money * 0.3);
  S.money -= lost;
  S.combat = null;
  S.hp = 40; S.rad = 10; S.food = 70; S.water = 70;
  S.loc = 'bunker'; view = null;
  log(`☠ ${reason} Тебя нашли и дотащили до бункера. Потеряно ${fmt(lost)} кр.`, 'bad');
}

// ---------- перемещение и обыск ----------
function travel(to) {
  const L = LOCATIONS[to];
  if (L.needsFlag && !S.flags[L.needsFlag]) {
    log('Гермодверь заперта кодовым замком. Кто-то в Секторе должен знать код.', 'warn');
    return;
  }
  const over = weight() > carryMax();
  if (weight() > carryMax() * 1.5) { log('Рюкзак неподъёмный. Выброси что-нибудь.', 'warn'); return; }
  S.loc = to; view = null;
  tick(over ? 30 : 15, L.rad || 0);
  if (S.hp <= 0) return;
  log(`Ты пришёл: ${L.name}.`);
  if (L.mutants && chance((L.danger || 0) * 0.4)) startCombat(pick(L.mutants), true);
}

function searchLoc() {
  const L = LOCATIONS[S.loc];
  if (L.safe) { log('В бункере всё давно растащили. Иди в Сектор.'); return; }
  tick(20, L.rad || 0);
  if (S.hp <= 0) return;
  if (L.mutants && chance(L.danger || 0)) { startCombat(pick(L.mutants)); return; }
  if (L.arts) {
    for (const [id, p] of L.arts) {
      if (chance(p)) {
        addItem(id); S.stats.found++; gainXp(25);
        S.rad = clamp(S.rad + rnd(5, 15), 0, 100);
        log(`✨ В аномалии что-то блеснуло… Артефакт: ${ITEMS[id].name}! Дозиметр зашкалил.`, 'good');
        return;
      }
    }
  }
  if (L.loot && chance(0.65)) {
    const total = L.loot.reduce((s, x) => s + x[1], 0);
    let r = Math.random() * total;
    for (const [id, w, max] of L.loot) {
      r -= w;
      if (r <= 0) {
        const q = rnd(1, max); addItem(id, q);
        log(`Находка: ${ITEMS[id].icon} ${ITEMS[id].name}${q > 1 ? ' ×' + q : ''}.`, 'good');
        return;
      }
    }
  }
  log(pick(['Пусто. Только битое стекло и ветер.', 'Ничего полезного не нашлось.', 'Кто-то обчистил это место до тебя.']));
}

function rest() {
  if (!LOCATIONS[S.loc].safe) return;
  if (S.food <= 20 || S.water <= 20) { log('На голодный желудок и с пересохшим горлом не уснёшь.', 'warn'); return; }
  tick(240, 0);
  S.hp = clamp(S.hp + 40, 0, 100);
  log('Ты проспал четыре часа под гул генератора. Силы вернулись.', 'good');
}

// ---------- бой ----------
function startCombat(mid, ambush = false) {
  const m = MUTANTS[mid];
  S.combat = { mid, hp: m.hp, max: m.hp };
  tab = 'loc'; view = null;
  log(`${ambush ? 'Засада! ' : ''}${m.icon} На тебя бросается ${m.name}!`, 'bad');
  if (ambush) enemyTurn();
}

function attack() {
  const c = S.combat; if (!c) return;
  const w = weapon();
  let dmg = 3, acc = 0.9, shots = 1, label = 'кулаком';
  if (w) {
    if (w.it.ammo && count(w.it.ammo) <= 0) {
      const knife = S.inv.find((e) => ITEMS[e.id].type === 'weapon' && !ITEMS[e.id].ammo);
      if (knife) { dmg = ITEMS[knife.id].dmg; acc = ITEMS[knife.id].acc; label = `${ITEMS[knife.id].name}, патроны кончились`; }
      else { dmg = 5; label = 'прикладом, патроны кончились'; }
    } else {
      const f = 0.5 + 0.5 * w.e.cond / 100;
      dmg = w.it.dmg * f; acc = w.it.acc * (0.6 + 0.4 * w.e.cond / 100); shots = w.it.burst || 1;
      label = w.it.name;
      if (w.it.ammo) removeItem(w.it.ammo, Math.min(shots, count(w.it.ammo)));
      w.e.cond = Math.max(0, w.e.cond - (w.it.ammo ? 0.7 : 0.3));
    }
  }
  let total = 0;
  dmg *= 1 + 0.03 * (S.level - 1);
  for (let i = 0; i < shots; i++) if (chance(acc)) total += Math.round(dmg * (0.8 + Math.random() * 0.4));
  if (total > 0) { c.hp -= total; log(`Ты бьёшь (${label}): −${total}.`); }
  else log('Промах!', 'warn');
  if (c.hp <= 0) return win();
  enemyTurn();
}

function enemyTurn() {
  const c = S.combat; if (!c) return;
  const m = MUTANTS[c.mid];
  if (chance(0.15)) { log(`${m.name} промахивается.`); return; }
  const raw = rnd(m.dmg[0], m.dmg[1]);
  const dmg = Math.max(1, Math.round(raw * (1 - protection())));
  S.hp -= dmg;
  if (m.rad) S.rad = clamp(S.rad + m.rad * (1 - radProtection()), 0, 100);
  const a = armor(); if (a) a.e.cond = Math.max(0, a.e.cond - 1);
  log(`${m.icon} ${m.name} атакует: −${dmg} здоровья.`, 'bad');
  if (S.hp <= 0) die(`Тебя убил ${m.name}.`);
}

function win() {
  const m = MUTANTS[S.combat.mid];
  const money = rnd(m.money[0], m.money[1]);
  S.money += money;
  S.kills[S.combat.mid] = (S.kills[S.combat.mid] || 0) + 1;
  S.stats.kills++;
  let msg = `🏆 ${m.name} повержен.`;
  if (money) msg += ` +${money} кр.`;
  const [did, p, max] = m.drop;
  if (chance(p)) { const q = max ? rnd(1, max) : 1; addItem(did, q); msg += ` Трофей: ${ITEMS[did].name}${q > 1 ? ' ×' + q : ''}.`; }
  const xp = Math.round(m.hp / 2);
  msg += ` +${xp} опыта.`;
  S.combat = null;
  log(msg, 'good');
  gainXp(xp);
}

function flee() {
  const c = S.combat; if (!c) return;
  if (MUTANTS[c.mid].boss ? chance(0.3) : chance(0.6)) {
    S.combat = null; tick(10, LOCATIONS[S.loc].rad || 0);
    log('Ты сбежал, сердце колотится как бешеное.', 'warn');
  } else {
    log('Убежать не вышло!', 'bad');
    enemyTurn();
  }
}

// ---------- использование предметов ----------
function useItem(uid) {
  const e = entry(uid); if (!e) return;
  const it = ITEMS[e.id];
  if (it.type === 'weapon') { S.equip.weapon = S.equip.weapon === uid ? null : uid; }
  else if (it.type === 'armor') { S.equip.armor = S.equip.armor === uid ? null : uid; }
  else if (it.type === 'artifact') {
    if (S.equip.belt.includes(uid)) S.equip.belt = S.equip.belt.filter((u) => u !== uid);
    else if (S.equip.belt.length >= BELT_SLOTS) { log(`На поясе только ${BELT_SLOTS} слота.`, 'warn'); return; }
    else S.equip.belt.push(uid);
  } else if (it.type === 'food' || it.type === 'med') {
    if (it.food) S.food = clamp(S.food + it.food, 0, 100);
    if (it.water) S.water = clamp(S.water + it.water, 0, 100);
    if (it.heal) S.hp = clamp(S.hp + it.heal, 0, 100);
    if (it.rad) S.rad = clamp(S.rad + it.rad, 0, 100);
    removeItem(e.id, 1);
    log(`Использовано: ${it.icon} ${it.name}.`);
    if (S.combat) enemyTurn();
  }
}

function dropItem(uid) {
  const e = entry(uid); if (!e) return;
  if (ITEMS[e.id].stack && e.qty > 1) { e.qty--; } else removeEntry(uid);
  log(`Выброшено: ${ITEMS[e.id].name}.`);
}

// ---------- торговля и услуги ----------
const sellPrice = (e) => Math.max(1, Math.round(ITEMS[e.id].price * 0.5 * (ITEMS[e.id].stack ? 1 : e.cond / 100)));

function buy(id, qty) {
  const cost = ITEMS[id].price * qty;
  if (S.money < cost) { log('Не хватает денег.', 'warn'); return; }
  S.money -= cost; addItem(id, qty);
  log(`Куплено: ${ITEMS[id].name}${qty > 1 ? ' ×' + qty : ''} за ${fmt(cost)} кр.`);
}

function sell(uid, all) {
  const e = entry(uid); if (!e || isEquipped(uid)) return;
  const q = all ? e.qty : 1;
  const sum = sellPrice(e) * q;
  S.money += sum;
  if (ITEMS[e.id].stack) removeItem(e.id, q); else removeEntry(uid);
  log(`Продано: ${ITEMS[e.id].name}${q > 1 ? ' ×' + q : ''} за ${fmt(sum)} кр.`);
}

const repairCost = (e) => Math.ceil(ITEMS[e.id].price * 0.4 * (100 - e.cond) / 100);

function repair(uid) {
  const e = entry(uid); const cost = repairCost(e);
  if (S.money < cost) { log('Вера качает головой: «Денег нет — ремонта нет».', 'warn'); return; }
  S.money -= cost; e.cond = 100;
  log(`Вера починила ${ITEMS[e.id].name} за ${fmt(cost)} кр.`, 'good');
}

function treat(kind) {
  const prices = { heal: 200, rad: 350 };
  if (S.money < prices[kind]) { log('Док: «Лечение не бесплатное, уж извини».', 'warn'); return; }
  S.money -= prices[kind];
  if (kind === 'heal') S.hp = 100; else S.rad = 0;
  tick(30, 0);
  log(kind === 'heal' ? 'Док зашил раны и перевязал. Здоровье восстановлено.' : 'Капельница и горькие таблетки — радиация выведена.', 'good');
}

// ---------- квесты ----------
function questState(qid) {
  const st = S.quests[qid];
  const q = QUESTS[qid];
  if (st === 'done') return 'done';
  if (!st) return q.requires && S.quests[q.requires] !== 'done' ? 'locked' : 'new';
  return questReady(qid) ? 'ready' : 'active';
}

function questProgress(qid) {
  const q = QUESTS[qid];
  if (q.type === 'bring') return Math.min(count(q.item), q.qty);
  return Math.min((S.kills[q.target] || 0) - (S.quests[qid].base || 0), q.qty);
}

const questReady = (qid) => questProgress(qid) >= QUESTS[qid].qty;

function takeQuest(qid) {
  const q = QUESTS[qid];
  S.quests[qid] = { base: q.type === 'kill' ? (S.kills[q.target] || 0) : 0 };
  log(`📜 Новое задание: «${q.title}».`, 'sys');
}

function finishQuest(qid) {
  const q = QUESTS[qid];
  if (!questReady(qid)) return;
  if (q.type === 'bring') removeItem(q.item, q.qty);
  S.quests[qid] = 'done';
  S.money += q.reward.money || 0;
  (q.reward.items || []).forEach(([id, n]) => addItem(id, n));
  if (q.reward.flag) S.flags[q.reward.flag] = true;
  const xp = Math.round((q.reward.money || 0) / 4);
  log(`✅ Задание «${q.title}» выполнено. +${fmt(q.reward.money || 0)} кр., +${xp} опыта.`, 'good');
  gainXp(xp);
  if (q.reward.flag === 'coreKey') log('Связист шепчет код от гермодвери корпуса «Полюс»: 0-4-1-1.', 'sys');
  if (q.reward.flag === 'victory') log('🌅 Купол замолчал. Над Сектором впервые за годы — тишина. Ты — легенда Сектора Ноль. (Игру можно продолжать.)', 'good');
}

// ---------- отрисовка ----------
function bar(val, max, cls) {
  return `<div class="bar ${cls}"><i style="width:${clamp(val / max * 100, 0, 100)}%"></i></div>`;
}

function renderStatus() {
  const w = weight(), cm = carryMax();
  $('#status').innerHTML = `
    <div class="stat" title="Здоровье">❤️ <b>${Math.ceil(S.hp)}</b>${bar(S.hp, 100, 'hp')}</div>
    <div class="stat" title="Радиация">☢️ <b>${Math.round(S.rad)}</b>${bar(S.rad, 100, 'rad')}</div>
    <div class="stat" title="Еда">🍖 <b>${Math.round(S.food)}</b>${bar(S.food, 100, 'hun')}</div>
    <div class="stat" title="Вода">💧 <b>${Math.round(S.water)}</b>${bar(S.water, 100, 'wat')}</div>
    <div class="stat" title="Опыт">⭐ <b>ур. ${S.level}</b>${bar(S.xp - xpForLevel(S.level), xpForLevel(S.level + 1) - xpForLevel(S.level), 'xp')}</div>
    <div class="stat" title="Вес рюкзака">🎒 <b class="${w > cm ? 'over' : ''}">${w.toFixed(1)}/${cm}</b></div>
    <div class="stat" title="Крышки">🪙 <b>${fmt(S.money)}</b></div>`;
  $('#clock').textContent = timeStr();
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
}

function renderScene(L) {
  const img = L.img ? `background-image:url('${L.img}')` : `background:radial-gradient(ellipse at 50% 30%, ${L.tone[0]}, ${L.tone[1]})`;
  let inner = `<div class="scene-icon">${L.icon}</div>`;
  if (S.combat) {
    const m = MUTANTS[S.combat.mid];
    inner = `<div class="scene-icon enemy">${m.icon}</div>
      <div class="enemy-box"><b>${m.name}</b>${bar(S.combat.hp, S.combat.max, 'hp')}<small>${Math.max(0, S.combat.hp)} / ${S.combat.max}</small></div>`;
  }
  return `<div class="loc-title"><span>${esc(L.name)}</span><span class="radlvl">☢ ${L.rad || 0}</span></div>
    <div class="scene ${S.combat ? 'fight' : ''}" style="${img}">${inner}</div>`;
}

function renderLoc() {
  const L = LOCATIONS[S.loc];
  let h = renderScene(L);

  if (S.combat) {
    const w = weapon();
    const ammo = w && w.it.ammo ? ` (${count(w.it.ammo)})` : '';
    const meds = S.inv.filter((e) => ITEMS[e.id].type === 'med');
    h += `<div class="actions">
      <button data-act="attack" class="danger">⚔️ Атаковать${ammo}</button>
      <button data-act="flee">🏃 Бежать</button></div>`;
    if (meds.length) h += `<div class="actions">${meds.map((e) => `<button data-act="use" data-uid="${e.uid}">${ITEMS[e.id].icon} ${ITEMS[e.id].name} ×${e.qty}</button>`).join('')}</div>`;
  } else if (view) {
    h += renderNpc(view.npc);
  } else {
    h += `<p class="desc">${esc(L.desc)}</p><div class="actions">`;
    if (!L.safe) h += `<button data-act="search">🔍 Обыскать (20 мин)</button>`;
    if (L.safe) h += `<button data-act="rest">💤 Отдохнуть (4 ч)</button>`;
    h += `</div>`;
    (L.npcs || []).forEach((n) => {
      const npc = NPCS[n];
      const mark = npc.quests.some((q) => ['new', 'ready'].includes(questState(q))) ? ' <span class="qmark">!</span>' : '';
      h += `<div class="row link" data-act="npc" data-id="${n}">${npc.icon} ${npc.name}${mark}</div>`;
    });
    Object.entries(L.exits).forEach(([label, to]) => {
      const lock = LOCATIONS[to].needsFlag && !S.flags[LOCATIONS[to].needsFlag] ? ' 🔒' : '';
      h += `<div class="row link exit" data-act="go" data-id="${to}">${esc(label)}${lock}</div>`;
    });
  }
  h += `<div class="sect">Журнал событий</div><div class="log">${S.log.map((l) => `<div class="msg ${l.kind}"><time>${l.t.split(', ')[1]}</time> ${esc(l.text)}</div>`).join('')}</div>`;
  return h;
}

function renderNpc(id) {
  const npc = NPCS[id];
  let h = `<div class="npc-head">${npc.icon} <b>${npc.name}</b></div><p class="desc">«${esc(npc.hello)}»</p>`;
  const mode = view.mode;
  h += `<div class="actions">`;
  if (npc.role === 'trader') h += `<button data-act="mode" data-id="buy">🛒 Купить</button><button data-act="mode" data-id="sell">💰 Продать</button>`;
  if (npc.role === 'mechanic') h += `<button data-act="mode" data-id="repair">🔧 Ремонт</button>`;
  if (npc.role === 'doctor') h += `<button data-act="treat" data-id="heal">❤️ Лечить (200)</button><button data-act="treat" data-id="rad">☢️ Вывести радиацию (350)</button>`;
  h += `<button data-act="mode" data-id="quests">📜 Задания</button><button data-act="close">↩ Уйти</button></div>`;

  if (mode === 'buy') {
    h += npc.stock.map((iid) => {
      const it = ITEMS[iid]; const q = it.type === 'ammo' ? 10 : 1;
      return `<div class="item"><span class="ic">${it.icon}</span><div class="nm">${it.name}${q > 1 ? ' ×' + q : ''}<small>${itemInfo(it)}</small></div>
        <button data-act="buy" data-id="${iid}" data-q="${q}">${fmt(it.price * q)} кр.</button></div>`;
    }).join('');
  } else if (mode === 'sell') {
    const list = S.inv.filter((e) => !isEquipped(e.uid));
    h += list.length ? list.map((e) => {
      const it = ITEMS[e.id];
      return `<div class="item"><span class="ic">${it.icon}</span><div class="nm">${it.name}${e.qty > 1 ? ' ×' + e.qty : ''}<small>${it.stack ? '' : 'сост. ' + Math.round(e.cond) + '%'}</small></div>
        <button data-act="sell" data-uid="${e.uid}">${fmt(sellPrice(e))} кр.</button>${e.qty > 1 ? `<button data-act="sellall" data-uid="${e.uid}">все</button>` : ''}</div>`;
    }).join('') : '<p class="desc">Продавать нечего (надетое не продаётся).</p>';
  } else if (mode === 'repair') {
    const list = S.inv.filter((e) => ['weapon', 'armor'].includes(ITEMS[e.id].type) && e.cond < 100);
    h += list.length ? list.map((e) => `<div class="item"><span class="ic">${ITEMS[e.id].icon}</span><div class="nm">${ITEMS[e.id].name}<small>сост. ${Math.round(e.cond)}%</small></div>
        <button data-act="repair" data-uid="${e.uid}">${fmt(repairCost(e))} кр.</button></div>`).join('') : '<p class="desc">Всё снаряжение в порядке.</p>';
  } else if (mode === 'quests') {
    h += npc.quests.map((qid) => {
      const q = QUESTS[qid], st = questState(qid);
      if (st === 'locked') return '';
      let btn = '';
      if (st === 'new') btn = `<button data-act="take" data-id="${qid}">Взять</button>`;
      if (st === 'ready') btn = `<button data-act="finish" data-id="${qid}" class="good">Сдать</button>`;
      const prog = st === 'active' || st === 'ready' ? ` <small>(${questProgress(qid)}/${q.qty})</small>` : '';
      return `<div class="quest ${st}"><b>${q.title}</b>${prog}${st === 'done' ? ' ✅' : ''}<p>${esc(q.text)}</p>${btn}</div>`;
    }).join('') || '<p class="desc">Пока работы нет.</p>';
  }
  return h;
}

function itemInfo(it) {
  if (it.type === 'weapon') return `урон ${it.dmg}${it.burst ? '×' + it.burst : ''}, точн. ${Math.round(it.acc * 100)}%${it.ammo ? ', ' + ITEMS[it.ammo].name : ''}`;
  if (it.type === 'armor') return `защита ${Math.round(it.prot * 100)}%, от рад. ${Math.round(it.radProt * 100)}%`;
  if (it.type === 'artifact') return it.desc;
  const p = [];
  if (it.food) p.push(`еда +${it.food}`);
  if (it.water) p.push(`вода +${it.water}`);
  if (it.heal) p.push(`здоровье ${it.heal > 0 ? '+' : ''}${it.heal}`);
  if (it.rad) p.push(`радиация ${it.rad}`);
  return p.join(', ') || `${it.weight} кг`;
}

function renderInv() {
  const groups = [['weapon', 'Оружие'], ['armor', 'Броня'], ['artifact', 'Артефакты'], ['ammo', 'Патроны'], ['med', 'Медицина'], ['food', 'Еда'], ['junk', 'Хабар'], ['trophy', 'Трофеи']];
  let h = `<div class="sect">Пояс: ${S.equip.belt.length}/${BELT_SLOTS} · Защита ${Math.round(protection() * 100)}% · Рад.защита ${Math.round(radProtection() * 100)}%</div>`;
  for (const [type, title] of groups) {
    const list = S.inv.filter((e) => ITEMS[e.id].type === type);
    if (!list.length) continue;
    h += `<div class="sect">${title}</div>`;
    h += list.map((e) => {
      const it = ITEMS[e.id], eq = isEquipped(e.uid);
      let act = '';
      if (['weapon', 'armor'].includes(type)) act = eq ? 'Снять' : 'Взять';
      if (type === 'artifact') act = eq ? 'Снять' : 'На пояс';
      if (['food', 'med'].includes(type)) act = 'Исп.';
      return `<div class="item ${eq ? 'eq' : ''}"><span class="ic">${it.icon}</span>
        <div class="nm">${it.name}${e.qty > 1 ? ' ×' + e.qty : ''}${eq ? ' <em>[надето]</em>' : ''}
        <small>${itemInfo(it)} · ${(it.weight * e.qty).toFixed(1)} кг${it.stack ? '' : ' · сост. ' + Math.round(e.cond) + '%'}</small></div>
        ${act ? `<button data-act="use" data-uid="${e.uid}">${act}</button>` : ''}
        <button data-act="drop" data-uid="${e.uid}" class="x">✕</button></div>`;
    }).join('');
  }
  return h;
}

function renderPda() {
  let h = `<div class="sect">Активные задания</div>`;
  const act = Object.keys(S.quests).filter((q) => S.quests[q] !== 'done');
  h += act.length ? act.map((qid) => `<div class="quest"><b>${QUESTS[qid].title}</b> <small>(${questProgress(qid)}/${QUESTS[qid].qty}) — ${NPCS[QUESTS[qid].giver].name}</small><p>${esc(QUESTS[qid].text)}</p></div>`).join('') : '<p class="desc">Нет активных заданий.</p>';
  const done = Object.keys(S.quests).filter((q) => S.quests[q] === 'done');
  if (done.length) h += `<div class="sect">Выполнено</div>` + done.map((q) => `<div class="row">✅ ${QUESTS[q].title}</div>`).join('');
  h += `<div class="sect">Статистика</div>
    <div class="row">⏱ ${timeStr()}</div>
    <div class="row">⭐ Уровень ${S.level} · опыт ${fmt(S.xp)} / ${fmt(xpForLevel(S.level + 1))}</div>
    <div class="row">💀 Убито: ${S.stats.kills} · ☠ Смертей: ${S.stats.deaths} · ✨ Артефактов: ${S.stats.found}</div>
    <div class="sect">Карта Сектора</div>
    <div class="map">${Object.entries(LOCATIONS).map(([id, L]) => `<span class="${id === S.loc ? 'here' : ''}">${L.icon} ${L.name}</span>`).join('')}</div>
    <div class="sect">Совет</div><p class="desc">${pick(TIPS)}</p>
    <div class="sect">Система</div>
    <div class="actions"><button data-act="reset" class="danger">🗑 Начать заново</button></div>
    <p class="desc small">Игра сохраняется автоматически в этом браузере.</p>`;
  return h;
}

function render() {
  renderStatus();
  $('#main').innerHTML = tab === 'inv' ? renderInv() : tab === 'pda' ? renderPda() : renderLoc();
}

// ---------- обработка кликов ----------
const ACTIONS = {
  go: (d) => travel(d.id),
  search: searchLoc,
  rest,
  attack,
  flee,
  use: (d) => useItem(+d.uid),
  drop: (d) => dropItem(+d.uid),
  npc: (d) => { view = { npc: d.id, mode: null }; },
  mode: (d) => { view.mode = view.mode === d.id ? null : d.id; },
  close: () => { view = null; },
  buy: (d) => buy(d.id, +d.q),
  sell: (d) => sell(+d.uid, false),
  sellall: (d) => sell(+d.uid, true),
  repair: (d) => repair(+d.uid),
  treat: (d) => treat(d.id),
  take: (d) => takeQuest(d.id),
  finish: (d) => finishQuest(d.id),
  reset: () => { if (confirm('Стереть сохранение и начать заново?')) { newGame(); tab = 'loc'; } },
};

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act], [data-tab]');
  if (!t) return;
  if (t.dataset.tab) {
    if (S.combat && t.dataset.tab !== 'loc' && t.dataset.tab !== 'inv') return;
    tab = t.dataset.tab;
  } else {
    if (S.combat && !['attack', 'flee', 'use'].includes(t.dataset.act)) return;
    ACTIONS[t.dataset.act](t.dataset);
  }
  save();
  render();
});

if (!load()) newGame();
render();
