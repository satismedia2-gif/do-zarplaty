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

var CACHE_VERSION = 'v2';
var CACHE = 'do-zarplaty-' + CACHE_VERSION;

var ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon.svg',
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
  './js/vk.js'
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

  // Запросы к ВК и к CDN не кэшируем: там живые данные и чужие файлы.
  if (request.url.indexOf('vk.com') !== -1 || request.url.indexOf('unpkg.com') !== -1) return;

  event.respondWith(
    caches.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        return response;
      }).catch(function () {
        return caches.match('./index.html');   // офлайн: отдаём оболочку
      });
    })
  );
});
