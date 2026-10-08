/* ============================================================================
   storage.js — сохранение прогресса и мета-данных.

   Где лежит:
     localStorage['dz.save.v1'] — текущая партия (состояние игры целиком);
     localStorage['dz.meta.v1'] — рекорды, число попыток, флаг звука.

   Правила, которые важно не нарушать:
     1) Здесь только JSON-совместимые данные. Никаких функций и ссылок на DOM.
     2) Ключи, начинающиеся с «_», не сохраняются: это временные поля кадра
        (например, счётчик подряд идущих дней без сил).
     3) Сейв версионирован. Если структура поменяется — поднимаем SAVE_VERSION
        и дописываем ветку в migrate(), старые партии не теряются.

   Модуль работает и в Node (для tools/simulate.js): localStorage там
   подменяется заглушкой, поэтому все обращения обёрнуты в try/catch.
   ========================================================================== */
(function (global) {
  'use strict';

  var SAVE_KEY = 'dz.save.v1';
  var META_KEY = 'dz.meta.v1';
  var SAVE_VERSION = 1;   // поднимать при несовместимом изменении структуры

  var DEFAULT_META = {
    soundOn: true,
    bestScore: 0,
    bestDays: 0,
    bestPercent: 0,
    bestAchv: 0,
    runs: 0,

    /* --- МЕТА-ПРОГРЕССИЯ -------------------------------------------------
       Очки опыта и перки живут между партиями: за каждый забег игрок
       получает очки и может купить постоянные бонусы. Это то, что тянет
       игрока начать «ещё один забег» после проигрыша. */
    points: 0,                 // неизрасходованные очки
    perks: {},                 // id перка -> уровень (0/1)
    theme: 'dark',             // dark | light | retro
    goalsDone: {},             // id цели -> сколько раз выполнена
    dailyDate: '',             // дата последнего ежедневного забега
    dailyBest: 0,              // лучший результат в ежедневном забеге
    pendingGift: 0             // подарок от друга, ждущий начала партии
  };

  /** Уровни перков по умолчанию (нужны миграции и подсчёту бонусов). */
  var PERK_KEYS = ['cashback', 'sleep', 'connections', 'hustle', 'luck'];

  function perkLevels(raw) {
    var out = {};
    for (var i = 0; i < PERK_KEYS.length; i++) {
      var v = raw && raw[PERK_KEYS[i]];
      out[PERK_KEYS[i]] = (typeof v === 'number' && v > 0) ? 1 : 0;
    }
    return out;
  }

  /* ------------------------------------------------------------- утилиты -- */
  function storage() {
    try {
      var ls = global.localStorage;
      if (!ls) return null;
      // Safari в приватном режиме умеет кидаться на запись — проверим заранее
      return ls;
    } catch (e) { return null; }
  }

  function readJSON(key) {
    var ls = storage();
    if (!ls) return null;
    try {
      var raw = ls.getItem(key);
      if (!raw) return null;
      var val = JSON.parse(raw);
      return (val && typeof val === 'object') ? val : null;
    } catch (e) { return null; }
  }

  function writeJSON(key, value) {
    var ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      // переполнение квоты или запрет записи — игра продолжает работать в памяти
      return false;
    }
  }

  function dropKey(key) {
    var ls = storage();
    if (!ls) return;
    try { ls.removeItem(key); } catch (e) { /* ignore */ }
  }

  function shallowCopy(src) {
    var out = {};
    for (var k in src) {
      if (Object.prototype.hasOwnProperty.call(src, k) && k.charAt(0) !== '_') out[k] = src[k];
    }
    return out;
  }

  /* -------------------------------------------------------------- публично - */
  var Storage = {

    KEY: SAVE_KEY,
    META_KEY: META_KEY,
    VERSION: SAVE_VERSION,

    /** Читает партию. Возвращает null, если сейва нет или он битый. */
    load: function () {
      var save = readJSON(SAVE_KEY);
      if (!save) return null;
      if (!save.v || !save.day) return null;
      return Storage.migrate(save);
    },

    /** Есть ли незавершённая партия (для кнопки «Продолжить»). */
    hasSave: function () {
      var save = readJSON(SAVE_KEY);
      return !!(save && save.day && !save.over);
    },

    /** Сохраняет партию. Служебные поля «_» отбрасываются. */
    save: function (state) {
      if (!state || !state.day) return false;
      return writeJSON(SAVE_KEY, shallowCopy(state));
    },

    clear: function () { dropKey(SAVE_KEY); },

    /** Мета: рекорды и настройки. Всегда возвращает полный объект. */
    meta: function () {
      var stored = readJSON(META_KEY) || {};
      var out = {};
      for (var k in DEFAULT_META) {
        out[k] = Object.prototype.hasOwnProperty.call(stored, k) ? stored[k] : DEFAULT_META[k];
      }
      out.perks = perkLevels(out.perks);
      if (!out.goalsDone || typeof out.goalsDone !== 'object') out.goalsDone = {};
      if (typeof out.points !== 'number' || !isFinite(out.points) || out.points < 0) out.points = 0;
      if (['dark', 'light', 'retro'].indexOf(out.theme) === -1) out.theme = 'dark';
      return out;
    },

    /** Сколько очков приносит партия: за рейтинг + бонус за выживание. */
    pointsFor: function (end) {
      var pts = Math.floor((end.score || 0) / 400);
      if (end.win) pts += 4;
      pts += Math.floor(((end.achievements || []).length) / 4);
      if (end.goalDone) pts += 3;
      return Math.max(0, pts);
    },

    setMeta: function (patch) {
      var meta = Storage.meta();
      for (var k in patch) {
        if (Object.prototype.hasOwnProperty.call(patch, k)) meta[k] = patch[k];
      }
      writeJSON(META_KEY, meta);
      return meta;
    },

    /** Записывает результат партии: рекорды, очки, статистику целей. */
    commitRun: function (end) {
      var meta = Storage.meta();
      var isRecord = end.score > meta.bestScore;
      meta.runs += 1;
      if (isRecord) {
        meta.bestScore = end.score;
        meta.bestDays = end.days;
        meta.bestPercent = end.percent;
      }
      var achvCount = (end.achievements && end.achievements.length) || 0;
      if (achvCount > meta.bestAchv) meta.bestAchv = achvCount;

      // мета-прогрессия
      var earned = Storage.pointsFor(end);
      meta.points += earned;
      end.pointsEarned = earned;
      if (end.goalId) {
        if (!meta.goalsDone[end.goalId]) meta.goalsDone[end.goalId] = 0;
        if (end.goalDone) meta.goalsDone[end.goalId] += 1;
      }
      if (end.daily) {
        meta.dailyDate = end.dailyDate || meta.dailyDate;
        if (end.score > meta.dailyBest) meta.dailyBest = end.score;
      }

      writeJSON(META_KEY, meta);
      return { meta: meta, isRecord: isRecord, points: earned };
    },

    /** Покупка перка за очки. Возвращает {ok, reason, meta}. */
    buyPerk: function (id, cost) {
      var meta = Storage.meta();
      if (meta.perks[id]) return { ok: false, reason: 'уже куплено', meta: meta };
      if (meta.points < cost) return { ok: false, reason: 'не хватает очков', meta: meta };
      meta.points -= cost;
      meta.perks[id] = 1;
      writeJSON(META_KEY, meta);
      return { ok: true, reason: '', meta: meta };
    },

    setTheme: function (theme) {
      return Storage.setMeta({ theme: theme });
    },

    resetMeta: function () { dropKey(META_KEY); },

    /** Приводит старый сейв к текущей версии. Сейчас ветка одна — v1. */
    migrate: function (save) {
      if (!save.spendBy) save.spendBy = {};
      var cats = ['car', 'credit', 'food', 'home', 'fun', 'health', 'other'];
      for (var i = 0; i < cats.length; i++) {
        if (typeof save.spendBy[cats[i]] !== 'number') save.spendBy[cats[i]] = 0;
      }
      if (!save.flags) save.flags = {};
      if (!save.lastSeen) save.lastSeen = {};
      if (!Array.isArray(save.log)) save.log = [];
      if (typeof save.rngCalls !== 'number') save.rngCalls = 0;
      if (typeof save.await !== 'boolean') save.await = false;
      if (!save.credit) save.credit = { debt: 0, payment: 6200 };
      if (!save.car) save.car = { has: false, condition: 0, loanLeft: 0, loanPayment: 0 };
      if (!save.job) save.job = { salary: 52000, advance: 20000 };

      // поля, добавленные вместе с цепочками, скрытыми характеристиками и достижениями
      if (!save.counters) save.counters = {};
      var counters = ['gigs', 'breakdowns', 'debts', 'parties', 'charity', 'repairs', 'savings'];
      for (var c = 0; c < counters.length; c++) {
        if (typeof save.counters[counters[c]] !== 'number') save.counters[counters[c]] = 0;
      }
      if (!save.achv || typeof save.achv !== 'object') save.achv = {};
      if (!Array.isArray(save.queue)) save.queue = [];
      if (save.best === undefined) save.best = null;
      if (save.worst === undefined) save.worst = null;
      if (typeof save.cardForced !== 'boolean') save.cardForced = false;
      if (typeof save.strain !== 'number') save.strain = 0;
      if (!save.warned || typeof save.warned !== 'object') save.warned = {};

      /* --- САНИТАРНАЯ ПРОВЕРКА ЧИСЕЛ -------------------------------------
         ЗАЧЕМ: если сейв побился (старая версия, ручная правка, случайный
         null из контента), любая арифметика даёт NaN, и партия умирает
         молча — на экране «NaN ₽». Здесь мы приводим все числовые поля
         к безопасным значениям, а показатели зажимаем в 0…100. */
      var defaults = {
        money: 26000, health: 82, energy: 76, mood: 62, social: 58,
        family: 62, work: 55, fatigue: 0, luck: 50, risk: 0, exp: 0,
        earned: 0, spent: 0, day: 1, rngCalls: 0, seed: 1
      };
      for (var key in defaults) {
        if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;
        var value = save[key];
        if (typeof value !== 'number' || !isFinite(value)) save[key] = defaults[key];
      }

      var percents = ['health', 'energy', 'mood', 'social', 'family', 'work', 'fatigue', 'luck', 'risk'];
      for (var p = 0; p < percents.length; p++) {
        var val = save[percents[p]];
        save[percents[p]] = val < 0 ? 0 : (val > 100 ? 100 : val);
      }

      save.strain = save.strain < 0 ? 0 : (save.strain > 10 ? 10 : save.strain);
      save.exp = save.exp < 0 ? 0 : save.exp;

      save.v = SAVE_VERSION;
      return save;
    }
  };

  global.Storage = Storage;

  // для tools/simulate.js
  if (typeof module !== 'undefined' && module.exports) module.exports = Storage;

})(typeof window !== 'undefined' ? window : globalThis);
