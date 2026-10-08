/* ============================================================================
   vk.js — обвязка для VK Mini Apps.

   Локально (файл открыт двойным щелчком) модуль молчит: он включается только
   внутри iframe, то есть когда игра реально запущена в ВК.

   Что делает:
     1) подгружает официальный VK Bridge и вызывает VKWebAppInit — без этого
        приложение в каталоге ВК висит на бесконечном лоадере;
     2) красит шапку и нижнюю панель под тёмную тему игры;
     3) даёт облачный сейв (VK Storage) — прогресс не теряется при смене
        устройства, телефон→компьютер;
     4) умеет поделиться результатом и отправить тактильный отклик (haptic);
     5) глушит «резинку» страницы, чтобы карточки не дёргались под пальцем.

   Все вызовы необязательные: если ВК не ответил, игра работает на localStorage.
   ========================================================================== */
(function (global) {
  'use strict';

  var inFrame = false;
  try { inFrame = !!(global.parent && global.parent !== global); }
  catch (e) { inFrame = true; }               // чужой origin = точно iframe

  if (!inFrame) return;                        // локальная версия остаётся офлайн-игрой

  var BRIDGE_URL = 'https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js';
  var CLOUD_KEY = 'dz_save';
  var ready = false;
  var queue = [];

  function bridge() { return global.vkBridge; }

  function flush() {
    ready = true;
    var list = queue; queue = [];
    for (var i = 0; i < list.length; i++) {
      try { list[i](); } catch (e) { /* ignore */ }
    }
  }

  function call(method, params) {
    var b = bridge();
    if (!b || !b.send) return null;
    try {
      var p = b.send(method, params || {});
      return (p && typeof p.catch === 'function') ? p.catch(function () { return null; }) : p;
    } catch (e) { return null; }
  }

  /** Ставит вызов в очередь, пока VK Bridge не загрузился. */
  function whenReady(fn) {
    if (ready) { try { fn(); } catch (e) { /* ignore */ } }
    else queue.push(fn);
  }

  function bootBridge() {
    whenReady(function () {
      call('VKWebAppInit', {});
      call('VKWebAppSetViewSettings', {
        status_bar_style: 'dark',
        action_bar_color: '#0b0e13',
        navigation_bar_color: '#0b0e13'
      });
    });
  }

  /* ------------------------------------------------------------- тактильность */
  function haptic(kind) {
    var map = {
      light: 'VKWebAppTapticTimeSelection',
      medium: 'VKWebAppTapticImpactOccurred',
      success: 'VKWebAppTapticNotificationOccurred',
      error: 'VKWebAppTapticNotificationOccurred'
    };
    var method = map[kind] || map.light;
    var params = {};
    if (method === 'VKWebAppTapticImpactOccurred') params.style = kind === 'heavy' ? 'heavy' : 'medium';
    if (method === 'VKWebAppTapticNotificationOccurred') params.type = kind === 'error' ? 'error' : 'success';
    if (method === 'VKWebAppTapticTimeSelection') params.type = 'light';
    whenReady(function () { call(method, params); });
  }

  /* ------------------------------------------------------ кто наш игрок ---- */
  /* ВАЖНО ДЛЯ ПУБЛИКАЦИИ: VK Storage общий для ВСЕГО приложения, а не для
     пользователя. Если писать сейв в один ключ dz_save, игроки будут
     перезаписывать партии друг друга. Поэтому все ключи — с id игрока.
     id берём из подписанных launch-параметров ВК, с запасным путём через
     VKWebAppGetUserInfo. */
  var USER = { id: null, appId: null, name: '' };

  function readLaunchParams() {
    try {
      var q = global.location.search || '';
      var m;
      if ((m = /[?&]vk_app_id=(\d+)/.exec(q))) { USER.appId = m[1]; global.__VK_APP_ID = m[1]; }
      if ((m = /[?&]vk_user_id=(\d+)/.exec(q))) USER.id = m[1];
    } catch (e) { /* не ВК — не страшно */ }

    whenReady(function () {
      var p = call('VKWebAppGetLaunchParams', {});
      if (!p || !p.then) return;
      p.then(function (res) {
        if (!res) return;
        if (res.vk_app_id) { USER.appId = String(res.vk_app_id); global.__VK_APP_ID = USER.appId; }
        if (res.vk_user_id) USER.id = String(res.vk_user_id);
      }).catch(function () { /* старый клиент — обойдёмся без launch-параметров */ });
    });
  }

  /** Гарантированно получает id игрока (или null, если ВК не ответил). */
  function ensureUser(cb) {
    if (USER.id) { cb(USER.id); return; }
    whenReady(function () {
      var p = call('VKWebAppGetUserInfo', {});
      if (!p || !p.then) { cb(null); return; }
      p.then(function (info) {
        if (info && info.id) {
          USER.id = String(info.id);
          USER.name = info.first_name || '';
          cb(USER.id);
        } else cb(null);
      }).catch(function () { cb(null); });
    });
  }

  /* ------------------------------------------------------------ облако ------ */
  function compact(state) {
    /* VK Storage ограничен 4096 байтами на ключ. Не шлём то, что легко
       восстанавливается: журнал расходов (до 420 записей — это десятки
       килобайт), кулдауны, историю и служебные поля. */
    var copy = {};
    for (var k in state) {
      if (!Object.prototype.hasOwnProperty.call(state, k)) continue;
      if (k === 'log' || k === 'lastSeen' || k === 'ledger' || k.charAt(0) === '_') continue;
      copy[k] = state[k];
    }
    return JSON.stringify(copy);
  }

  var VK = {

    inFrame: true,
    isReady: function () { return ready; },
    userId: function () { return USER.id; },
    appId: function () { return USER.appId; },

    /** Облачный сейв. Ключ персональный: dz_save_<id игрока>. */
    cloudSave: function (state) {
      if (!state) return;
      var value;
      try { value = compact(state); } catch (e) { return; }
      if (value.length > 4000) return;         // не рискуем лимитом ключа
      ensureUser(function (id) {
        var key = id ? CLOUD_KEY + '_' + id : CLOUD_KEY;
        whenReady(function () {
          call('VKWebAppStorageSet', { key: key, value: value });
        });
      });
    },

    cloudLoad: function (onDone) {
      ensureUser(function (id) {
        if (!id) { onDone(null); return; }
        whenReady(function () {
          var p = call('VKWebAppStorageGet', { keys: [CLOUD_KEY + '_' + id] });
          if (!p || !p.then) { onDone(null); return; }
          p.then(function (res) {
            var item = res && res.keys && res.keys[0];
            if (!item || !item.value) { onDone(null); return; }
            try { onDone(JSON.parse(item.value)); } catch (e) { onDone(null); }
          }).catch(function () { onDone(null); });
        });
      });
    },

    /** Репост результата на стену. Если окно ВК недоступно — молча выходим. */
    share: function (text) {
      whenReady(function () {
        var appLink = global.__VK_APP_ID
          ? 'https://vk.com/app' + global.__VK_APP_ID
          : global.location.href;
        call('VKWebAppShowWallPostBox', { message: text + '\n' + appLink });
      });
    },

    /**
     * Таблицы лидеров по категориям: рейтинг, богатство, настроение, экономия.
     * Смысл — в топе должны быть разные стили игры, а не одна стратегия.
     * ID таблиц задаются в настройках приложения ВК (0 = общая).
     */
    LEADERBOARDS: { score: 0, money: 0, mood: 0, saver: 0 },

    /** Профиль игрока: нужен для «занять у друга» — ключи привязаны к id. */
    me: function (onDone) {
      whenReady(function () {
        var p = call('VKWebAppGetUserInfo', {});
        if (!p || !p.then) { onDone(null); return; }
        p.then(function (info) { onDone(info || null); }).catch(function () { onDone(null); });
      });
    },

    /**
     * Попросить денег у друга. Ключ dz_ask_<мой id> лежит в общем хранилище
     * приложения, поэтому друг может его прочитать и ответить.
     * Другу уходит ссылка с якорем #help=<id>&sum=<сумма>.
     */
    askHelp: function (myId, amount, myName, onDone) {
      if (!myId) { onDone(false); return; }
      var payload = JSON.stringify({
        id: myId, name: myName || 'Игрок', amount: Math.round(amount),
        status: 'open', day: new Date().toISOString().slice(0, 10)
      });
      whenReady(function () {
        var appId = global.__VK_APP_ID || '';
        var link = 'https://vk.com/app' + appId + '#help=' + myId + '&sum=' + Math.round(amount);
        var set = call('VKWebAppStorageSet', { key: 'dz_ask_' + myId, value: payload });
        var done = function (ok) {
          if (!ok) { if (onDone) onDone(false); return; }
          call('VKWebAppShare', { link: link });
          if (onDone) onDone(true);
        };
        if (set && set.then) set.then(function () { done(true); }).catch(function () { done(false); });
        else done(true);
      });
    },

    /** Ответ друга: пишем в тот же ключ статус «дал». */
    giveHelp: function (askerId, amount, myName, onDone) {
      if (!askerId) { if (onDone) onDone(false); return; }
      var payload = JSON.stringify({
        id: askerId, from: myName || 'Друг', amount: Math.round(amount),
        status: 'given', day: new Date().toISOString().slice(0, 10)
      });
      whenReady(function () {
        var p = call('VKWebAppStorageSet', { key: 'dz_ask_' + askerId, value: payload });
        if (p && p.then) p.then(function () { if (onDone) onDone(true); }).catch(function () { if (onDone) onDone(false); });
        else if (onDone) onDone(true);
      });
    },

    /** Проверить, ответил ли кто-то на мою просьбу. */
    checkHelp: function (myId, onDone) {
      if (!myId) { onDone(null); return; }
      whenReady(function () {
        var p = call('VKWebAppStorageGet', { keys: ['dz_ask_' + myId] });
        if (!p || !p.then) { onDone(null); return; }
        p.then(function (res) {
          var item = res && res.keys && res.keys[0];
          if (!item || !item.value) { onDone(null); return; }
          try { onDone(JSON.parse(item.value)); } catch (e) { onDone(null); }
        }).catch(function () { onDone(null); });
      });
    },

    clearHelp: function (myId) {
      if (!myId) return;
      whenReady(function () {
        call('VKWebAppStorageSet', { key: 'dz_ask_' + myId, value: '' });
      });
    },

    /**
     * Нативные Stories. Работают только если задан __VK_STORY_BG — публичный
     * https-URL картинки 1080×1920 (ВК не принимает локальные файлы).
     * Возвращает false, если нативный путь недоступен — тогда UI рисует
     * карточку на canvas и отдаёт её через Web Share API.
     */
    story: function (backgroundUrl, text) {
      if (!backgroundUrl) return false;
      whenReady(function () {
        call('VKWebAppShowStoryBox', {
          background_type: 'image',
          url: backgroundUrl,
          attachment: {
            text: 'open',
            type: 'url',
            url: 'https://vk.com/app' + (global.__VK_APP_ID || '')
          }
        });
      });
      return true;
    },

    leaderboard: function (score, category) {
      var id = VK.LEADERBOARDS[category || 'score'];
      if (!id) id = VK.LEADERBOARDS.score;
      whenReady(function () { call('VKWebAppShowLeaderBoardBox', { user_result: Math.round(score) }); });
    },

    /** Результат ежедневного забега: ключ тоже персональный. */
    saveDaily: function (date, score) {
      if (!date) return;
      ensureUser(function (id) {
        if (!id) return;
        whenReady(function () {
          call('VKWebAppStorageSet', {
            key: 'dz_daily_' + date + '_' + id,
            value: String(Math.round(score))
          });
        });
      });
    },

    loadDaily: function (date, onDone) {
      ensureUser(function (id) {
        if (!id || !date) { onDone(null); return; }
        whenReady(function () {
          var p = call('VKWebAppStorageGet', { keys: ['dz_daily_' + date + '_' + id] });
          if (!p || !p.then) { onDone(null); return; }
          p.then(function (res) {
            var item = res && res.keys && res.keys[0];
            onDone(item && item.value ? Number(item.value) : null);
          }).catch(function () { onDone(null); });
        });
      });
    },

    haptic: haptic
  };

  global.VK = VK;

  /* -------------------------------------------------------------- загрузка -- */
  readLaunchParams();

  var s = global.document.createElement('script');
  s.src = BRIDGE_URL;
  s.async = true;
  s.onload = function () { bootBridge(); flush(); };
  s.onerror = function () { /* нет сети/ВК — играем как обычный сайт */ };
  global.document.head.appendChild(s);

  /* «резинка» и зум внутри iframe ВК сильно мешают играть пальцем */
  try {
    global.document.documentElement.style.overscrollBehavior = 'none';
    global.document.body.style.overscrollBehavior = 'none';
  } catch (e) { /* ignore */ }

  global.setTimeout(function () { if (!ready) flush(); }, 3000);

})(typeof window !== 'undefined' ? window : globalThis);
