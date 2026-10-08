/* ============================================================================
   vk-boot.js — САМОЕ ПЕРВОЕ, что должно случиться внутри ВКонтакте.

   ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ. ВК держит свой лоадер, пока приложение не пришлёт
   VKWebAppInit, и если не дождался — показывает «Ошибка загрузки. Проверьте
   подключение к сети». Раньше этот сигнал уходил из js/vk.js, который
   подключён ПОСЛЕДНИМ: сначала на устройство скачивались ~460 КБ игровых
   скриптов, и только потом подгружался VK Bridge. На медленной мобильной
   сети ВК не дожидался и рисовал ошибку, хотя игра под ней уже работала —
   именно поэтому она «появлялась» после нажатия «Показать консоль».

   Теперь мост грузится первым, вместе с шапкой документа, и сигнал уходит
   через десятки миллисекунд, независимо от размера игры.

   Файл ничего не рисует и ни от чего не зависит: если он не в iframe или ВК
   не ответил — молча выходит, игра работает как обычный сайт.
   ========================================================================== */
(function (global) {
  'use strict';

  var inFrame = false;
  try { inFrame = !!(global.parent && global.parent !== global); }
  catch (e) { inFrame = true; }              // чужой origin = точно iframe

  if (!inFrame) return;

  var SOURCES = [
    'js/vk-bridge.min.js',
    'https://cdn.jsdelivr.net/npm/@vkontakte/vk-bridge/dist/browser.min.js',
    'https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js'
  ];

  var t0 = Date.now();
  var done = false;

  function send() {
    if (done) return;
    var b = global.vkBridge;
    if (!b || !b.send) return;
    done = true;
    try {
      b.send('VKWebAppInit', {});
      global.__DZ_VK_READY_MS = Date.now() - t0;   // для диагностики
    } catch (e) { /* очень старый клиент — жить можно */ }
  }

  function load(i) {
    if (done || i >= SOURCES.length) return;
    var s = global.document.createElement('script');
    s.src = SOURCES[i];
    s.async = true;
    s.onload = function () {
      if (global.vkBridge) send();
      else load(i + 1);                    // файл загрузился, но это не мост
    };
    s.onerror = function () { load(i + 1); };
    (global.document.head || global.document.documentElement).appendChild(s);
  }

  load(0);

  /* Страховка для мобильных WebView: у динамического скрипта иногда не
     срабатывает onload. Тогда ловим появление моста опросом. */
  var tries = 0;
  var poll = global.setInterval(function () {
    if (done || ++tries > 100) { global.clearInterval(poll); return; }
    if (global.vkBridge) { global.clearInterval(poll); send(); }
  }, 50);

})(typeof window !== 'undefined' ? window : globalThis);
