/* ============================================================================
   game.js — вся логика партии. Единственный владелец состояния.

   Здесь нет ни одной строчки про DOM: модуль общается с внешним миром
   событиями (Game.on) и публичным API. Поэтому его можно прогонять
   в Node — см. tools/simulate.js.

   Карта дня:
     newGame()  → карточка дня 1
     choose(i)  → применяет выбор, риск-броски, пишет результат (await = true)
     nextDay()  → ночь (сон, дренаж), день +1, утренние платежи, новая карточка
     finish()   → концовка, счёт, рейтинг, запись рекорда
   ========================================================================== */
(function (global) {
  'use strict';

  /* ============================== БАЛАНС ================================= */
  var B = {
    maxDays: 100,

    startMoney: 26000,
    startHealth: 82,
    startEnergy: 76,
    startMood: 62,
    startSocial: 58,

    // ежедневные расходы (подобраны симулятором: доход barely покрывает быт)
    food: 950,
    transport: 210,
    fuel: 460,
    baseEnergyDrain: 6,
    baseHealthDrain: 2,
    baseMoodDrain: 1,          // быт сам по себе съедает нервы

    // месяц (30 дней): день 1 — квартплата, день 5 — кредит, день 12 — машина
    util: 28000,
    utilDay: 1,
    creditDay: 5,
    carLoanDay: 12,

    // доход
    salary: 52000,
    salaryDay: 30,
    advance: 20000,
    advanceDay: 15,

    // кредиты и машина
    creditStart: 0,
    creditPayment: 6200,
    carCondition: 52,
    carLoanLeft: 3,
    carLoanPayment: 9800,
    carWear: 1,

    // ночь
    sleepEnergy: 34,
    sleepHealth: 3,
    sleepHealthBad: 0,
    sleepMood: 4,
    debtMood: -6,
    debtMoodLimit: -1500,

    /* Ключевой баланс игры. База ВОССТАНОВЛЕНИЯ щедрая (сон даёт +4, быт ест
       всего 1), а асимметрия событий резкая: плохое бьёт ×1.45, хорошее лечит
       только ×0.85. Смысл: нервы восстанавливаются у того, кто выбирает
       отдых и людей, а не у того, кто берёт всё подряд. Замеры симулятором:
       при мягкой асимметрии случайная и умная стратегии выживали одинаково. */
    moodGain: 0.85,            // множитель для +настроения из событий
    moodLoss: 1.45,            // множитель для −настроения из событий

    /* Усталость спадает за ночь. Было 14 — и усталость физически не могла
       накопиться: любой вечер с подработкой «обнулялся» к утру, а события
       с условием fatigueAbove: 25 не выпадали никогда (мёртвый контент).
       Теперь 3: две тяжёлые смены подряд — и ты спишь хуже. */
    fatigueNight: 3,
    fatigueMax: 0.6,

    /* --- ИЗНОС (накопительный штраф за экономию на здоровье и сне) --------
       Раньше недосып и болячки стоили одинаково в любой день: можно было
       двадцать дней жить на 10 силах без последствий. Теперь каждый такой
       день добавляет «износ», а износ бьёт по всем восстановительным
       процессам. Получается каскад: экономишь на сне → растёт износ →
       ночь восстанавливает хуже → износ растёт ещё. */
    strainMax: 10,            // предел износа
    strainRest: 1,            // сколько износа снимает спокойная ночь
    strainHealthEvery: 2,     // +1 урон здоровью за каждые 2 износа
    strainMoodEvery: 2,       // +1 потеря настроения за каждые 2 износа
    strainEnergyEvery: 1,     // +1 потеря сил за каждую единицу износа

    /* --- ДИНАМИЧЕСКИЕ РАСХОДЫ ---------------------------------------------
       Постоянные 890 ₽ в день были предсказуемы и не зависели от состояния.
       Теперь еда дорожает от усталости (устал → заказал доставку) и от
       склонности к риску, бензин — от убитости машины, плюс появляется шанс
       случайной траты: он растёт с риском и падает с удачей. */
    foodFatigue: 300,         // еда: +fatigue/300
    foodRisk: 500,            // еда: +risk/500
    fuelWear: 250,            // бензин: +(100-condition)/250
    impulseBase: 0.05,        // базовый шанс незапланированной траты
    impulseRisk: 900,         // +risk/900
    impulseLuck: 1200,        // −luck/1200
    impulseMin: 300,
    impulseMax: 2600,

    // пороги критических предупреждений
    warnMoney: 1000,
    warnHealth: 15,
    warnEnergy: 15,
    warnMood: 15,
    warnFatigue: 80,
    warnStrain: 6,

    debtLimit: -30000
  };

  var SPEND_LABELS = {
    car: 'автомобиль',
    credit: 'кредиты',
    food: 'еда и доставка',
    home: 'квартплата и транспорт',
    fun: 'развлечения',
    health: 'здоровье и аптека',
    other: 'импульсивные траты'
  };

  var END_TITLES = {
    win:     { title: 'Ты выжил',              sub: 'Сто дней. Зарплата снова в пятницу.',        badge: '🏆' },
    health:  { title: 'Здоровье кончилось',    sub: 'Скорая, капельница и мысль «надо было раньше».', badge: '🚑' },
    burnout: { title: 'Ты выгорел',            sub: 'Силы кончились раньше, чем месяц.',          badge: '🪫' },
    mood:    { title: 'Ты сломался',           sub: 'Нервы сдали, и всё стало всё равно.',        badge: '🫠' },
    debt:    { title: 'Долговая яма',          sub: 'Минус на карте стал больше, чем ты.',        badge: '🕳' }
  };

  /* ============================== ЦЕЛИ ПАРТИИ ============================ */
  /* ЗАЧЕМ: раньше у всех был один сценарий — «выжить 100 дней». Теперь игрок
     выбирает мечту на старте, и это меняет стратегию: под дачу надо копить,
     под кредиты — агрессивно гасить долг, под семью — не жечь отношения. */
  var GOALS = [
    { id: 'survive', icon: '🏁', name: 'Дожить до отпуска', note: 'Просто выжить 100 дней', bonus: 0,
      done: function (s) { return !!(s.over && s.end.win); },
      progress: function (s) { return s.day + ' / ' + B.maxDays + ' дн.'; } },
    { id: 'dacha', icon: '🏡', name: 'Купить дачу', note: 'Накопить 100 000 ₽', bonus: 2500,
      done: function (s) { return !!(s.over && s.money >= 100000); },
      progress: function (s) { return groupDigits(Math.max(0, s.money)) + ' / 100 000 ₽'; } },
    { id: 'debts', icon: '🧾', name: 'Закрыть все кредиты', note: 'К 80-му дню без долгов', bonus: 2000,
      done: function (s) { return s.day >= 80 && s.credit.debt <= 0 && s.car.loanLeft <= 0; },
      progress: function (s) {
        if (s.credit.debt > 0) return 'долг ' + groupDigits(s.credit.debt) + ' ₽';
        if (s.car.loanLeft > 0) return 'машина: ' + s.car.loanLeft + ' платежа';
        return s.day >= 80 ? 'готово' : 'без долгов, ждём 80-й день';
      } },
    { id: 'freedom', icon: '🕊', name: 'Накопить 200 000 ₽', note: 'Свобода стоит дорого', bonus: 4000,
      done: function (s) { return !!(s.over && s.money >= 200000); },
      progress: function (s) { return groupDigits(Math.max(0, s.money)) + ' / 200 000 ₽'; } },
    { id: 'family', icon: '👨‍👩‍👧', name: 'Не потерять семью', note: 'Дожить и сохранить семью 80+', bonus: 1800,
      done: function (s) { return !!(s.over && s.end.win && s.family >= 80); },
      progress: function (s) { return Math.round(s.family) + ' / 80'; } }
  ];

  /* ============================ АРХЕТИПЫ ================================= */
  /* Профессия меняет способ игры, но НЕ через штраф к настроению: замер
     симулятором показал, что 1 пункт настроения в день превращает 45%
     выживания в 1% — это обрыв, а не выбор. Поэтому архетипы разведены
     экономикой: оклад, зависимость дохода от сил и аппетит к тратам. */
  var ARCHETYPES = [
    { id: 'clerk', icon: '🧑‍💼', name: 'Офисный клерк',
      note: 'Ровный оклад 78 000 ₽/мес, зато репутация на работе выше',
      salary: 56000, advance: 22000, dailyIncome: 0, energyIncome: false,
      expense: 1, impulse: 1, moodDrain: 0, workStart: 62, moneyMult: 1 },
    { id: 'courier', icon: '🛵', name: 'Курьер-фрилансер',
      note: 'Доход зависит от сил: устал — заработал меньше',
      salary: 0, advance: 0, dailyIncome: 2400, energyIncome: true,
      expense: 1.05, impulse: 1.1, moodDrain: 0, workStart: 45, moneyMult: 0.8 },
    { id: 'student', icon: '🎓', name: 'Студент-ипэшник',
      note: 'Быт дешевле, но штрафы и импульсивные траты чаще',
      salary: 46000, advance: 18000, dailyIncome: 250, energyIncome: false,
      expense: 0.82, impulse: 1.45, moodDrain: 0, workStart: 40, moneyMult: 0.9 }
  ];

  /* ============================ ПЕРКИ ==================================== */
  /* Покупаются за очки опыта между партиями — постоянная прогрессия. */
  var PERKS = [
    { id: 'cashback',   icon: '💳', name: 'Кэшбэк',              cost: 4, note: 'Незапланированные траты −45%' },
    { id: 'sleep',      icon: '😴', name: 'Крепкий сон',          cost: 4, note: 'Износ уходит быстрее, усталость вдвое' },
    { id: 'connections',icon: '🤝', name: 'Связи',                cost: 5, note: '−10% ко всем тратам в событиях' },
    { id: 'hustle',     icon: '💪', name: 'Второе дыхание',       cost: 5, note: '+1 200 ₽ в день' },
    { id: 'luck',       icon: '🍀', name: 'Родился в рубашке',    cost: 6, note: '+12 к стартовой удаче' }
  ];

  /* ============================ СЕЗОНЫ =================================== */
  /* Партия длится 100 дней ≈ три с половиной месяца, поэтому сезон меняется
     каждые 30 дней. Давление сезона — ЭКОНОМИЧЕСКОЕ (квартплата, бензин,
     продукты), а не «настроение −1 каждый день»: иначе зима убивала партию
     сама по себе, независимо от решений игрока. */
  var SEASONS = [
    { id: 'winter', icon: '❄️', name: 'Зима',  food: 1.06, fuel: 1.18, util: 1.35, mood: 0 },
    { id: 'spring', icon: '🌱', name: 'Весна', food: 0.97, fuel: 0.98, util: 1.0,  mood: 1 },
    { id: 'summer', icon: '☀️', name: 'Лето',  food: 0.9,  fuel: 0.95, util: 0.85, mood: 1 },
    { id: 'autumn', icon: '🍂', name: 'Осень', food: 1.0,  fuel: 1.05, util: 1.15, mood: 0 }
  ];

  /* Микро-кризисы: приходят на несколько дней и меняют цены/доход. */
  var CRISES = [
    { id: 'fuel_up', icon: '⛽', text: 'Бензин подорожал',            days: 10, mods: { fuel: 1.25 } },
    { id: 'food_up', icon: '🥦', text: 'Продукты подорожали',         days: 12, mods: { food: 1.15 } },
    { id: 'sale',    icon: '🏷', text: 'Сезон распродаж',             days: 7,  mods: { impulse: 1.4 } },
    { id: 'util_up', icon: '💡', text: 'Подняли тарифы ЖКХ',          days: 30, mods: { util: 1.2 } },
    { id: 'index',   icon: '🎁', text: 'Индексация зарплаты',         days: 30, mods: { salary: 1.12 } },
    { id: 'crisis',  icon: '📉', text: 'Микро-кризис: урезали премии', days: 14, mods: { salary: 0.9, mood: -1 } }
  ];

  function goalById(id) {
    for (var i = 0; i < GOALS.length; i++) if (GOALS[i].id === id) return GOALS[i];
    return null;
  }

  function archetypeById(id) {
    for (var i = 0; i < ARCHETYPES.length; i++) if (ARCHETYPES[i].id === id) return ARCHETYPES[i];
    return null;
  }

  function crisisById(id) {
    for (var i = 0; i < CRISES.length; i++) if (CRISES[i].id === id) return CRISES[i];
    return null;
  }

  /* ============================== СОСТОЯНИЕ ============================== */
  var state = null;
  var handlers = {};

  /** Уровень перка в текущей партии (0/1). */
  function perk(id) { return !!(state && state.perks && state.perks[id]); }

  /**
   * Новое состояние партии.
   * opts: { seed, goal, arch, daily, dailyDate }
   *   seed — фиксированное зерно (для ежедневного забега у всех одинаковое);
   *   goal — id мечты; arch — id профессии.
   */
  function freshState(opts) {
    opts = opts || {};
    var meta = Storage.meta();
    var arch = archetypeById(opts.arch) || ARCHETYPES[0];
    var goal = goalById(opts.goal) || GOALS[0];
    var seed = opts.seed ? (opts.seed >>> 0)
      : ((Date.now() ^ ((Math.random() * 0xffffffff) >>> 0)) >>> 0);

    return {
      v: Storage.VERSION,
      seed: seed || 1,
      rngCalls: 0,
      day: 1,
      money: Math.round(B.startMoney * arch.moneyMult * (meta.perks.connections ? 1.1 : 1)),
      health: B.startHealth,
      energy: B.startEnergy,
      mood: B.startMood,
      social: B.startSocial,
      job: {
        salary: arch.salary, advance: arch.advance,
        dailyIncome: arch.dailyIncome, energyIncome: arch.energyIncome,
        expense: arch.expense, impulse: arch.impulse, moodDrain: arch.moodDrain
      },
      car: { has: true, condition: B.carCondition, loanLeft: B.carLoanLeft, loanPayment: B.carLoanPayment },
      credit: { debt: B.creditStart, payment: B.creditPayment },
      earned: 0,
      spent: 0,
      spendBy: { car: 0, credit: 0, food: 0, home: 0, fun: 0, health: 0, other: 0 },

      // выбор игрока на старте
      goalId: goal.id,
      arch: arch.id,
      archName: arch.name,
      archIcon: arch.icon,
      perks: meta.perks,          // копия купленных бонусов на партию
      daily: !!opts.daily,        // ежедневный забег с общим зерном
      dailyDate: opts.dailyDate || '',
      crisis: null,               // активный микро-кризис { id, until }
      ledger: [],                 // журнал денег: [{ day, icon, text, delta, cat }]

      // скрытые характеристики: видны в меню «Подробно» и на экране финала
      family: 62,          // отношения с семьёй
      work: arch.workStart,// репутация на работе
      fatigue: 0,          // накопленная усталость (режет восстановление сил)
      luck: 50 + (meta.perks.luck ? 12 : 0),
      risk: 0,             // склонность к риску
      exp: 0,              // опыт
      queue: [],           // очередь последствий цепочек: [{ id, day }]
      counters: { gigs: 0, breakdowns: 0, debts: 0, parties: 0, charity: 0, repairs: 0, savings: 0 },
      achv: {},            // полученные достижения: id -> день
      best: null,          // самое удачное решение
      worst: null,         // самая дорогая ошибка

      strain: 0,           // накопительный износ (см. BALANCE.strainMax)
      warned: {},          // предупреждения, о которых игроку уже сказали: key -> день

      flags: {},
      lastSeen: {},
      log: [],
      cardId: null,
      await: false,
      lastResult: null,
      over: false,
      end: null,
      _lowEnergy: 0
    };
  }

  /* ============================== УТИЛИТЫ ================================ */
  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }

  function makeRnd(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Случайное число, детерминированное парой (seed, rngCalls):
      перезагрузка страницы не меняет исход броска. */
  function roll() {
    state.rngCalls = (state.rngCalls || 0) + 1;
    var mix = (state.seed ^ Math.imul(state.rngCalls, 2654435761)) >>> 0;
    return makeRnd(mix)();
  }

  function groupDigits(n) {
    return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  }

  /* ========================= ЖУРНАЛ, СЕЗОНЫ, МОДЫ ======================== */
  /** Журнал денег: каждая запись — «что и когда стоило». Нужен для модалки
      «Журнал расходов», где видно, куда реально уходят деньги. */
  function ledger(icon, text, delta, cat) {
    var s = state;
    if (!s.ledger) s.ledger = [];
    s.ledger.push({ day: s.day, icon: icon, text: text, delta: Math.round(delta), cat: cat || '' });
    if (s.ledger.length > 420) s.ledger.splice(0, s.ledger.length - 420);
  }

  function seasonOf(day) {
    return SEASONS[Math.floor((day - 1) / 30) % SEASONS.length];
  }

  /**
   * Итоговые множители дня: сезон × активный кризис × перк «Кэшбэк».
   * Одна точка правды — и для списаний, и для подписи в HUD.
   */
  function dayMods() {
    var s = state;
    var season = seasonOf(s.day);
    var mods = {
      food: season.food, fuel: season.fuel, util: season.util,
      salary: 1, impulse: 1, mood: season.mood || 0,
      season: season, crisis: null
    };

    var c = s.crisis;
    if (c && c.until >= s.day) {
      var def = crisisById(c.id);
      if (def) {
        for (var k in def.mods) {
          if (!Object.prototype.hasOwnProperty.call(def.mods, k)) continue;
          if (k === 'mood') mods.mood += def.mods[k];
          else mods[k] = (mods[k] || 1) * def.mods[k];
        }
        mods.crisis = def;
      }
    }

    if (perk('cashback')) mods.impulse *= 0.55;   // перк режет случайные траты
    return mods;
  }

  var cloudDay = -1;

  function save() {
    if (typeof Storage !== 'undefined' && Storage.save) Storage.save(state);
    // В ВК дополнительно уносим партию в облако: не чаще раза в игровой день
    if (global.VK && global.VK.cloudSave && (state.over || cloudDay !== state.day)) {
      cloudDay = state.day;
      global.VK.cloudSave(state);
    }
  }

  function emit(evt, data) {
    var list = handlers[evt];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      try { list[i](data); } catch (e) {
        if (global.console && console.error) console.error('[game] обработчик ' + evt + ':', e);
      }
    }
  }

  /* ============================== ДЕНЬГИ ================================= */
  function addMoney(delta, category) {
    var s = state;
    s.money += delta;
    if (delta >= 0) {
      s.earned += delta;
    } else {
      var amount = -delta;
      s.spent += amount;
      var cat = s.spendBy[category] === undefined ? 'other' : category;
      s.spendBy[cat] += amount;
    }
  }

  /* ============================== РИСКИ ================================== */
  /**
   * Броски риска у выбранного варианта.
   *
   * Если шансы в сумме дают ~1 (≥ 0.95) — это описание взаимоисключающих
   * исходов («иксы» ИЛИ «сгорело»): бросаем один раз и берём ровно один
   * вариант. Иначе каждый бросок независим — мелкая неприятность может
   * прийти вместе с основным эффектом.
   *
   * Явно задать режим можно полем choice.riskMode: 'either' | 'roll'.
   */
  /** Хороший ли исход у риска: считаем по знаку полезности эффектов. */
  function riskIsGood(fx) {
    if (!fx) return false;
    var v = (fx.money || 0) / 900
      + (fx.health || 0) * 4 + (fx.energy || 0) * 2 + (fx.mood || 0) * 3
      + (fx.social || 0) * 2 + (fx.family || 0) * 3 + (fx.work || 0) * 3
      + (fx.carCondition || 0) + (fx.luck || 0) * 2;
    return v > 0;
  }

  /** Удача сдвигает шансы: хорошее — вероятнее, плохое — реже.
      Было /200 (то есть максимум ±25% относительно), стало /150 (±33%):
      разница между «Полосой невезения» и «Любимцем фортуны» теперь
      чувствуется на каждом рискованном выборе, а не только в теории. */
  function riskChance(risk, s) {
    var c = typeof risk.chance === 'number' ? risk.chance : 0.3;
    var shift = ((s.luck || 50) - 50) / 150;      // удача 50 — без изменений
    c = riskIsGood(risk.effects) ? c * (1 + shift) : c * (1 - shift);
    return clamp(c, 0.02, 0.98);
  }

  function rollRisks(choice, s, applyOne) {
    var risk = choice.risk;
    if (!risk || !risk.length) return;

    var sum = 0, i;
    for (i = 0; i < risk.length; i++) sum += riskChance(risk[i], s);

    var exclusive = choice.riskMode
      ? choice.riskMode === 'either'
      : (risk.length > 1 && sum >= 0.95);

    if (exclusive) {
      var r = roll(), acc = 0;
      for (i = 0; i < risk.length; i++) {
        acc += riskChance(risk[i], s);
        if (r < acc) { applyOne(risk[i]); return; }
      }
      applyOne(risk[risk.length - 1]);
      return;
    }

    for (i = 0; i < risk.length; i++) {
      if (roll() < riskChance(risk[i], s)) applyOne(risk[i]);
    }
  }

  /* ============================== ЭФФЕКТЫ ================================ */
  function pushDelta(list, key, delta, text) {
    if (!delta && !text) return;
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) { list[i].delta += delta; return; }
    }
    list.push({ key: key, delta: delta, text: text || '' });
  }

  var STAT_KEYS = ['health', 'energy', 'mood', 'social', 'family', 'work', 'fatigue', 'luck', 'risk'];
  var COUNTER_KEYS = ['gigs', 'breakdowns', 'debts', 'parties', 'charity', 'repairs', 'savings'];

  function applyEffects(fx, out) {
    if (!fx) return out;
    var s = state, i;

    if (fx.money) {
      addMoney(fx.money, fx.category || (fx.money > 0 ? 'income' : 'other'));
      pushDelta(out, 'money', fx.money);
    }

    for (i = 0; i < STAT_KEYS.length; i++) {
      var k = STAT_KEYS[i];
      if (fx[k]) {
        var delta = fx[k];
        // нервы портятся быстрее, чем восстанавливаются (см. BALANCE.moodLoss)
        if (k === 'mood') delta = delta > 0 ? delta * B.moodGain : delta * B.moodLoss;
        s[k] = clamp((s[k] || 0) + delta, 0, 100);
        pushDelta(out, k, Math.round(delta));
      }
    }

    if (fx.exp) {
      s.exp += fx.exp;
      pushDelta(out, 'exp', fx.exp);
    }

    for (i = 0; i < COUNTER_KEYS.length; i++) {
      var ck = COUNTER_KEYS[i];
      if (fx[ck]) {
        s.counters[ck] = (s.counters[ck] || 0) + fx[ck];
        pushDelta(out, ck, fx[ck]);
      }
    }

    if (fx.carCondition && s.car.has) {
      s.car.condition = clamp(s.car.condition + fx.carCondition, 0, 100);
      pushDelta(out, 'carCondition', fx.carCondition);
      if (s.car.condition <= 0) {
        s.car.has = false;
        s.flags.car_dead = true;
        pushDelta(out, 'car', 0, 'Машина встала навсегда');
      }
    }

    if (fx.carGone && s.car.has) {
      s.car.has = false;
      s.flags.car_dead = true;
      pushDelta(out, 'car', 0, 'Машины больше нет');
    }

    if (fx.creditAdd) {
      s.credit.debt += fx.creditAdd;
      pushDelta(out, 'debt', fx.creditAdd);
    }

    if (fx.creditPay && s.credit.debt > 0) {
      var pay = Math.min(s.credit.debt, fx.creditPay);
      s.credit.debt -= pay;
      addMoney(-pay, 'credit');
      pushDelta(out, 'money', -pay);
      pushDelta(out, 'debt', -pay);
    }

    if (fx.flag) s.flags[fx.flag] = true;
    if (fx.unflag) delete s.flags[fx.unflag];

    return out;
  }

  /* ============================ ДОСТУПНОСТЬ ============================== */
  /** Списание можно писать и как число, и как { money, category }. */
  function normalizeCost(cost) {
    if (!cost) return null;
    if (typeof cost === 'number') return { money: cost, category: 'other' };
    if (typeof cost.money === 'number') return cost;
    return null;
  }

  function reasonText(s, r) {
    if (!r) return 'недоступно';
    if (typeof r.money === 'number' && s.money < r.money) return 'нужно ' + groupDigits(r.money) + ' ₽';
    if (r.car !== undefined && !(s.car && s.car.has)) return 'нужна машина';
    if (r.credit !== undefined) return r.credit ? 'нужен кредит' : 'нет кредита';
    if (typeof r.energyAbove === 'number') return 'не хватает сил';
    if (typeof r.familyAbove === 'number') return 'нужно согласие семьи';
    if (typeof r.workAbove === 'number') return 'нужна репутация на работе';
    if (r.flagNot) return 'уже было';
    return 'недоступно';
  }

  /** Стоимость с учётом перка «Связи» (−10%). Одна функция и для проверки
      доступности, и для реального списания — иначе кнопка и кошелёк разойдутся. */
  function costWithPerks(cost) {
    var money = cost ? cost.money : 0;
    if (!money) return 0;
    return Math.max(1, Math.round(money * (perk('connections') ? 0.9 : 1)));
  }

  function canPick(s, choice) {
    if (!Events.checkReq(choice.requires, s)) {
      return { ok: false, reason: reasonText(s, choice.requires) };
    }
    var need = costWithPerks(normalizeCost(choice.cost));
    if (need > s.money) {
      return { ok: false, reason: 'не хватает ' + groupDigits(need - s.money) + ' ₽' };
    }
    return { ok: true, reason: '' };
  }

  /* ============================== УТРО =================================== */
  function tickMorning() {
    var s = state, lines = [];
    var mods = dayMods();
    var job = s.job;

    function spend(amount, cat, icon, label) {
      if (amount <= 0) return;
      addMoney(-amount, cat);
      lines.push({ icon: icon, text: label, delta: -amount });
      ledger(icon, label, -amount, cat);
    }
    function income(amount, icon, label) {
      if (amount <= 0) return;
      addMoney(amount, 'income');
      lines.push({ icon: icon, text: label, delta: amount });
      ledger(icon, label, amount, 'income');
    }

    var monthDay = ((s.day - 1) % 30) + 1;

    /* --- Еда: сезон × кризис × профессия × усталость ---------------------- */
    var foodCost = Math.round(B.food * mods.food * job.expense *
      (1 + (s.fatigue || 0) / B.foodFatigue + (s.risk || 0) / B.foodRisk));
    spend(foodCost, 'food', '🍜', 'Еда');

    spend(Math.round(B.transport * job.expense), 'home', '🚌', 'Транспорт');

    /* --- Бензин: сезон × кризис × убитость машины ------------------------- */
    if (s.car.has) {
      var fuelCost = Math.round(B.fuel * mods.fuel * job.expense *
        (1 + (100 - s.car.condition) / B.fuelWear));
      spend(fuelCost, 'car', '⛽', 'Бензин');
    }

    /* --- Доход профессии --------------------------------------------------
       У курьера он зависит от сил: устал — заработал меньше. У клерка оклад,
       поэтому здесь только «мелкий приработок». */
    if (job.dailyIncome) {
      var factor = job.energyIncome ? (0.25 + (s.energy || 0) / 133) : 1;
      var pay = Math.round(job.dailyIncome * factor * (perk('hustle') ? 1.4 : 1));
      income(pay, job.energyIncome ? '🛵' : '💼', job.energyIncome ? 'Заказы за день' : 'Мелкий приработок');
    } else if (perk('hustle')) {
      income(1200, '💪', 'Подработка');                 // перк «Второе дыхание»
    }

    /* --- Незапланированная трата -----------------------------------------
       Шанс растёт со склонностью к риску и усталостью профессии, падает с
       удачей; сезон распродаж его усиливает, перк «Кэшбэк» — режет. */
    var impulseChance = (B.impulseBase + (s.risk || 0) / B.impulseRisk - (s.luck || 50) / B.impulseLuck)
      * mods.impulse * job.impulse;
    if (roll() < clamp(impulseChance, 0.01, 0.4)) {
      var impulse = Math.round((B.impulseMin + roll() * (B.impulseMax - B.impulseMin)) / 10) * 10;
      spend(impulse, 'other', '🎲', 'Непредвиденное');
    }

    if (monthDay === B.utilDay) spend(Math.round(B.util * mods.util * job.expense), 'home', '💡', 'Квартплата');

    if (monthDay === B.creditDay && s.credit.debt > 0) {
      var pay2 = Math.min(s.credit.payment, s.credit.debt);
      spend(pay2, 'credit', '💳', 'Платёж по кредиту');
      s.credit.debt -= pay2;
      lines.push({ icon: '📉', text: 'Долг: ' + groupDigits(s.credit.debt) + ' ₽', delta: 0 });
    }

    if (s.car.has && s.car.loanLeft > 0 && monthDay === B.carLoanDay) {
      spend(B.carLoanPayment, 'car', '🚗', 'Кредит за машину');
      s.car.loanLeft -= 1;
      if (s.car.loanLeft === 0) lines.push({ icon: '🎉', text: 'Машина твоя! Кредит закрыт', delta: 0 });
    }

    if (monthDay === B.advanceDay && job.advance) income(Math.round(job.advance * mods.salary), '💵', 'Аванс');
    if (monthDay === B.salaryDay && job.salary) income(Math.round(job.salary * mods.salary), '💰', 'Зарплата');

    /* --- Настроение: быт + профессия − сезон/кризис -----------------------
       Зимой и в кризис нервы горят быстрее, весной и летом чуть легче. */
    var moodDrain = B.baseMoodDrain + (job.moodDrain || 0) - mods.mood;
    s.mood = clamp(s.mood - moodDrain, 0, 100);

    // износ машины и базовый дренаж
    if (s.car.has) {
      s.car.condition = clamp(s.car.condition - B.carWear, 0, 100);
      if (s.car.condition <= 0) {
        s.car.has = false;
        s.flags.car_dead = true;
        lines.push({ icon: '💀', text: 'Машина встала окончательно', delta: 0 });
      }
    }
    s.energy = clamp(s.energy - B.baseEnergyDrain, 0, 100);
    s.health = clamp(s.health - B.baseHealthDrain, 0, 100);
    if (s.energy <= 0) s.health = clamp(s.health - 3, 0, 100);

    return lines;
  }

  /* ============================== КАРТОЧКА =============================== */
  function drawCard(forcedId) {
    var s = state;
    if (forcedId) {
      var forcedEvent = Events.get(forcedId);
      if (forcedEvent) {
        s.cardId = forcedEvent.id;
        s.cardForced = true;
        return forcedEvent;
      }
    }
    var card = Events.pick(s, roll, false);
    s.cardId = card.id;
    s.cardForced = false;
    return card;
  }

  /** Забирает из очереди первое «созревшее» последствие цепочки.
      Неизвестный id (контент переписали) или не выполненные условия
      (например, машины уже нет) — звено цепочки просто отбрасывается. */
  function takeQueued() {
    var s = state;
    if (!s.queue || !s.queue.length) return null;

    var rest = [], found = null;
    for (var i = 0; i < s.queue.length; i++) {
      var item = s.queue[i];
      if (found || item.day > s.day) { rest.push(item); continue; }
      var e = Events.get(item.id);
      if (!e || !Events.meets(e, s)) continue;
      found = e.id;
    }
    s.queue = rest;
    return found;
  }

  /* ============================== КОНЦОВКА =============================== */
  function endCause(s) {
    if (s.health <= 0) return 'health';
    if (s.mood <= 0) return 'mood';
    if (s.money <= B.debtLimit) return 'debt';
    if ((s._lowEnergy || 0) >= 2) return 'burnout';
    return null;
  }

  function topSpend(s) {
    var best = { key: 'other', amount: 0 };
    for (var k in s.spendBy) {
      if (Object.prototype.hasOwnProperty.call(s.spendBy, k) && s.spendBy[k] > best.amount) {
        best = { key: k, amount: s.spendBy[k] };
      }
    }
    return { key: best.key, amount: Math.round(best.amount), label: best.amount > 0 ? (SPEND_LABELS[best.key] || 'прочее') : 'бытовые мелочи' };
  }

  function causeLabel(s, cause, top) {
    if (cause === 'health') return 'здоровье';
    if (cause === 'debt') return s.spendBy.credit > 15000 ? 'кредиты' : top.label;
    return top.label;
  }

  /* ======================= КРИТИЧЕСКИЕ ПРЕДУПРЕЖДЕНИЯ =================== */
  /* ЗАЧЕМ: раньше игрок узнавал, что «всё плохо», только на экране финала.
     Теперь при переходе через порог показывается предупреждение (чип в HUD,
     звук, вибрация), а повторно о том же не напоминают, пока показатель
     не восстановится с запасом — иначе получится спам каждый день. */
  var WARNINGS = [
    { key: 'money_crit', icon: '💸', text: 'Денег почти нет',
      test:  function (s) { return s.money < B.warnMoney; },
      clear: function (s) { return s.money > B.warnMoney * 1.6; } },
    { key: 'debt', icon: '🕳', text: 'Ты в минусе',
      test:  function (s) { return s.money < 0; },
      clear: function (s) { return s.money >= 0; } },
    { key: 'health', icon: '🚑', text: 'Здоровье на исходе',
      test:  function (s) { return s.health < B.warnHealth; },
      clear: function (s) { return s.health > B.warnHealth + 12; } },
    { key: 'energy', icon: '🪫', text: 'Сил нет совсем',
      test:  function (s) { return s.energy < B.warnEnergy; },
      clear: function (s) { return s.energy > B.warnEnergy + 12; } },
    { key: 'mood', icon: '🫠', text: 'Нервы сдают',
      test:  function (s) { return s.mood < B.warnMood; },
      clear: function (s) { return s.mood > B.warnMood + 12; } },
    { key: 'fatigue', icon: '🥱', text: 'Ты вымотан',
      test:  function (s) { return (s.fatigue || 0) > B.warnFatigue; },
      clear: function (s) { return (s.fatigue || 0) < B.warnFatigue - 15; } },
    { key: 'strain', icon: '🩹', text: 'Износ копится',
      test:  function (s) { return (s.strain || 0) >= B.warnStrain; },
      clear: function (s) { return (s.strain || 0) <= B.warnStrain - 3; } },
    { key: 'family', icon: '👨‍👩‍👧', text: 'Дома напряжённо',
      test:  function (s) { return s.family < 25; },
      clear: function (s) { return s.family > 40; } },
    { key: 'work', icon: '💼', text: 'На работе проблемы',
      test:  function (s) { return s.work < 25; },
      clear: function (s) { return s.work > 40; } }
  ];

  /** Возвращает активные предупреждения и список «свежих» — тех, о которых
      игроку ещё не говорили. remember=true помечает их как показанные. */
  function scanWarnings(s, remember) {
    var active = [], fresh = [], i, w, on;

    for (i = 0; i < WARNINGS.length; i++) {
      w = WARNINGS[i];
      on = safeCall(w.test, s);
      if (on) {
        active.push(w);
        if (!s.warned || !s.warned[w.key]) fresh.push(w);
      } else if (safeCall(w.clear, s) && s.warned) {
        delete s.warned[w.key];        // стало лучше — в следующий раз предупредим снова
      }
    }

    if (remember) {
      if (!s.warned) s.warned = {};
      for (i = 0; i < fresh.length; i++) s.warned[fresh[i].key] = s.day;
    }
    return { active: active, fresh: fresh };
  }

  /** Удача словами — чтобы игрок понимал, что она вообще делает. */
  function luckTier(v) {
    if (v >= 80) return 'Любимец фортуны';
    if (v >= 65) return 'Везунчик';
    if (v >= 40) return 'Как у всех';
    if (v >= 25) return 'Невезучий';
    return 'Полоса невезения';
  }

  /* ============================== ИЗНОС ================================== */
  /** Ночь: считаем износ и снимаем его, если игрок отдыхал по-человечески. */
  function updateStrain(s) {
    var add = 0, reasons = [];

    if (s.energy <= 5) { add += 2; reasons.push('спал по четыре часа'); }
    else if (s.energy <= 25) { add += 1; reasons.push('мало спал'); }

    if (s.health <= 40) { add += 1; reasons.push('тянул с лечением'); }
    if ((s.fatigue || 0) >= 60) { add += 1; reasons.push('работал на износ'); }
    if (s.money < 0) { add += 1; reasons.push('экономил на еде'); }
    if (s.mood <= 25) { add += 1; reasons.push('не отдыхал'); }

    if (s.energy >= 70 && s.health >= 70 && s.mood >= 60) {
      add -= B.strainRest + (perk('sleep') ? 1 : 0);   // перк «Крепкий сон»
      reasons.push('выспался по-человечески');
    }

    var before = s.strain || 0;
    s.strain = clamp(before + add, 0, B.strainMax);
    return { delta: s.strain - before, strain: s.strain, reasons: reasons };
  }

  /* ============================= СТИЛИ ИГРЫ ============================== */
  var STYLES = [
    { id: 'saver',    name: 'Экономист',      icon: '🧮', note: 'Ты считал каждую копейку и не стеснялся.' },
    { id: 'family',   name: 'Семьянин',       icon: '🏡', note: 'Дом был важнее премии. И это правильно.' },
    { id: 'career',   name: 'Карьерист',      icon: '📊', note: 'На работе тебя уважают. Дома — ждут.' },
    { id: 'risk',     name: 'Рисковый игрок', icon: '🎲', note: 'Ты шёл в риск и иногда выигрывал.' },
    { id: 'worker',   name: 'Трудяга',        icon: '🛠', note: 'Ты брался за любую подработку.' },
    { id: 'spender',  name: 'Транжира',       icon: '🛍', note: 'Жизнь одна, и ты её прожил ярко.' },
    { id: 'balanced', name: 'Держит баланс',  icon: '⚖️', note: 'Ничего лишнего, ничего потерянного.' }
  ];

  /* ============================ ДОСТИЖЕНИЯ =============================== */
  /* check(s) вызывается и во время партии, и в самом конце (s.end уже есть). */
  var ACHIEVEMENTS = [
    { id: 'friday',     icon: '📅', name: 'Пятница пережита',        note: 'Прожить неделю',              check: function (s) { return s.day >= 7; } },
    { id: 'salary',     icon: '💵', name: 'Дожил до зарплаты',       note: 'Прожить 30 дней',             check: function (s) { return s.day >= 30; } },
    { id: 'last_ruble', icon: '🪙', name: 'Последний рубль',         note: 'Жить на менее 500 ₽',         check: function (s) { return !!s.flags.was_broke; } },
    { id: 'gig_master', icon: '💪', name: 'Мастер подработки',       note: '5 подработок',                check: function (s) { return (s.counters.gigs || 0) >= 5; } },
    { id: 'car_thanks', icon: '🚗', name: 'Машина сказала спасибо',  note: 'Довести машину до 80%',       check: function (s) { return s.car.has && s.car.condition >= 80; } },
    { id: 'no_debts',   icon: '🧾', name: 'Никому ничего не должен', note: 'Без кредитов и долгов',       check: function (s) { return s.credit.debt <= 0 && !s.flags.debt_to_friend && s.car.loanLeft <= 0; } },
    { id: 'credit',     icon: '💳', name: 'Опять кредит',            note: 'Взять кредит',                check: function (s) { return !!s.flags.credit_taken; } },
    { id: 'economist',  icon: '📈', name: 'Экономист года',          note: 'Накопить 150 000 ₽',          check: function (s) { return s.money >= 150000; } },
    { id: 'family',     icon: '👨‍👩‍👧', name: 'Семейный герой',          note: 'Отношения с семьёй 85',       check: function (s) { return s.family >= 85; } },
    { id: 'career',     icon: '🏆', name: 'Любимец начальства',      note: 'Репутация на работе 85',      check: function (s) { return s.work >= 85; } },
    { id: 'zen',        icon: '🧘', name: 'Дзен',                    note: 'Здоровье и настроение 80+',   check: function (s) { return s.health >= 80 && s.mood >= 80; } },
    { id: 'overload',   icon: '🪫', name: 'На пределе',              note: 'Выжить при усталости 80+',    check: function (s) { return !!s.flags.very_tired; } },
    { id: 'charity',    icon: '❤️', name: 'Доброе сердце',           note: '3 добрых дела',               check: function (s) { return (s.counters.charity || 0) >= 3; } },
    { id: 'repairman',  icon: '🔧', name: 'Всё починил',             note: '3 поломки пережито',          check: function (s) { return (s.counters.breakdowns || 0) >= 3; } },
    { id: 'party',      icon: '🎉', name: 'Светская жизнь',          note: '5 вечеринок',                 check: function (s) { return (s.counters.parties || 0) >= 5; } },
    { id: 'risky',      icon: '🎯', name: 'Игрок',                   note: 'Склонность к риску 70+',      check: function (s) { return s.risk >= 70; } },
    { id: 'thrifty',    icon: '🏦', name: 'Отложил на чёрный день',  note: '5 раз сэкономить',            check: function (s) { return (s.counters.savings || 0) >= 5; } },
    { id: 'hundred',    icon: '🏁', name: 'Сто дней',                note: 'Дожить до конца',             check: function (s) { return !!(s.over && s.end && s.end.win); } }
  ];

  /* ============================== ФИНАЛЫ ================================= */
  /* Порядок важен: берётся первый подходящий. Последний — запасной. */
  var ENDINGS = [
    { id: 'millionaire', badge: '🏦', title: 'Рантье из панельки', sub: 'Ты накопил больше, чем зарабатывает твой начальник.',
      when: function (s) { return s.money >= 300000; } },
    { id: 'investor', badge: '📈', title: 'Инвестор поневоле', sub: 'Деньги остались. Это уже финансовая стратегия.',
      when: function (s) { return s.money >= 150000; } },
    { id: 'gig_king', badge: '💪', title: 'Король подработок', sub: 'Ты брался за всё, и это сработало.',
      when: function (s) { return (s.counters.gigs || 0) >= 6; } },
    { id: 'family_hero', badge: '🏡', title: 'Семейный человек года', sub: 'Дома тебя ждут, и это не пустые слова.',
      when: function (s) { return s.family >= 85; } },
    { id: 'boss_fav', badge: '🕴', title: 'Любимец начальства', sub: 'Тебе даже премию дали без напоминаний.',
      when: function (s) { return s.work >= 85; } },
    { id: 'zen_master', badge: '🧘', title: 'Дзен-мастер', sub: 'И здоровье, и нервы на месте. Как?',
      when: function (s) { return s.over && s.end.win && s.health >= 80 && s.mood >= 80; } },
    { id: 'clean', badge: '🧾', title: 'Чистый лист', sub: 'Ни одного долга. Редчайший случай.',
      when: function (s) { return s.over && s.end.win && s.credit.debt <= 0 && s.car.loanLeft <= 0; } },
    { id: 'car_king', badge: '🚗', title: 'Машина сказала спасибо', sub: 'Ты вложился в неё, и она доехала.',
      when: function (s) { return s.car.has && s.car.condition >= 75; } },
    { id: 'last_ruble', badge: '🪙', title: 'Жизнь на последнем рубле', sub: 'Ты дошёл до конца, считая каждую копейку.',
      when: function (s) { return s.over && s.end.win && s.money < 3000; } },
    { id: 'burnout', badge: '🪫', title: 'Выгорел на работе', sub: 'Силы кончились раньше, чем месяц.',
      when: function (s) { return s.end.cause === 'burnout'; } },
    { id: 'sick', badge: '🚑', title: 'Здоровье важнее', sub: 'Скорая, капельница и мысль «надо было раньше».',
      when: function (s) { return s.end.cause === 'health'; } },
    { id: 'broken', badge: '🫠', title: 'Сломался', sub: 'Нервы сдали, и всё стало всё равно.',
      when: function (s) { return s.end.cause === 'mood'; } },
    { id: 'debt_hole', badge: '🕳', title: 'Долговая яма', sub: 'Минус на карте стал больше, чем ты.',
      when: function (s) { return s.end.cause === 'debt'; } },
    { id: 'car_grave', badge: '🚧', title: 'Машина не доехала', sub: 'Она просила ремонта, а ты просил подождать.',
      when: function (s) { return !s.car.has && !!s.flags.car_dead; } },
    { id: 'gambler', badge: '🎲', title: 'Риск — дело благородное', sub: 'Ты играл по-крупному. Иногда это не считается.',
      when: function (s) { return s.risk >= 70; } },
    { id: 'hard_worker', badge: '🛠', title: 'Трудяга', sub: 'Ты заработал больше всех, кого знаешь.',
      when: function (s) { return s.earned >= 350000; } },
    { id: 'survivor', badge: '🏁', title: 'Выжил', sub: 'Сто дней. Зарплата снова в пятницу.',
      when: function (s) { return s.over && s.end.win; } },
    { id: 'ordinary', badge: '🧍', title: 'Обычный человек', sub: 'Как все. Это тоже неплохо.',
      when: function () { return true; } }
  ];

  function safeCall(fn, arg) {
    try { return !!fn(arg); } catch (e) { return false; }
  }

  function pickEnding(s) {
    for (var i = 0; i < ENDINGS.length; i++) {
      if (safeCall(ENDINGS[i].when, s)) return ENDINGS[i];
    }
    return ENDINGS[ENDINGS.length - 1];
  }

  function playerStyle(s) {
    for (var i = 0; i < STYLES.length; i++) {
      if (safeCall(STYLES[i].when, s)) return STYLES[i];
    }
    return STYLES[STYLES.length - 1];
  }

  /* ========================== ДОСТИЖЕНИЯ: РАБОТА ========================= */
  function checkAchievements(s) {
    var unlocked = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      if (s.achv[a.id]) continue;
      if (safeCall(a.check, s)) {
        s.achv[a.id] = s.day;
        unlocked.push({ id: a.id, icon: a.icon, name: a.name, note: a.note, day: s.day });
      }
    }
    return unlocked;
  }

  function emitUnlocked(list) {
    for (var i = 0; i < list.length; i++) emit('achievement', list[i]);
  }

  function listAchievements(s) {
    var out = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      if (s.achv[a.id]) out.push({ id: a.id, icon: a.icon, name: a.name, note: a.note, day: s.achv[a.id] });
    }
    return out;
  }

  /** Самая дорогая ошибка и самое удачное решение партии. */
  function trackExtremes(s, amount, label, icon) {
    if (!amount) return;
    if (amount < 0) {
      if (!s.worst || amount < s.worst.amount) s.worst = { amount: amount, label: label, icon: icon, day: s.day };
    } else if (amount > 0) {
      if (!s.best || amount > s.best.amount) s.best = { amount: amount, label: label, icon: icon, day: s.day };
    }
  }

  /* ================================ СЧЁТ ================================= */
  function scoreOf(s) {
    var achvCount = 0;
    for (var k in s.achv) if (Object.prototype.hasOwnProperty.call(s.achv, k)) achvCount++;

    var sc = s.day * 90
      + Math.max(0, s.money) / 120
      + s.health * 15
      + s.mood * 12
      + s.social * 7
      + s.family * 12
      + s.work * 12
      + (s.car && s.car.has ? s.car.condition * 2 : 0)
      + (s.exp || 0) * 3
      + achvCount * 350
      + (s.counters.gigs || 0) * 120
      - (s.credit ? s.credit.debt : 0) / 40
      - (s.fatigue || 0) * 2;

    return Math.max(0, Math.round(sc));
  }

  // Порог рейтинга: [очки, «ты лучше N% игроков»]. Между точками — интерполяция.
  var RATING = [
    [0, 2], [3000, 8], [5000, 18], [7000, 30], [9000, 42], [11000, 54],
    [13000, 64], [15000, 73], [17000, 81], [19000, 88], [22000, 94], [26000, 97], [32000, 99]
  ];

  function percentile(score) {
    if (score <= RATING[0][0]) return RATING[0][1];
    for (var i = 1; i < RATING.length; i++) {
      if (score <= RATING[i][0]) {
        var a = RATING[i - 1], b = RATING[i];
        var t = (score - a[0]) / (b[0] - a[0]);
        return Math.round(a[1] + t * (b[1] - a[1]));
      }
    }
    return 99;
  }

  /* ============================== КОНЦОВКА =============================== */
  function finish(cause) {
    var s = state;
    if (s.over) return s.end;

    s.over = true;
    s.await = false;

    var tpl = END_TITLES[cause] || END_TITLES.win;
    var top = topSpend(s);

    // сначала «скелет» финала: достижения и концовки смотрят на s.end
    s.end = {
      win: cause === 'win',
      cause: cause,
      title: tpl.title,
      sub: tpl.sub,
      badge: tpl.badge,
      days: s.day,
      earned: Math.round(s.earned),
      spent: Math.round(s.spent),
      causeLabel: causeLabel(s, cause, top),
      topKey: top.key,
      topAmount: top.amount,
      typeName: '',
      typeIcon: '',
      typeNote: '',
      endingId: '',
      styleName: '',
      styleIcon: '',
      score: 0,
      percent: 0,
      isRecord: false,
      bestScore: 0,
      bestPercent: 0,
      runs: 1,
      achievements: [],
      achvTotal: ACHIEVEMENTS.length,
      best: s.best,
      worst: s.worst,
      gigs: s.counters.gigs || 0,
      breakdowns: s.counters.breakdowns || 0,
      debts: s.counters.debts || 0,
      family: Math.round(s.family),
      work: Math.round(s.work),
      fatigue: Math.round(s.fatigue),
      strain: Math.round(s.strain || 0),
      risk: Math.round(s.risk),
      exp: s.exp
    };

    var unlocked = checkAchievements(s);      // финальные достижения
    var ending = pickEnding(s);
    var style = playerStyle(s);

    s.end.endingId = ending.id;
    s.end.badge = ending.badge;
    s.end.title = ending.title;
    s.end.sub = ending.sub;
    s.end.typeName = ending.title;            // совместимость с экраном финала
    s.end.typeIcon = ending.badge;
    s.end.typeNote = ending.sub;
    s.end.styleName = style.name;
    s.end.styleIcon = style.icon;
    s.end.styleNote = style.note;
    s.end.achievements = listAchievements(s);

    /* --- Цель партии и категории лидерборда -------------------------------
       Бонус за выполненную мечту идёт прямо в рейтинг, поэтому «дожить» и
       «накопить 300k» — разные по сложности задачи. */
    var goal = goalById(s.goalId) || GOALS[0];
    var goalDone = safeCall(goal.done, s);
    s.end.goalId = goal.id;
    s.end.goalIcon = goal.icon;
    s.end.goalName = goal.name;
    s.end.goalNote = goal.note;
    s.end.goalDone = goalDone;
    s.end.goalBonus = goalDone ? goal.bonus : 0;
    s.end.archName = s.archName;
    s.end.archIcon = s.archIcon;
    s.end.daily = !!s.daily;
    s.end.dailyDate = s.dailyDate || '';
    s.end.crisisName = s.crisis ? (crisisById(s.crisis.id) || {}).text || '' : '';
    s.end.seasonName = seasonOf(s.day).name;

    // категории для таблиц лидеров: у каждой свой смысл
    s.end.categories = {
      score: 0,
      money: Math.round(Math.max(0, s.money)),
      mood: Math.round(s.mood),
      saver: (s.counters.savings || 0) * 1000 + Math.round(Math.max(0, s.money) / 10)
    };

    s.end.score = scoreOf(s) + s.end.goalBonus;
    s.end.categories.score = s.end.score;
    s.end.percent = percentile(s.end.score);

    save();
    var res = Storage.commitRun(s.end);
    s.end.isRecord = res.isRecord;
    s.end.bestScore = res.meta.bestScore;
    s.end.bestPercent = res.meta.bestPercent;
    s.end.runs = res.meta.runs;
    save();

    emit('end', s.end);
    emitUnlocked(unlocked);
    return s.end;
  }

  /* =============================== ПУБЛИЧНО ============================== */
  var Game = {

    BALANCE: B,
    RATING: RATING,
    SPEND_LABELS: SPEND_LABELS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    ENDINGS: ENDINGS,
    STYLES: STYLES,
    GOALS: GOALS,
    ARCHETYPES: ARCHETYPES,
    PERKS: PERKS,
    CRISES: CRISES,

    /** Сколько событий загружено (базовые + все контент-паки). */
    eventCount: function () { return Events.count(); },

    /** Что за день сегодня: сезон, кризис, множители — для чипа в HUD. */
    today: function () {
      if (!state) return null;
      var mods = dayMods();
      return {
        season: { id: mods.season.id, icon: mods.season.icon, name: mods.season.name },
        crisis: mods.crisis ? { icon: mods.crisis.icon, text: mods.crisis.text, until: state.crisis.until } : null,
        goal: Game.goalInfo()
      };
    },

    /** Прогресс по выбранной мечте — для чипа в HUD. */
    goalInfo: function () {
      if (!state) return null;
      var goal = goalById(state.goalId) || GOALS[0];
      var progress = '';
      try { progress = goal.progress(state); } catch (e) { progress = ''; }
      return { id: goal.id, icon: goal.icon, name: goal.name, progress: progress };
    },

    /** Зерно ежедневного забега: одно и то же у всех игроков в этот день. */
    dailySeed: function (date) {
      var d = date || new Date();
      var num = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      return (Math.imul(num, 2654435761) >>> 0);
    },

    dailyDate: function (date) {
      var d = date || new Date();
      var m = d.getMonth() + 1, day = d.getDate();
      return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    },

    /** Активные критические предупреждения (для полосы в HUD). */
    warnings: function () { return state ? scanWarnings(state, false).active : []; },

    /** Удача и риск словами — для панели «Подробно». */
    luckTier: luckTier,
    describeRisk: function (v) {
      if (v >= 70) return 'случайные траты заметно чаще, рискованных событий много';
      if (v >= 40) return 'случайные траты иногда случаются';
      if (v >= 15) return 'живёшь аккуратно';
      return 'ты сама осторожность';
    },

    /** Текущее состояние (читать можно, менять — нет). */
    get: function () { return state; },

    hasSave: function () { return Storage.hasSave(); },

    saveInfo: function () {
      var save = Storage.load();
      if (!save || save.over) return null;
      return { day: save.day, money: save.money, over: save.over };
    },

    on: function (evt, cb) {
      if (!handlers[evt]) handlers[evt] = [];
      handlers[evt].push(cb);
      return Game;
    },

    /** Новая жизнь: чистое состояние и первая карточка.
        opts: { seed, goal, arch, daily, dailyDate } — зерно нужно для
        ежедневного забега (у всех игроков одинаковый набор событий). */
    newGame: function (opts) {
      state = freshState(opts);

      /* Подарок от друга из ВК, полученный до начала партии: он лежит в мете,
         потому что в момент помощи партии могло не быть. */
      var meta = Storage.meta();
      if (meta.pendingGift > 0) {
        addMoney(meta.pendingGift, 'income');
        ledger('🤝', 'Помощь друга', meta.pendingGift, 'income');
        Storage.setMeta({ pendingGift: 0 });
      }

      var card = drawCard();
      save();
      emit('card', {
        event: card,
        morning: [],
        warnings: scanWarnings(state, false).active,
        fresh: [],
        start: {
          goal: Game.goalInfo(),
          arch: state.archName,
          archIcon: state.archIcon,
          daily: state.daily
        }
      });
      return state;
    },

    /** Журнал денег за последние N дней — для модалки «Журнал расходов». */
    ledger: function (days) {
      var span = days || 7;
      if (!state || !state.ledger) return { rows: [], byCat: {}, total: 0, days: span };
      var from = state.day - span;
      var rows = [], byCat = {}, total = 0, i;
      for (i = 0; i < state.ledger.length; i++) {
        var r = state.ledger[i];
        if (r.day < from) continue;
        rows.push(r);
        total += r.delta;
        if (r.delta < 0) {
          var cat = (r.cat && SPEND_LABELS[r.cat]) ? r.cat : 'other';
          byCat[cat] = (byCat[cat] || 0) + (-r.delta);
        }
      }
      return { rows: rows.slice(-60), byCat: byCat, total: total, days: span };
    },

    /** Куплен ли перк в текущей партии (для UI). */
    hasPerk: function (id) { return perk(id); },

    /** Подарок от друга (ВК «занять в долг»): деньги приходят в партию. */
    gift: function (amount, from) {
      if (!state || state.over || !amount || amount <= 0) return false;
      addMoney(amount, 'income');
      ledger('🤝', 'Помощь друга' + (from ? ' (' + from + ')' : ''), amount, 'income');
      save();
      return true;
    },

    /** Продолжить сохранённую партию. Возвращает 'card' | 'result' | 'end' | null. */
    resume: function () {
      var save = Storage.load();
      if (!save) return null;
      state = save;
      // старые сейвы: подставляем поля, которых тогда не было
      if (!state.ledger) state.ledger = [];
      if (!state.perks) state.perks = Storage.meta().perks;
      if (!state.goalId) state.goalId = GOALS[0].id;
      if (!state.job.dailyIncome) state.job.dailyIncome = 0;
      if (!state.job.expense) state.job.expense = 1;
      if (!state.job.impulse) state.job.impulse = 1;
      if (!state.archName) state.archName = ARCHETYPES[0].name;
      if (!state.archIcon) state.archIcon = ARCHETYPES[0].icon;
      if (state.over) { emit('end', state.end); return 'end'; }
      if (state.await && state.lastResult) { emit('result', state.lastResult); return 'result'; }
      var card = state.cardId ? Events.get(state.cardId) : null;
      if (!card) card = drawCard();
      emit('card', {
        event: card,
        morning: [],
        forced: !!state.cardForced,
        warnings: scanWarnings(state, false).active,
        fresh: []
      });
      return 'card';
    },

    /** Проверка доступности варианта (для серых кнопок в UI). */
    check: function (choice) { return state ? canPick(state, choice) : { ok: false, reason: '' }; },

    /** Игрок выбрал вариант. Возвращает результат или null, если ход невозможен. */
    choose: function (index) {
      var s = state;
      if (!s || s.over || s.await) return null;

      var card = Events.get(s.cardId);
      if (!card) return null;
      var choice = card.choices[index];
      if (!choice) return null;
      if (!canPick(s, choice).ok) return null;

      var deltas = [];
      var cost = normalizeCost(choice.cost);
      var charge = costWithPerks(cost);          // с учётом перка «Связи»

      if (charge) {
        addMoney(-charge, cost.category || 'other');
        pushDelta(deltas, 'money', -charge);
      }
      applyEffects(choice.effects, deltas);

      var extras = [];
      rollRisks(choice, s, function (risk) {
        extras.push(risk.text);
        applyEffects(risk.effects, deltas);
      });

      // опыт и склонность к риску — скрытые характеристики стиля игры
      s.exp += 1;
      s.risk = clamp(s.risk + (choice.risk && choice.risk.length ? 6 : -2), 0, 100);

      // последствие: ставим событие-продолжение в очередь
      if (choice.next && choice.next.id) {
        s.queue.push({ id: choice.next.id, day: s.day + (choice.next.in || 2) });
      }

      if (s.money < 500) s.flags.was_broke = true;
      if (s.fatigue >= 80) s.flags.very_tired = true;
      if (s.energy <= 0) s.flags.exhausted = true;

      // самая дорогая ошибка и самое удачное решение
      var moneyDelta = 0, di;
      for (di = 0; di < deltas.length; di++) {
        if (deltas[di].key === 'money') moneyDelta += deltas[di].delta;
      }
      trackExtremes(s, moneyDelta, choice.label, card.icon);

      s.lastSeen[card.id] = s.day;
      if (card.once) s.flags['done_' + card.id] = true;
      s.log.unshift({ day: s.day, icon: card.icon, text: choice.label, delta: moneyDelta });
      if (s.log.length > 60) s.log.length = 60;
      // в журнал расходов: одна строка на решение игрока
      if (moneyDelta) ledger(card.icon, choice.label, moneyDelta, cost ? (cost.category || 'other') : 'other');

      s.await = true;
      s.lastResult = {
        eventId: card.id,
        icon: card.icon,
        title: card.title,
        rarity: card.rarity,
        choiceLabel: choice.label,
        text: choice.result,
        deltas: deltas,
        extras: extras
      };

      var unlocked = checkAchievements(s);
      var freshWarns = scanWarnings(s, true).fresh;   // переход через критический порог
      var cause = endCause(s);
      save();
      emit('result', s.lastResult);
      emitUnlocked(unlocked);
      for (var w = 0; w < freshWarns.length; w++) emit('warning', freshWarns[w]);
      if (cause) { finish(cause); return s.lastResult; }
      return s.lastResult;
    },

    /** Аварийный вариант: все кнопки оказались недоступны (нет денег на всё).
        День всё равно должен закончиться — иначе игрок застрянет. */
    endure: function () {
      var s = state;
      if (!s || s.over || s.await) return null;

      s.mood = clamp(s.mood - 4, 0, 100);
      s.luck = clamp(s.luck - 2, 0, 100);
      s.exp += 1;
      s.lastSeen[s.cardId] = s.day;
      s.await = true;
      s.lastResult = {
        eventId: s.cardId,
        icon: '🚬',
        title: 'День прошёл мимо',
        rarity: 'common',
        choiceLabel: 'Без вариантов',
        text: 'Ничего не сделал и ничего не потратил. Просто дожил до вечера.',
        deltas: [{ key: 'mood', delta: -4, text: '' }],
        extras: []
      };

      var unlocked = checkAchievements(s);
      var freshWarns = scanWarnings(s, true).fresh;
      var cause = endCause(s);
      save();
      emit('result', s.lastResult);
      emitUnlocked(unlocked);
      for (var w = 0; w < freshWarns.length; w++) emit('warning', freshWarns[w]);
      if (cause) finish(cause);
      return s.lastResult;
    },

    /** Сон → новый день: ночное восстановление, утренние платежи, карточка. */
    nextDay: function () {
      var s = state;
      if (!s || s.over || !s.await) return null;

      var report = [];

      // 1. Как прошла ночь на нуле сил
      if (s.energy <= 0) {
        s._lowEnergy = (s._lowEnergy || 0) + 1;
        report.push({ icon: '😵', text: 'Ночь без сил', delta: 0 });
        if (endCause(s) === 'burnout') { finish('burnout'); return null; }
      } else {
        s._lowEnergy = 0;
      }

      // 2. Износ: считаем ДО восстановления — по состоянию на конец дня.
      //    Дальше он сам же и мешает выспаться, то есть штраф накопительный.
      var strainInfo = updateStrain(s);
      if (strainInfo.delta > 0) {
        report.push({ icon: '🩹', text: 'Износ +' + strainInfo.delta, delta: 0 });
      } else if (strainInfo.delta < 0) {
        report.push({ icon: '🧘', text: 'Отдых снял износ', delta: 0 });
      }

      // 3. Восстановление: усталость и износ режут сон
      var strain = s.strain || 0;
      var cut = Math.min(B.fatigueMax, (s.fatigue || 0) / 160);
      var energyGain = Math.round(B.sleepEnergy * (1 - cut)) - Math.floor(strain / B.strainEnergyEvery);
      s.energy = clamp(s.energy + Math.max(2, energyGain), 0, 100);
      s.health = clamp(s.health + (s.mood >= 45 ? B.sleepHealth : B.sleepHealthBad)
        - Math.floor(strain / B.strainHealthEvery), 0, 100);
      s.mood = clamp(s.mood + B.sleepMood - Math.floor(strain / B.strainMoodEvery), 0, 100);
      s.fatigue = clamp((s.fatigue || 0) - B.fatigueNight * (perk('sleep') ? 2 : 1), 0, 100);
      if (cut > 0.15) {
        report.push({ icon: '🥱', text: 'Усталость не дала выспаться', delta: energyGain - B.sleepEnergy });
      }
      if (s.money < B.debtMoodLimit) {
        s.mood = clamp(s.mood + B.debtMood, 0, 100);
        report.push({ icon: '📉', text: 'Долг давит на нервы', delta: B.debtMood });
      }

      // 4. Новый день
      s.day += 1;
      if (s.day > B.maxDays) { s.day = B.maxDays; finish('win'); return null; }

      report = report.concat(tickMorning());

      /* --- Микро-кризис --------------------------------------------------
         Раз в 12 дней с шансом ~75% приходит глобальное событие на 7–30 дней:
         подорожание бензина, тарифы, распродажи или индексация. Это делает
         одинаковые дни разными и ломает одну «оптимальную» стратегию. */
      if (s.crisis && s.crisis.until < s.day) {
        var oldCrisis = crisisById(s.crisis.id);
        if (oldCrisis) report.push({ icon: '✅', text: oldCrisis.text + ' — закончилось', delta: 0 });
        s.crisis = null;
      }
      if (!s.crisis && s.day > 6 && s.day % 12 === 0 && roll() < 0.75) {
        var newCrisis = CRISES[Math.floor(roll() * CRISES.length)];
        if (newCrisis) {
          s.crisis = { id: newCrisis.id, until: s.day + newCrisis.days };
          report.push({ icon: newCrisis.icon, text: newCrisis.text + ' (' + newCrisis.days + ' дн.)', delta: 0 });
        }
      }

      s.await = false;
      s.lastResult = null;

      var cause = endCause(s);
      if (cause) { finish(cause); return null; }

      var queued = takeQueued();
      var card = drawCard(queued);
      var unlocked = checkAchievements(s);
      var warns = scanWarnings(s, true);   // один проход: активные + свежие пороги
      save();
      emit('card', { event: card, morning: report, forced: !!queued, warnings: warns.active, fresh: warns.fresh });
      emitUnlocked(unlocked);
      for (var wi = 0; wi < warns.fresh.length; wi++) emit('warning', warns.fresh[wi]);
      return report;
    },

    /** Служебное: посчитать концовку прямо сейчас (для тестов). */
    checkEnd: function () { return state ? endCause(state) : null; },

    /** Служебное для симулятора: текущий износ и предупреждения. */
    snapshot: function () {
      if (!state) return null;
      return {
        strain: state.strain || 0,
        warnings: scanWarnings(state, false).active.map(function (w) { return w.key; })
      };
    }
  };

  global.Game = Game;

  if (typeof module !== 'undefined' && module.exports) module.exports = Game;

})(typeof window !== 'undefined' ? window : globalThis);
