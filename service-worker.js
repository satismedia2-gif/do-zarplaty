/* ============================================================================
   service-worker.js — офлайн-режим и мгновенный запуск (PWA).

   Что делает:
     1) при установке кладёт в кэш всю оболочку игры (html, css, все скрипты);
     2) при обновлении версии CACHE удаляет старые кэши;
     3) на каждый GET отвечает из кэша, а сеть использует только для добора;
        если сети нет — отдаёт index.html, и игра всё равно открывается.

   ВАЖНО: service worker работает только на http/https. На file:// (двойной
   щелчок по index.html) регистрация молча пропускается — см. index.html.

   Как выпустить обновление игры: поменяй CACHE_VERSION (например, на 'v3').
   ========================================================================== */
'use strict';

var CACHE_VERSION = 'v11';
var CACHE = 'do-zarplaty-' + CACHE_VERSION;

/* ВАЖНО: cache.addAll() падает целиком, если хотя бы один файл отдаёт 404,
   и тогда service worker вообще не устанавливается (нет ни офлайна, ни
   кэша). Поэтому в списке — только те файлы, которые обязаны быть на
   хостинге. icon.svg здесь нет специально: иконку легко забыть залить,
   а SVG-фавикон — необязательная роскошь. */
var ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './js/storage.js',
  './js/events.js',
  './js/events-pack-1.js',
  './js/events-pack-2.js',
  './js/events-pack-3.js',
  './js/sound.js',
  './js/game.js',
  './js/ui.js',
  './js/vk.js',
  './js/vk-boot.js',
  './js/vk-bridge.min.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE ? null : caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  // Чужие домены (ВК, CDN моста) не трогаем вообще: раньше проверка шла
  // по подстроке в адресе, из-за чего под неё не попадал, например, jsDelivr.
  var sameOrigin = false;
  try { sameOrigin = (new URL(request.url)).origin === self.location.origin; }
  catch (e) { sameOrigin = false; }
  if (!sameOrigin) return;

  /* ЗАГРУЗКА САМОЙ СТРАНИЦЫ — отдельный случай, и раньше он был главной
     миной. ВК открывает игру с параметрами в адресе (?vk_app_id=…&vk_user_id=…),
     поэтому точного совпадения в кэше не было: запрос уходил в сеть, а при
     неудаче отдавался caches.match('./index.html'). Если кэш пуст или побился,
     возвращался undefined — а respondWith(undefined) для навигации означает
     полный отказ загрузки. В мобильном приложении это выглядит как
     «Ошибка загрузки. Проверьте подключение к сети» — ошибка ВК, а не игры.
     Теперь: навигация всегда сначала идёт в сеть (значит свежий index.html
     приходит с сервера, а не из старого кэша), а из кэша отдаём только если
     он реально есть. Пустой ответ не возвращаем НИКОГДА. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match('./index.html', { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Нет сети</title>' +
            '<p style="font:16px/1.5 sans-serif;padding:24px;color:#eee;background:#0b0e13">' +
            'Нет подключения к сети. Откройте игру, когда связь появится.</p>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () { return new Response('', { status: 504 }); });
    })
  );
});
