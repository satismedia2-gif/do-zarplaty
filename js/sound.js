/* ============================================================================
   sound.js — звук без единого аудиофайла.

   Все эффекты синтезируются WebAudio на месте: осциллятор + огибающая громкости.
   Это даёт нулевую загрузку, мгновенный отклик и никаких 404 на mp3.

   Важное про мобильные браузеры: AudioContext можно создать только после
   первого касания экрана. Поэтому UI вызывает Sound.unlock() в первом же тапе,
   а до этого Sound.play() молча ничего не делает.

   Когда понадобятся «настоящие» звуки — достаточно добавить сюда таблицу
   FILES: { tap: 'audio/tap.mp3' }, и play() начнёт использовать файл вместо
   синтеза. Остальной код игры менять не придётся.
   ========================================================================== */
(function (global) {
  'use strict';

  var FILES = {};   // id -> url, заготовка под будущие аудиофайлы

  var PATCHES = {
    // id      тип волны    ноты (Гц)                длительность  громкость
    tap:    { wave: 'square',   notes: [880],                    dur: 0.045, gain: 0.035, step: 0 },
    coin:   { wave: 'triangle', notes: [880, 1320],              dur: 0.09,  gain: 0.055, step: 0.05 },
    notify: { wave: 'sine',     notes: [660, 880],               dur: 0.16,  gain: 0.05,  step: 0.06 },
    rare:   { wave: 'triangle', notes: [523, 659, 880, 1174],    dur: 0.34,  gain: 0.055, step: 0.07 },
    win:    { wave: 'triangle', notes: [523, 659, 784, 1046],    dur: 0.55,  gain: 0.06,  step: 0.12 },
    lose:   { wave: 'sawtooth', notes: [440, 349, 262, 175],     dur: 0.7,   gain: 0.05,  step: 0.14 },
    // критическое предупреждение: низкий тревожный сигнал из двух нот
    warn:   { wave: 'sawtooth', notes: [240, 180],               dur: 0.32,  gain: 0.045, step: 0.16 }
  };

  var ctx = null;
  var master = null;
  var enabled = true;
  var bufferCache = {};

  function AudioCtor() {
    return global.AudioContext || global.webkitAudioContext || null;
  }

  function ensure() {
    if (ctx) return ctx;
    var Ctor = AudioCtor();
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function tone(patch, freq, at, dur, gain) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = patch.wave;
    osc.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function synth(id) {
    var patch = PATCHES[id] || PATCHES.tap;
    var now = ctx.currentTime + 0.01;
    for (var i = 0; i < patch.notes.length; i++) {
      tone(patch, patch.notes[i], now + i * (patch.step || 0), patch.dur, patch.gain);
    }
  }

  function file(onDone, url) {           // заготовка, сейчас не используется
    try {
      if (!bufferCache[url]) {
        var req = new global.XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = 'arraybuffer';
        req.onload = function () {
          ctx.decodeAudioData(req.response, function (buf) {
            bufferCache[url] = buf;
            onDone(buf);
          }, function () { onDone(null); });
        };
        req.onerror = function () { onDone(null); };
        req.send();
        return;
      }
      onDone(bufferCache[url]);
    } catch (e) { onDone(null); }
  }

  var Sound = {

    /** Включает/выключает звук (флаг приходит из Storage.meta). */
    init: function (on) { enabled = on !== false; },

    /** Создаёт AudioContext. Вызывается из первого касания экрана. */
    unlock: function () {
      var c = ensure();
      if (!c) return false;
      if (c.state === 'suspended' && c.resume) { try { c.resume(); } catch (e) { /* ignore */ } }
      return true;
    },

    isOn: function () { return enabled; },

    set: function (on) {
      enabled = !!on;
      if (enabled) { Sound.unlock(); Sound.play('notify'); }
      return enabled;
    },

    toggle: function () { return Sound.set(!enabled); },

    /** Проигрывает эффект по id. Безопасен до инициализации и без WebAudio. */
    play: function (id) {
      if (!enabled) return false;
      var c = ensure();
      if (!c || c.state === 'suspended') return false;

      if (FILES[id] && global.XMLHttpRequest) {
        file(function (buf) {
          if (!buf) return synth(id);
          var src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(master);
          src.start();
        }, FILES[id]);
        return true;
      }

      try { synth(id); return true; } catch (e) { return false; }
    }
  };

  global.Sound = Sound;

  if (typeof module !== 'undefined' && module.exports) module.exports = Sound;

})(typeof window !== 'undefined' ? window : globalThis);
