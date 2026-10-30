// ===== ДАННЫЕ МИРА «СЕКТОР НОЛЬ» (вселенная «Осадка») =====
// Сектор Ноль — эпицентр, куда двадцать лет назад выпал радиоактивный осадок. Валюта — крышки.
// Здесь удобно править баланс: предметы, локации, мутантов, NPC и квесты.

const ITEMS = {
  // --- оружие ---
  knife:   { name: 'Нож охотничий',   type: 'weapon', icon: '🔪', weight: 0.4, price: 150,  dmg: 9,  ammo: null,  acc: 0.95 },
  pm:      { name: 'Пистолет ПМ',      type: 'weapon', icon: '🔫', weight: 0.8, price: 900,  dmg: 16, ammo: 'a9',  acc: 0.8 },
  obrez:   { name: 'Обрез ТОЗ',        type: 'weapon', icon: '🔫', weight: 2.5, price: 1800, dmg: 34, ammo: 'a12', acc: 0.65 },
  akm:     { name: 'Автомат АКМ',      type: 'weapon', icon: '🔫', weight: 3.6, price: 6500, dmg: 28, ammo: 'a762', acc: 0.85, burst: 2 },
  // --- броня ---
  jacket:  { name: 'Ватник с нашивками', type: 'armor', icon: '🧥', weight: 3,  price: 400,  prot: 0.12, radProt: 0.05 },
  suitL:   { name: 'Комбинезон «Полынь»', type: 'armor', icon: '🦺', weight: 6,  price: 3500, prot: 0.28, radProt: 0.35 },
  suitH:   { name: 'Бронекостюм «Гранит»', type: 'armor', icon: '🛡️', weight: 12, price: 12000, prot: 0.45, radProt: 0.25 },
  // --- патроны ---
  a9:      { name: 'Патроны 9×18',     type: 'ammo', icon: '🟡', weight: 0.01, price: 6,  stack: true },
  a12:     { name: 'Дробь 12 калибр',  type: 'ammo', icon: '🔴', weight: 0.04, price: 14, stack: true },
  a762:    { name: 'Патроны 7.62×39',  type: 'ammo', icon: '🟠', weight: 0.02, price: 18, stack: true },
  // --- расходники ---
  bread:   { name: 'Сухари',           type: 'food', icon: '🍞', weight: 0.3, price: 40,  stack: true, food: 30 },
  stew:    { name: 'Тушёнка',          type: 'food', icon: '🥫', weight: 0.5, price: 90,  stack: true, food: 55, heal: 5 },
  water:   { name: 'Вода в бутылке',   type: 'food', icon: '💧', weight: 0.5, price: 50,  stack: true, water: 45 },
  dirty:   { name: 'Мутная вода',      type: 'food', icon: '🫗', weight: 0.5, price: 10,  stack: true, water: 25, rad: 6 },
  vodka:   { name: 'Настойка «Ясень»', type: 'food', icon: '🍶', weight: 0.5, price: 120, stack: true, food: 5, rad: -20, heal: -5 },
  bandage: { name: 'Бинт',             type: 'med',  icon: '🩹', weight: 0.1, price: 60,  stack: true, heal: 15 },
  medkit:  { name: 'Аптечка',          type: 'med',  icon: '💊', weight: 0.4, price: 250, stack: true, heal: 45 },
  antirad: { name: 'Антирад «Р-7»',    type: 'med',  icon: '💉', weight: 0.1, price: 300, stack: true, rad: -50 },
  // --- хабар / трофеи ---
  scrap:   { name: 'Медный лом',       type: 'junk', icon: '🔩', weight: 1.0, price: 35,  stack: true },
  docs:    { name: 'Папка с отчётами', type: 'junk', icon: '📁', weight: 0.3, price: 400, stack: true },
  battery: { name: 'Старый аккумулятор', type: 'junk', icon: '🔋', weight: 2.0, price: 120, stack: true },
  tDog:    { name: 'Клык облезлого пса', type: 'trophy', icon: '🦷', weight: 0.1, price: 70,  stack: true },
  tCrow:   { name: 'Перо падальщика',   type: 'trophy', icon: '🪶', weight: 0.05, price: 50, stack: true },
  tSwamp:  { name: 'Жабры болотника',   type: 'trophy', icon: '🫁', weight: 0.4, price: 220, stack: true },
  tWhisp:  { name: 'Слизь шептуна',     type: 'trophy', icon: '🧪', weight: 0.2, price: 400, stack: true },
  tBone:   { name: 'Хребет костолома',  type: 'trophy', icon: '🦴', weight: 3.0, price: 900, stack: true },
  tCore:   { name: 'Ядро Тени',         type: 'trophy', icon: '🌑', weight: 0.5, price: 8000, stack: true },
  // --- артефакты (носятся на поясе, max 3) ---
  artMoss: { name: 'Мох-светляк',  type: 'artifact', icon: '🟢', weight: 0.2, price: 1500, eff: { regen: 1, rad: 0.5 },  desc: 'Медленно заживляет раны, слегка фонит.' },
  artSalt: { name: 'Соляная роза', type: 'artifact', icon: '⚪', weight: 0.3, price: 2200, eff: { rad: -1.5 },          desc: 'Вытягивает радиацию из тела.' },
  artIron: { name: 'Железный ёж',  type: 'artifact', icon: '⚫', weight: 0.6, price: 2600, eff: { prot: 0.1, rad: 1 },   desc: 'Держит удар, но заметно фонит.' },
  artWing: { name: 'Пустоцвет',    type: 'artifact', icon: '🟣', weight: 0.1, price: 3200, eff: { carry: 15, rad: 1 },  desc: 'Рюкзак будто легче на 15 кг.' },
  artSun:  { name: 'Сердце Полюса', type: 'artifact', icon: '🔆', weight: 0.4, price: 15000, eff: { regen: 3, prot: 0.1, carry: 10, rad: 2 }, desc: 'Редчайшая находка. Живёт своей жизнью.' },
};

const MUTANTS = {
  dog:    { name: 'Облезлый пёс',  icon: '🐕', hp: 30,  dmg: [4, 9],   money: [0, 20],    drop: ['tDog', 0.7] },
  crow:   { name: 'Падальщик',     icon: '🐦‍⬛', hp: 18,  dmg: [3, 6],   money: [0, 10],    drop: ['tCrow', 0.8] },
  swamp:  { name: 'Болотник',      icon: '🐸', hp: 60,  dmg: [8, 14],  money: [10, 60],   drop: ['tSwamp', 0.6] },
  whisp:  { name: 'Шептун',        icon: '👤', hp: 75,  dmg: [10, 18], money: [30, 120],  drop: ['tWhisp', 0.6], rad: 4 },
  bone:   { name: 'Костолом',      icon: '🦍', hp: 140, dmg: [16, 28], money: [80, 250],  drop: ['tBone', 0.7] },
  bandit: { name: 'Мародёр',       icon: '🥷', hp: 55,  dmg: [9, 16],  money: [60, 300],  drop: ['a9', 0.6, 12] },
  shadow: { name: 'Тень Полюса',   icon: '🌑', hp: 400, dmg: [22, 38], money: [1000, 2000], drop: ['tCore', 1], rad: 8, boss: true },
};

// exits: подпись → id локации. rad — фон за действие. danger — шанс нападения при обыске.
// loot: [id, вес, макс.кол-во]. arts: артефакты в аномалиях (шанс найти при обыске).
const LOCATIONS = {
  bunker: {
    name: 'Бункер «Клён»', icon: '🏚️', tone: ['#3a2f22', '#14110c'], safe: true,
    desc: 'Бывшее бомбоубежище под котельной. Тепло, гудит генератор, пахнет махоркой и машинным маслом. Здесь можно отдохнуть, поторговать и починиться.',
    exits: { '⬆ Пустырь': 'wasteland' }, npcs: ['kuzmich', 'vera'],
  },
  wasteland: {
    name: 'Пустырь у котельной', icon: '🌾', tone: ['#4a3a24', '#1a140d'], rad: 0.5, danger: 0.25,
    desc: 'Сухая трава по пояс, ржавые остовы машин и покосившийся забор. Вдалеке воют псы.',
    exits: { '⬇ Бункер «Клён»': 'bunker', '⬅ Станция Заречье': 'station', '➡ Деревня Глухово': 'village', '⬆ Ржавое депо': 'depot' },
    mutants: ['dog', 'crow'], loot: [['scrap', 5, 2], ['bread', 2, 1], ['dirty', 2, 1], ['bandage', 1, 1], ['a9', 2, 8]],
  },
  station: {
    name: 'Станция Заречье', icon: '🚉', tone: ['#3d3a30', '#121210'], rad: 1, danger: 0.3,
    desc: 'Перрон, заросший кустарником. Табло застыло на времени катастрофы. В вагонах кто-то копался до тебя.',
    exits: { '➡ Пустырь': 'wasteland', '⬆ Болото «Кисель»': 'swamp' },
    mutants: ['dog', 'bandit'], loot: [['scrap', 4, 2], ['battery', 2, 1], ['stew', 2, 1], ['water', 1, 1], ['a9', 3, 10], ['a12', 1, 6]],
  },
  depot: {
    name: 'Ржавое депо', icon: '🏭', tone: ['#4b2e1c', '#160d08'], rad: 1.5, danger: 0.35,
    desc: 'Огромные ворота, тепловозы на ржавых путях. Под крышей шуршат падальщики, на смотровой яме — следы костра.',
    exits: { '⬇ Пустырь': 'wasteland', '⬆ Элеватор': 'elevator' },
    mutants: ['crow', 'bandit', 'dog'], loot: [['scrap', 6, 3], ['battery', 3, 1], ['a12', 2, 8], ['medkit', 1, 1]],
    arts: [['artIron', 0.06]],
  },
  village: {
    name: 'Деревня Глухово', icon: '🛖', tone: ['#2f3a26', '#0f140c'], rad: 0.5, danger: 0.15,
    desc: 'Десяток покосившихся изб. В крайней живёт Док — единственный врач на всю округу.',
    exits: { '⬅ Пустырь': 'wasteland', '➡ Песчаный карьер': 'quarry' },
    npcs: ['doc'], mutants: ['dog'], loot: [['bread', 3, 2], ['water', 3, 2], ['vodka', 1, 1], ['scrap', 2, 1]],
  },
  swamp: {
    name: 'Болото «Кисель»', icon: '🌫️', tone: ['#24382f', '#0b120f'], rad: 3, danger: 0.45,
    desc: 'Туман стелется над чёрной водой. Под ногами чавкает, в камышах мерцают огоньки аномалий.',
    exits: { '⬇ Станция Заречье': 'station', '➡ Радиолокатор «Дуга-2»': 'radar' },
    mutants: ['swamp', 'whisp'], loot: [['a762', 1, 10], ['antirad', 1, 1], ['scrap', 2, 2]],
    arts: [['artMoss', 0.12], ['artSalt', 0.05]],
  },
  quarry: {
    name: 'Песчаный карьер', icon: '⛰️', tone: ['#5a4426', '#1b130a'], rad: 2, danger: 0.4,
    desc: 'Ступенчатые склоны, брошенный экскаватор. Песок местами светится в темноте.',
    exits: { '⬅ Деревня Глухово': 'village', '⬆ Элеватор': 'elevator' },
    mutants: ['bone', 'dog', 'bandit'], loot: [['scrap', 4, 3], ['a12', 2, 10], ['stew', 1, 1]],
    arts: [['artSalt', 0.08], ['artWing', 0.04]],
  },
  elevator: {
    name: 'Элеватор', icon: '🏢', tone: ['#3b3530', '#100e0c'], rad: 2.5, danger: 0.4,
    desc: 'Бетонные башни, лестницы без перил. Наверху видно весь Сектор — и чёрный купол НИИ «Полюс» на горизонте.',
    exits: { '⬇ Ржавое депо': 'depot', '⬅ Песчаный карьер': 'quarry', '⬆ Периметр НИИ': 'perimeter' },
    mutants: ['bandit', 'bone', 'whisp'], loot: [['docs', 1, 1], ['a762', 3, 15], ['medkit', 1, 1], ['antirad', 1, 1]],
    arts: [['artWing', 0.05]],
  },
  radar: {
    name: 'Радиолокатор «Дуга-2»', icon: '📡', tone: ['#2c2f3d', '#0b0c12'], rad: 4, danger: 0.4,
    desc: 'Решётчатая антенна уходит в небо и низко гудит. В будке оператора — Связист, сумасшедший, но полезный.',
    exits: { '⬅ Болото «Кисель»': 'swamp' },
    npcs: ['radio'], mutants: ['whisp', 'swamp'], loot: [['battery', 3, 2], ['docs', 1, 1], ['a762', 2, 10]],
    arts: [['artMoss', 0.06], ['artIron', 0.06]],
  },
  perimeter: {
    name: 'Периметр НИИ «Полюс»', icon: '☢️', tone: ['#3d1f1f', '#120808'], rad: 6, danger: 0.55,
    desc: 'Колючая проволока, вышки, таблички «СТОЙ! ЗАПРЕТНАЯ ЗОНА». Воздух дрожит и звенит в ушах.',
    exits: { '⬇ Элеватор': 'elevator', '⬆ Корпус «Полюс»': 'core' },
    mutants: ['bone', 'whisp', 'bandit'], loot: [['docs', 2, 1], ['a762', 2, 20], ['antirad', 2, 1], ['medkit', 1, 1]],
    arts: [['artWing', 0.06], ['artIron', 0.06], ['artSalt', 0.06]],
  },
  core: {
    name: 'Корпус «Полюс»', icon: '🌑', tone: ['#1d1426', '#06040a'], rad: 10, danger: 0.7, needsFlag: 'coreKey',
    desc: 'Сердце катастрофы. Стены покрыты инеем, хотя здесь жарко. Что-то смотрит на тебя из темноты.',
    exits: { '⬇ Периметр НИИ': 'perimeter' },
    mutants: ['shadow', 'whisp'], loot: [['docs', 2, 2], ['antirad', 1, 2]],
    arts: [['artSun', 0.05]],
  },
};

const NPCS = {
  kuzmich: { name: 'Кузьмич', icon: '🧔', role: 'trader',
    hello: 'Ну здравствуй, бродяга. Хабар принёс? Показывай. Или купить чего надо?',
    stock: ['knife', 'pm', 'obrez', 'akm', 'jacket', 'suitL', 'suitH', 'a9', 'a12', 'a762', 'water', 'bread', 'stew', 'vodka', 'bandage', 'medkit', 'antirad'],
    quests: ['q_dogs', 'q_docs'] },
  vera: { name: 'Вера-механик', icon: '👩‍🔧', role: 'mechanic',
    hello: 'Ствол клинит? Комбез дырявый? Давай сюда, сделаю как новое. Не бесплатно, конечно.',
    quests: ['q_battery'] },
  doc: { name: 'Док', icon: '👨‍⚕️', role: 'doctor',
    hello: 'Садись. Покажи, где болит. И сколько ты сегодня нахватал рентген?',
    quests: ['q_swamp'] },
  radio: { name: 'Связист', icon: '🎧', role: 'quest',
    hello: '…шшш… Слышишь? Купол поёт. Каждую ночь поёт. Мне нужен кто-то, кто дойдёт до него.',
    quests: ['q_whisp', 'q_core'] },
};

// type: 'bring' — принести предметы; 'kill' — убить мутантов. requires — предыдущий квест.
const QUESTS = {
  q_dogs:    { title: 'Псы у котельной', giver: 'kuzmich', type: 'kill', target: 'dog', qty: 3,
               text: 'Псы совсем обнаглели — к бункеру подходят. Уложи троих, и я в долгу не останусь.',
               reward: { money: 300, items: [['a9', 20]] } },
  q_battery: { title: 'Свет для бункера', giver: 'vera', type: 'bring', item: 'battery', qty: 2,
               text: 'Генератор на последнем издыхании. Принеси два аккумулятора — в депо или на станции поищи.',
               reward: { money: 400, items: [['bandage', 3]] } },
  q_swamp:   { title: 'Лекарство из болота', giver: 'doc', type: 'bring', item: 'tSwamp', qty: 2,
               text: 'Из жабр болотника я варю отличный антирад. Принеси мне две штуки.',
               reward: { money: 600, items: [['antirad', 2]] } },
  q_docs:    { title: 'Бумаги учёных', giver: 'kuzmich', type: 'bring', item: 'docs', qty: 2, requires: 'q_dogs',
               text: 'Есть покупатель на документы из НИИ. Найди две папки — на элеваторе или у периметра.',
               reward: { money: 1500, items: [['medkit', 2]] } },
  q_whisp:   { title: 'Голоса в эфире', giver: 'radio', type: 'kill', target: 'whisp', qty: 3,
               text: 'Шептуны глушат мой сигнал. Убери троих — и я скажу, как пройти в корпус.',
               reward: { money: 1000, flag: 'coreKey' } },
  q_core:    { title: 'Песня купола', giver: 'radio', type: 'kill', target: 'shadow', qty: 1, requires: 'q_whisp',
               text: 'Код от двери в корпус ты знаешь. Там, внутри, Тень. Убей её — и купол замолчит.',
               reward: { money: 10000, flag: 'victory' } },
};

const START = {
  loc: 'bunker', money: 500,
  inv: [['knife', 1], ['pm', 1], ['a9', 24], ['bread', 2], ['water', 2], ['bandage', 2], ['jacket', 1]],
  equip: { weapon: 'pm', armor: 'jacket' },
};

const TIPS = [
  'Вернувшись в бункер, отдохни, почини снаряжение и продай лишний хабар.',
  'Следи за радиацией: выше 50 она начинает разъедать здоровье.',
  'Артефакты на поясе сильны, но почти все фонят — держи антирад под рукой.',
  'Перегруз замедляет: каждый шаг с тяжёлым рюкзаком стоит больше сил.',
  'Сломанное оружие бьёт слабее и чаще мажет. Загляни к Вере.',
];
