/* ============================================================================
   ui.js — весь DOM. Никакой логики игры: только отрисовка того, что сообщает
   game.js, и передача нажатий обратно в Game.choose / Game.nextDay.

   Разметка трёх экранов живёт в index.html, здесь только наполнение.
   HUD — сверху (туда не дотянуться пальцем), кнопки выбора — снизу,
   в зоне большого пальца, минимум 60 px по высоте.
   ========================================================================== */
(function (global) {
  'use strict';

  var doc = global.document;

  /* --------------------------------------------------------------- утилиты - */
  function $(id) { return doc.getElementById(id); }

  function groupDigits(n) {
    return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
  }

  function money(n) { return groupDigits(n) + '\u00a0₽'; }

  function signedMoney(n) {
    return (n > 0 ? '+' : '−') + groupDigits(n) + '\u00a0₽';
  }

  function plural(n, forms) {
    var a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  var STATS = [
    { key: 'health', ico: '❤️', title: 'Здоровье' },
    { key: 'energy', ico: '⚡', title: 'Силы' },
    { key: 'mood',   ico: '🙂', title: 'Настроение' },
    { key: 'social', ico: '🤝', title: 'Отношения' }
  ];

  var DELTA_META = {
    money:        { ico: '💰', unit: '₽' },
    health:       { ico: '❤️', unit: '' },
    energy:       { ico: '⚡', unit: '' },
    mood:         { ico: '🙂', unit: '' },
    social:       { ico: '🤝', unit: '' },
    family:       { ico: '👨‍👩‍👧', unit: '' },
    work:         { ico: '💼', unit: '' },
    fatigue:      { ico: '🥱', unit: '' },
    luck:         { ico: '🍀', unit: '' },
    risk:         { ico: '🎲', unit: '' },
    exp:          { ico: '🎓', unit: '' },
    carCondition: { ico: '🚗', unit: '%' },
    debt:         { ico: '💳', unit: '₽' },
    car:          { ico: '🚗', unit: '' },
    gigs:         { ico: '💪', unit: '' },
    breakdowns:   { ico: '🔧', unit: '' },
    debts:        { ico: '🕳', unit: '' },
    parties:      { ico: '🎉', unit: '' },
    charity:      { ico: '❤️', unit: '' },
    repairs:      { ico: '🛠', unit: '' },
    savings:      { ico: '🏦', unit: '' }
  };

  // как показывать скрытые характеристики в панели «Подробно»
  var DETAIL_ROWS = [
    { key: 'health',   icon: '❤️', name: 'Здоровье',   unit: '' },
    { key: 'energy',   icon: '⚡', name: 'Силы',       unit: '' },
    { key: 'mood',     icon: '🙂', name: 'Настроение', unit: '' },
    { key: 'social',   icon: '🤝', name: 'Отношения',  unit: '' },
    { key: 'family',   icon: '👨‍👩‍👧', name: 'Семья',      unit: '' },
    { key: 'work',     icon: '💼', name: 'Работа',     unit: '' },
    { key: 'fatigue',  icon: '🥱', name: 'Усталость',  unit: '' },
    { key: 'luck',     icon: '🍀', name: 'Удача',      unit: '' },
    { key: 'risk',     icon: '🎲', name: 'Склонность к риску', unit: '' }
  ];

  var COUNTER_ROWS = [
    { key: 'gigs',       icon: '💪', name: 'Подработок' },
    { key: 'breakdowns', icon: '🔧', name: 'Поломок пережито' },
    { key: 'debts',      icon: '🕳', name: 'Долгов набрано' },
    { key: 'parties',    icon: '🎉', name: 'Вечеринок' },
    { key: 'charity',    icon: '❤️', name: 'Добрых дел' },
    { key: 'savings',    icon: '🏦', name: 'Раз сэкономил' }
  ];

  var RARITY_LABEL = {
    common: 'Обычное событие',
    uncommon: 'Необычное событие',
    rare: 'Редкое событие',
    epic: 'Эпичное событие'
  };

  var el = {};
  var current = 'start';
  var statNodes = {};
  var toastTimer = null;
  var achvTimer = null;
  var lastCardPayload = null;   // последняя карточка: нужна, если кнопка устарела

  /* ------------------------------------------------------------ переключение */
  function screen(name) {
    var map = { start: 'screen-start', game: 'screen-game', end: 'screen-end' };
    for (var key in map) {
      var node = $(map[key]);
      if (node) node.classList.toggle('is-active', key === name);
    }
    current = name;
    var table = $('table');
    if (table) table.scrollTop = 0;
  }

  /* -------------------------------------------------------------------- HUD - */
  function buildStats() {
    el.hudStats.innerHTML = '';
    for (var i = 0; i < STATS.length; i++) {
      var st = STATS[i];
      var wrap = doc.createElement('div');
      wrap.className = 'stat';
      wrap.id = 'stat-' + st.key;
      wrap.innerHTML =
        '<span class="stat-ico">' + st.ico + '</span>' +
        '<span class="stat-bar"><i></i></span>' +
        '<span class="stat-val">0</span>';
      el.hudStats.appendChild(wrap);
      statNodes[st.key] = { root: wrap, bar: wrap.querySelector('i'), val: wrap.querySelector('.stat-val') };
    }
  }

  function renderHUD() {
    var s = Game.get();
    if (!s) return;

    el.hudDay.textContent = s.day;
    el.hudMoney.textContent = (s.money < 0 ? '−' : '') + money(s.money);
    el.hudMoney.classList.toggle('minus', s.money < 0);
    // критический кошелёк: мигает, когда денег меньше 1 000 ₽
    el.hudMoney.classList.toggle('crit', s.money < 1000);

    var critical = false;
    for (var i = 0; i < STATS.length; i++) {
      var st = STATS[i], node = statNodes[st.key];
      var v = Math.round(s[st.key]);
      if (v <= 15) critical = true;
      node.root.classList.toggle('danger', v <= 25);
      node.root.classList.toggle('crit', v <= 15);
      node.bar.style.width = v + '%';
      node.bar.style.background = v <= 25 ? 'var(--red)' : (v <= 50 ? 'var(--amber)' : 'var(--lime)');
      node.val.textContent = v;
    }

    // красная подсветка краёв экрана, когда совсем плохо
    if (s.money < 0 || critical) doc.body.classList.add('crit');
    else doc.body.classList.remove('crit');

    if (s.car.has) {
      el.hudCar.classList.remove('hidden', 'dead');
      var tail = s.car.loanLeft > 0
        ? ' · кредит: ' + s.car.loanLeft + ' ' + plural(s.car.loanLeft, ['платёж', 'платежа', 'платежей'])
        : ' · кредит закрыт';
      el.hudCar.innerHTML = '🚗 Состояние: <span class="car-cond">' + Math.round(s.car.condition) + '%</span>' + tail;
    } else {
      el.hudCar.classList.remove('hidden');
      el.hudCar.classList.add('dead');
      el.hudCar.innerHTML = '🚗 Машины нет · автобус и ноги';
    }

    if (s.strain >= 4) {
      el.hudCar.innerHTML += ' · 🩹 износ ' + Math.round(s.strain) + '/' + Game.BALANCE.strainMax;
    }

    if (el.hudAvatar) el.hudAvatar.textContent = avatarFor(s);
    renderChips();
  }

  /* ------------------------------ предупреждения --------------------------- */
  /* Полоса чипов: игрок видит, что именно горит, не открывая меню. */
  function renderWarnings(list) {
    if (!el.warnStrip) return;
    list = list || Game.warnings();
    if (!list || !list.length) {
      el.warnStrip.classList.add('hidden');
      el.warnStrip.innerHTML = '';
      return;
    }
    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += '<span class="warn-chip">' + list[i].icon + ' ' + list[i].text + '</span>';
    }
    el.warnStrip.innerHTML = html;
    el.warnStrip.classList.remove('hidden');
  }

  /** Свежий переход через порог: чип пульсирует, звук «тревога», вибрация. */
  function showWarning(w) {
    if (!w) return;
    renderWarnings();
    if (el.warnStrip) {
      // пульсирует именно тот чип, который только что появился
      var chips = el.warnStrip.querySelectorAll ? el.warnStrip.querySelectorAll('.warn-chip') : [];
      for (var i = 0; i < chips.length; i++) {
        if (chips[i].textContent.indexOf(w.text) !== -1) { chips[i].classList.add('pulse'); break; }
      }
    }
    Sound.play('warn');
    buzz('medium');
    notice(w.icon + ' ' + w.text, 'warn', '', 3200);
  }

  /* ---------------------------------------------------------------- карточка */
  function rarityLabel(r) { return RARITY_LABEL[r] || RARITY_LABEL.common; }

  function morningHTML(lines) {
    if (!lines || !lines.length) return '';
    var chips = '';
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      var cls = l.delta > 0 ? ' pos' : (l.delta < 0 ? ' neg' : '');
      var money_ = l.delta ? ' ' + signedMoney(l.delta) : '';
      chips += '<span class="morning-chip' + cls + '">' + l.icon + ' ' + l.text + money_ + '</span>';
    }
    return '<div class="morning"><span class="morning-title">Утро</span>' + chips + '</div>';
  }

  function renderCard(payload) {
    var s = Game.get();
    var card = payload.event;
    var table = $('tableInner');
    var actions = $('actions');

    table.innerHTML = morningHTML(payload.morning) +
      '<article class="card rarity-' + card.rarity + '">' +
        '<div class="card-head">' +
          '<div class="card-icon">' + card.icon + '</div>' +
          '<div class="card-titles">' +
            '<span class="card-rarity">' + (payload.forced ? 'Последствие' : rarityLabel(card.rarity)) + '</span>' +
            '<h3 class="card-title">' + card.title + '</h3>' +
          '</div>' +
        '</div>' +
        '<p class="card-text">' + card.text + '</p>' +
        (payload.forced ? '<div class="badge-forced">это тянется с прошлых дней</div>' : '') +
      '</article>';

    actions.innerHTML = '';
    var available = 0;
    for (var i = 0; i < card.choices.length; i++) {
      var ch = card.choices[i];
      var check = Game.check(ch);
      if (check.ok) available++;
      var btn = doc.createElement('button');
      btn.className = 'choice';
      btn.style.animationDelay = (i * 45) + 'ms';
      btn.dataset.i = i;
      if (!check.ok) btn.disabled = true;
      btn.innerHTML =
        '<span class="choice-ico">' + (ch.icon || '•') + '</span>' +
        '<span class="choice-body">' +
          '<span class="choice-label">' + ch.label + '</span>' +
          '<span class="choice-hint">' + (check.ok ? (ch.hint || '') : check.reason) + '</span>' +
        '</span>';
      actions.appendChild(btn);
    }

    /* Страховка: если денег не хватает вообще на всё — день всё равно закрывается */
    if (available === 0) {
      var fallback = doc.createElement('button');
      fallback.className = 'btn btn-ghost';
      fallback.id = 'btnEndure';
      fallback.textContent = '🚬 Просто пережить этот день';
      actions.appendChild(fallback);
      fallback.addEventListener('click', function () { Game.endure(); });
    }

    var note = doc.createElement('div');
    note.className = 'skip-note';
    note.textContent = 'День ' + s.day + ' из ' + Game.BALANCE.maxDays;
    actions.appendChild(note);
    measureActions();

    if (payload.morning && payload.morning.length) {
      var sum = 0;
      for (var k = 0; k < payload.morning.length; k++) sum += payload.morning[k].delta;
      if (sum) floatMoney(sum);
    }

    // полоса предупреждений всегда синхронна состоянию
    renderWarnings(payload.warnings);

    /* --- отклик на карточку ------------------------------------------------
       epic/rare — тяжёлая вибрация (событие редкое, пусть чувствуется),
       последствие цепочки — средняя (это «отдача» за прошлое решение). */
    if (card.rarity === 'rare' || card.rarity === 'epic') { Sound.play('rare'); buzz('heavy'); }
    else if (payload.forced) { Sound.play('notify'); buzz('medium'); }
    else Sound.play('notify');
  }

  /* ---------------------------------------------------------------- результат */
  function deltaChips(deltas) {
    var html = '';
    for (var i = 0; i < deltas.length; i++) {
      var d = deltas[i], meta = DELTA_META[d.key] || { ico: '•', unit: '' };
      if (!d.delta && d.text) {
        html += '<span class="delta neg">' + meta.ico + ' ' + d.text + '</span>';
        continue;
      }
      if (!d.delta) continue;
      if (d.key === 'debt') {
        // уменьшение долга — это хорошо, поэтому цвет инвертирован
        var good = d.delta < 0;
        html += '<span class="delta ' + (good ? 'pos' : 'neg') + '">💳 долг ' +
          (good ? '−' : '+') + groupDigits(d.delta) + '\u00a0₽</span>';
        continue;
      }
      var cls = d.delta > 0 ? 'pos' : 'neg';
      var val = d.key === 'money'
        ? signedMoney(d.delta)
        : (d.delta > 0 ? '+' : '−') + Math.abs(Math.round(d.delta)) + meta.unit;
      html += '<span class="delta ' + cls + '">' + meta.ico + ' ' + val + '</span>';
    }
    return html;
  }

  function renderResult(res) {
    var s = Game.get();
    var table = $('tableInner');
    var actions = $('actions');
    var extras = '';

    if (res.extras && res.extras.length) {
      extras = '<div class="result-extra">';
      for (var i = 0; i < res.extras.length; i++) extras += '<div>• ' + res.extras[i] + '</div>';
      extras += '</div>';
    }

    table.innerHTML =
      '<article class="card rarity-' + res.rarity + '">' +
        '<div class="card-head">' +
          '<div class="card-icon">' + res.icon + '</div>' +
          '<div class="card-titles">' +
            '<span class="card-rarity">' + res.choiceLabel + '</span>' +
            '<h3 class="card-title">' + res.title + '</h3>' +
          '</div>' +
        '</div>' +
        '<p class="card-text">' + res.text + '</p>' +
        extras +
        '<div class="deltas">' + deltaChips(res.deltas) + '</div>' +
      '</article>';

    actions.innerHTML = '<button class="btn btn-primary btn-xl" id="btnSleep">Спать&nbsp;→&nbsp;день ' + (s.day + 1) + '</button>';
    $('btnSleep').addEventListener('click', function () { Game.nextDay(); });
    measureActions();

    var i, d;
    for (i = 0; i < res.deltas.length; i++) {
      d = res.deltas[i];
      if (d.delta) floatForKey(d.key, d.delta);
    }
    if (res.deltas.length) {
      var bad = false;
      for (i = 0; i < res.deltas.length; i++) if (res.deltas[i].delta < 0) { bad = true; break; }
      var node = table.querySelector('.card');
      if (node && bad) { node.classList.add('shake'); }
    }
    Sound.play('tap');
  }

  /* ------------------------------------------------------------ анимации ----- */
  /* «Полосы» для всплывающих цифр: если несколько изменений летят из одной
     точки, они выстраиваются лесенкой и не сливаются в одно пятно. */
  var floatLanes = {};
  function nextLane(key) {
    var now = Date.now();
    var st = floatLanes[key];
    if (!st || now - st.last > 380) st = floatLanes[key] = { count: 0, last: now };
    st.last = now;
    return st.count++ % 3;
  }

  /** Высота панели действий: от неё зависит, где встанут уведомления. */
  function measureActions() {
    if (!el.actions || !doc.documentElement) return;
    var h = el.actions.offsetHeight || 0;
    doc.documentElement.style.setProperty('--actions-h', (h ? h + 8 : 190) + 'px');
  }

  function floatNode(anchor, text, cls, laneKey) {
    if (!anchor) return;
    var r = anchor.getBoundingClientRect();
    var lane = laneKey ? nextLane(laneKey) : 0;
    var node = doc.createElement('div');
    // у самой верхней кромки цифра летит вниз, а не за пределы экрана
    var nearTop = r.top < 96;
    node.className = 'float ' + cls + (nearTop ? ' down' : '');
    node.textContent = text;
    node.style.left = (r.left + r.width / 2) + 'px';
    node.style.top = (r.top + r.height / 2 + (nearTop ? lane * 18 : -lane * 18)) + 'px';
    node.style.animationDelay = (lane * 0.06) + 's';
    el.fxLayer.appendChild(node);
    global.setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1300);
  }

  function floatForKey(key, delta) {
    var cls = delta > 0 ? 'pos' : 'neg';
    if (key === 'money' || key === 'debt') {
      floatNode(el.hudMoney, (delta > 0 ? '+' : '−') + groupDigits(delta), cls, 'money');
      el.hudMoney.classList.remove('bump');
      void el.hudMoney.offsetWidth;
      el.hudMoney.classList.add('bump');
      if (key === 'money') Sound.play(delta > 0 ? 'coin' : 'tap');
      return;
    }
    if (key === 'carCondition' || key === 'car') {
      floatNode(el.hudCar, (delta > 0 ? '+' : '−') + Math.abs(Math.round(delta)) + '%', cls, 'car');
      return;
    }
    var node = statNodes[key];
    if (!node) return;
    floatNode(node.root, (delta > 0 ? '+' : '−') + Math.abs(Math.round(delta)), cls, 'stat-' + key);
    node.root.classList.remove('bump');
    void node.root.offsetWidth;
    node.root.classList.add('bump');
  }

  function floatMoney(sum) {
    floatNode(el.hudMoney, (sum > 0 ? '+' : '−') + groupDigits(sum), sum > 0 ? 'pos' : 'neg', 'money');
  }

  function floatMoney(sum) {
    floatNode(el.hudMoney, (sum > 0 ? '+' : '−') + groupDigits(sum), sum > 0 ? 'pos' : 'neg');
  }

  /* --------------------------- уведомления --------------------------------- */
  /* Раньше тост был одной фиксированной плашкой снизу и перекрывал кнопки
     выбора, а плашка достижения — чипы HUD. Теперь все надписи живут в
     .notice-zone: столбик снизу вверх над панелью действий, максимум три
     одновременно, каждая уходит сама. */
  var noticeList = [];

  function notice(text, kind, note, ttl) {
    if (!el.noticeZone) return;
    var node = doc.createElement('div');
    node.className = 'notice' + (kind ? ' ' + kind : '');
    node.innerHTML = text + (note ? '<small>' + note + '</small>' : '');
    el.noticeZone.appendChild(node);
    noticeList.push(node);

    // больше трёх плашек не держим: самую старую убираем сразу
    while (noticeList.length > 3) {
      var old = noticeList.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }

    global.setTimeout(function () {
      node.classList.add('out');
      global.setTimeout(function () {
        if (node.parentNode) node.parentNode.removeChild(node);
        var idx = noticeList.indexOf(node);
        if (idx !== -1) noticeList.splice(idx, 1);
      }, 220);
    }, ttl || 2600);
  }

  function toast(text) { notice(text, '', '', 2200); }

  /* ------------------------------- вибрация -------------------------------- */
  /* Единая точка тактильного отклика.
     В ВК — нативные VKWebAppTaptic* (см. js/vk.js), в обычном браузере —
     navigator.vibrate, если он поддерживается. Вибрация необязательна:
     любая ошибка здесь глушится, чтобы не ломать игровой цикл. */
  function buzz(kind) {
    try {
      if (global.VK && VK.haptic) { VK.haptic(kind); return; }
      if (global.navigator && navigator.vibrate) {
        var pattern = { light: 8, medium: [14, 40, 14], heavy: 30, success: [10, 30, 18], error: [24, 50, 24] };
        navigator.vibrate(pattern[kind] || 10);
      }
    } catch (e) { /* нет вибрации — не беда */ }
  }

  function countUp(node, to, ms, fmt) {
    var start = null;
    if (node._raf) global.cancelAnimationFrame(node._raf);
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / ms);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = fmt(to * eased);
      if (t < 1) node._raf = global.requestAnimationFrame(step);
    }
    node._raf = global.requestAnimationFrame(step);
  }

  /* -------------------------------------------------------------- финал ------ */
  function showEnd(end) {
    screen('end');

    el.endBadge.textContent = end.badge;
    el.endTitle.textContent = end.title;
    el.endSub.textContent = end.sub;
    el.endDays.textContent = end.days;
    el.endDaysWord.textContent = plural(end.days, ['день', 'дня', 'дней']);
    el.endCause.textContent = end.causeLabel;
    el.endCauseNote.textContent = end.topAmount
      ? 'Больше всего ушло сюда: ' + money(end.topAmount)
      : 'Траты размазались по мелочам';

    el.endWorst.textContent = end.worst ? '−' + money(end.worst.amount) : 'ни рубля';
    el.endWorstNote.textContent = end.worst
      ? end.worst.icon + ' ' + end.worst.label + ' · день ' + end.worst.day
      : 'Ты не совершил ни одной дорогой ошибки';
    el.endBest.textContent = end.best ? '+' + money(end.best.amount) : '—';
    el.endBestNote.textContent = end.best
      ? end.best.icon + ' ' + end.best.label + ' · день ' + end.best.day
      : 'Крупных удач не случилось';

    el.endGigs.textContent = end.gigs || 0;
    el.endBreakdowns.textContent = end.breakdowns || 0;
    el.endFamily.textContent = (end.family || 0) + ' / 100';
    el.endWork.textContent = (end.work || 0) + ' / 100';
    el.endStyle.textContent = (end.styleIcon || '') + ' ' + (end.styleName || '—');
    el.endStyleNote.textContent = end.styleNote || '';

    /* Мечта: выполнена или нет — это отдельная строка финала. */
    if (el.endGoal) {
      el.endGoal.textContent = (end.goalIcon || '🎯') + ' ' + (end.goalName || '—') +
        (end.goalDone ? ' — выполнена!' : '');
      el.endGoalNote.textContent = end.goalDone
        ? 'Бонус к рейтингу: +' + groupDigits(end.goalBonus || 0)
        : (end.goalNote || '') + ' · не получилось';
    }
    if (el.endArch) el.endArch.textContent = (end.archIcon || '') + ' ' + (end.archName || '—');
    if (el.endPoints) el.endPoints.textContent = '+' + (end.pointsEarned || 0) + ' 💎';

    var list = end.achievements || [];
    var total = end.achvTotal || (Game.ACHIEVEMENTS ? Game.ACHIEVEMENTS.length : list.length);
    el.endAchvCount.textContent = list.length + ' / ' + total;

    var html = '', got = {}, i;
    for (i = 0; i < list.length; i++) {
      got[list[i].id] = true;
      html += '<span class="ach on">' + list[i].icon + ' ' + list[i].name + '</span>';
    }
    if (Game.ACHIEVEMENTS) {
      for (i = 0; i < Game.ACHIEVEMENTS.length; i++) {
        var a = Game.ACHIEVEMENTS[i];
        if (!got[a.id]) html += '<span class="ach locked">' + a.icon + ' ' + a.name + '</span>';
      }
    }
    el.endAchv.innerHTML = html;

    el.endPercent.textContent = end.percent;
    el.endScore.textContent = 'рейтинг ' + groupDigits(end.score);
    el.endRatingBar.style.width = '0%';

    countUp(el.endEarned, end.earned, 750, function (v) { return money(v); });
    countUp(el.endSpent, end.spent, 750, function (v) { return money(v); });

    global.setTimeout(function () { el.endRatingBar.style.width = end.percent + '%'; }, 60);

    el.endRecord.textContent = end.isRecord
      ? '🏅 Новый личный рекорд! Попытка №' + end.runs
      : 'Личный рекорд: ' + groupDigits(end.bestScore) + ' · попытка №' + end.runs;

    Sound.play(end.win ? 'win' : 'lose');
    /* 100-й день: сначала тяжёлый «удар» вибрации, через мгновение —
       мажорный отклик. Проигрыш отмечается ошибкой. */
    if (end.win) {
      buzz('heavy');
      global.setTimeout(function () { buzz('success'); }, 260);
    } else {
      buzz('error');
    }

    /* Ежедневный забег: результат в персональный ключ ВК, чтобы сравнить
       с друзьями (зерно одинаковое, значит условия честные). */
    if (end.daily && global.VK && VK.saveDaily) {
      VK.saveDaily(end.dailyDate || Game.dailyDate(), end.categories ? end.categories.score : end.score);
    }
  }

  /* ======================== ДОСТИЖЕНИЯ И ПОДРОБНОСТИ ====================== */
  function showAchievement(a) {
    notice('🏅 ' + a.name, 'achv', a.note || '', 3000);
    Sound.play('rare');
    buzz('success');
  }

  function detRow(name, value, cls) {
    return '<div class="det-row"><span>' + name + '</span><b class="' + (cls || '') + '">' + value + '</b></div>';
  }

  /** Панель «Подробно»: скрытые характеристики, счётчики и достижения. */
  function detailsModal() {
    var s = Game.get();
    if (!s) return;

    var html = '<h3>Что внутри</h3><div class="det-list">';
    html += detRow('💰 Деньги', (s.money < 0 ? '−' : '') + money(s.money), s.money < 0 ? 'bad' : 'good');

    var i, d, v, cls;
    for (i = 0; i < DETAIL_ROWS.length; i++) {
      d = DETAIL_ROWS[i];
      v = Math.round(s[d.key] || 0);
      if (d.key === 'fatigue' || d.key === 'risk') cls = v >= 60 ? 'bad' : '';
      else cls = v <= 30 ? 'bad' : (v >= 70 ? 'good' : '');

      // удача и риск подписываем словами: иначе непонятно, что они делают
      var value = v + ' / 100';
      if (d.key === 'luck') value = v + ' · ' + Game.luckTier(v);
      html += detRow(d.icon + ' ' + d.name, value, cls);
    }

    html += detRow('🩹 Износ', Math.round(s.strain || 0) + ' / ' + Game.BALANCE.strainMax,
      (s.strain || 0) >= 5 ? 'bad' : '');
    html += detRow('🎲 Что даёт риск', Game.describeRisk(Math.round(s.risk || 0)));
    html += detRow('🎓 Опыт', s.exp || 0);
    html += detRow('🚗 Машина', s.car.has ? Math.round(s.car.condition) + '%' : 'нет', s.car.has ? '' : 'bad');
    html += detRow('💳 Кредит', s.credit.debt > 0 ? money(s.credit.debt) : 'нет', s.credit.debt > 0 ? 'bad' : 'good');
    html += detRow('🗓 День', s.day + ' из ' + Game.BALANCE.maxDays);

    for (i = 0; i < COUNTER_ROWS.length; i++) {
      html += detRow(COUNTER_ROWS[i].icon + ' ' + COUNTER_ROWS[i].name, (s.counters && s.counters[COUNTER_ROWS[i].key]) || 0);
    }

    var got = 0, total = 0;
    if (Game.ACHIEVEMENTS) {
      total = Game.ACHIEVEMENTS.length;
      for (i = 0; i < total; i++) if (s.achv && s.achv[Game.ACHIEVEMENTS[i].id]) got++;
    }
    html += detRow('🏅 Достижения', got + ' / ' + total, got > 0 ? 'good' : '');
    html += '</div>';
    html += '<button class="btn btn-primary" data-act="close">Понятно</button>';

    openModal(html, function (act) { if (act === 'close') closeModal(); });
  }

  /* ===================== КАРТОЧКА РЕЗУЛЬТАТА (canvas) ===================== */
  /* Рисуем вертикальную карточку 1080×1920 и отдаём её в системное
     «Поделиться» (Web Share API с файлом) или скачиваем. Это и есть
     «поделиться в VK Stories» без хостинга картинок: в ВК, если в настройках
     приложения задан __VK_STORY_BG (URL картинки 1080×1920), сначала
     пробуем нативные Stories, иначе работает обычный шаринг файла. */
  function wrapText(g, text, x, y, maxWidth, lineHeight) {
    var words = String(text || '').split(/\s+/), line = '', lines = [], i;
    for (i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (g.measureText(test).width > maxWidth && line) {
        lines.push(line); line = words[i];
      } else line = test;
    }
    if (line) lines.push(line);
    for (i = 0; i < lines.length; i++) g.fillText(lines[i], x, y + i * lineHeight);
    return lines.length;
  }

  function downloadBlob(blob, name) {
    try {
      var url = global.URL.createObjectURL(blob);
      var a = doc.createElement('a');
      a.href = url; a.download = name;
      doc.body.appendChild(a); a.click();
      global.setTimeout(function () {
        doc.body.removeChild(a);
        global.URL.revokeObjectURL(url);
      }, 400);
      toast('Карточка сохранена');
    } catch (e) { toast('Не удалось сохранить карточку'); }
  }

  function shareText(end) {
    return 'Я прожил ' + end.days + ' ' + plural(end.days, ['день', 'дня', 'дней']) +
      ' в «До зарплаты». Финал: ' + end.title + '. Мечта: ' +
      (end.goalDone ? 'сбылась' : 'не сбылась') + '. Я лучше ' + end.percent + '% игроков!';
  }

  function storyCard(end) {
    if (!end) { toast('Сначала доиграй партию'); return; }

    // В ВК пробуем нативные Stories, если разработчик задал фоновую картинку.
    if (global.VK && VK.inFrame && VK.story && global.__VK_STORY_BG) {
      if (VK.story(global.__VK_STORY_BG, shareText(end))) return;
    }

    var W = 1080, H = 1920;
    var canvas = doc.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var g = canvas.getContext ? canvas.getContext('2d') : null;
    if (!g) { toast('Карточки не поддерживаются'); return; }

    var grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#141924'); grad.addColorStop(1, '#0b0e13');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(198,242,78,.10)';
    g.beginPath(); g.arc(150, 240, 330, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(139,123,255,.12)';
    g.beginPath(); g.arc(940, 430, 300, 0, Math.PI * 2); g.fill();

    g.textAlign = 'center';
    g.fillStyle = '#8d9aae';
    g.font = '600 42px -apple-system, Segoe UI, Roboto, sans-serif';
    g.fillText('Д О   З А Р П Л А Т Ы', W / 2, 210);

    g.font = '900 260px -apple-system, Segoe UI, Roboto, sans-serif';
    g.fillText(end.badge || '🏁', W / 2, 560);

    g.fillStyle = '#eef2f8';
    g.font = '900 78px -apple-system, Segoe UI, Roboto, sans-serif';
    var lines = wrapText(g, end.title, W / 2, 720, W - 140, 88);

    g.fillStyle = '#8d9aae';
    g.font = '400 40px -apple-system, Segoe UI, Roboto, sans-serif';
    wrapText(g, end.sub || '', W / 2, 720 + lines * 88 + 20, W - 200, 52);

    // Таблица цифр
    var rows = [
      ['Прожито', end.days + ' ' + plural(end.days, ['день', 'дня', 'дней'])],
      ['Заработал', groupDigits(end.earned) + ' ₽'],
      ['Потратил', groupDigits(end.spent) + ' ₽'],
      ['Мечта', end.goalDone ? 'сбылась 🎉' : 'не сбылась'],
      ['Рейтинг', 'лучше ' + end.percent + '% игроков']
    ];
    var top = 1180;
    g.font = '400 44px -apple-system, Segoe UI, Roboto, sans-serif';
    for (var i = 0; i < rows.length; i++) {
      var y = top + i * 92;
      g.fillStyle = 'rgba(255,255,255,.06)';
      g.fillRect(90, y - 58, W - 180, 76);
      g.textAlign = 'left';
      g.fillStyle = '#8d9aae';
      g.fillText(rows[i][0], 120, y);
      g.textAlign = 'right';
      g.fillStyle = '#eef2f8';
      g.font = '800 44px -apple-system, Segoe UI, Roboto, sans-serif';
      g.fillText(rows[i][1], W - 120, y);
      g.font = '400 44px -apple-system, Segoe UI, Roboto, sans-serif';
    }

    // Достижения и профессия
    var achv = (end.achievements || []).length;
    g.textAlign = 'center';
    g.fillStyle = '#c6f24e';
    g.font = '800 44px -apple-system, Segoe UI, Roboto, sans-serif';
    g.fillText((end.archIcon || '') + ' ' + (end.archName || '') + ' · 🏅 ' + achv + ' из ' + (end.achvTotal || 18), W / 2, top + rows.length * 92 + 60);

    g.fillStyle = '#64708a';
    g.font = '400 34px -apple-system, Segoe UI, Roboto, sans-serif';
    g.fillText('до зарплаты — 100 дней между авансом и зарплатой', W / 2, H - 90);

    var name = 'do-zarplaty-' + end.days + 'd.png';
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        if (!blob) { toast('Не удалось собрать карточку'); return; }
        var file = null;
        try { file = new global.File([blob], name, { type: 'image/png' }); } catch (e) { file = null; }
        if (file && global.navigator && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: shareText(end) })
            .catch(function () { downloadBlob(blob, name); });
        } else {
          downloadBlob(blob, name);
        }
      }, 'image/png');
    } else {
      toast('Карточки не поддерживаются');
    }
  }

  /* ===================== «ЗАНЯТЬ У ДРУГА» (только ВК) ====================
     Схема без backend: VK Storage в мини-аппе общий для всего приложения,
     поэтому и просьба, и ответ лежат в одном ключе dz_ask_<id игрока>.
     Просящий отправляет другу ссылку с якорем #help=<id>&sum=<сумма>.
     Друг открывает игру, видит просьбу и жмёт «Дать»; деньги приходят
     просящему при следующем входе (или сразу, если партия идёт). */
  function openHelpDialog(askerId, sum) {
    openModal(
      '<h3>🤝 Просьба о помощи</h3>' +
      '<p>Друг просит <b>' + money(sum) + '</b> в долг до зарплаты. ' +
      'Это виртуальные деньги внутри игры — просто поддержка.</p>' +
      '<button class="btn btn-primary" data-act="give">Дать ' + money(sum) + '</button>' +
      '<button class="btn btn-mini" data-act="no">Не сейчас</button>',
      function (act) {
        if (act === 'no') { closeModal(); return; }
        if (act !== 'give') return;
        VK.me(function (me) {
          VK.giveHelp(askerId, sum, (me && me.first_name) || 'Друг', function (ok) {
            closeModal();
            notice(ok ? '🤝 Помощь отправлена' : 'Не получилось отправить', ok ? 'gift' : 'warn', '', 3000);
          });
        });
      }
    );
  }

  function initHelpFlow() {
    if (!global.VK || !VK.inFrame || !VK.me) return;

    // Друг пришёл по ссылке с просьбой
    var hash = global.location.hash || '';
    var m = /help=(\d+)&sum=(\d+)/.exec(hash);
    if (m) { openHelpDialog(m[1], Number(m[2])); return; }

    // Мне помогли, пока меня не было
    VK.me(function (me) {
      if (!me || !me.id) return;
      VK.checkHelp(me.id, function (res) {
        if (!res || res.status !== 'given' || !res.amount) return;
        VK.clearHelp(me.id);
        var s = Game.get();
        if (s && !s.over) {
          Game.gift(res.amount, res.from || 'друг');
          notice('🤝 ' + (res.from || 'Друг') + ' дал ' + money(res.amount), 'gift', 'долг придётся вернуть', 4200);
        } else {
          Storage.setMeta({ pendingGift: res.amount });
          notice('🤝 Вам помогли на ' + money(res.amount), 'gift', 'учтём в новой партии', 4200);
        }
      });
    });
  }

  /** Кнопка в меню: попросить денег у друга. */
  function askFriendModal() {
    if (!global.VK || !VK.inFrame || !VK.me) {
      toast('Доступно только внутри ВКонтакте');
      return;
    }
    VK.me(function (me) {
      if (!me || !me.id) { toast('Не удалось получить профиль ВК'); return; }
      var sum = 5000;
      openModal(
        '<h3>🤝 Попросить в долг</h3>' +
        '<p>Друг получит ссылку на игру. Если он нажмёт «Дать», деньги придут ' +
        'тебе в текущую партию. Возвращать не обязательно — это игра.</p>' +
        '<button class="btn btn-primary" data-act="ask">Попросить ' + money(sum) + '</button>' +
        '<button class="btn btn-mini" data-act="close">Отмена</button>',
        function (act) {
          if (act === 'close') { closeModal(); return; }
          if (act !== 'ask') return;
          VK.askHelp(me.id, sum, me.first_name || 'Игрок', function (ok) {
            closeModal();
            notice(ok ? '🤝 Просьба отправлена другу' : 'ВК не принял просьбу',
              ok ? 'gift' : 'warn', ok ? 'как только он нажмёт «Дать» — деньги придут' : '', 3600);
          });
        }
      );
    });
  }



  /** Таблица лидеров: четыре категории, чтобы в топе были разные стили игры. */
  function leaderboardModal() {
    var end = Game.get().end;
    if (!end) { toast('Сначала доиграй партию'); return; }
    var cats = end.categories || {};

    if (!global.VK || !VK.inFrame || !VK.leaderboard) {
      openModal(
        '<h3>🏆 Таблицы лидеров</h3>' +
        '<p>Полноценные таблицы доступны внутри ВКонтакте. Твои результаты по категориям:</p>' +
        '<div class="det-list">' +
          detRow('Общий рейтинг', groupDigits(cats.score || end.score) + ' (лучше ' + end.percent + '%)', 'good') +
          detRow('💰 Самый богатый', money(cats.money || 0)) +
          detRow('🙂 Самый счастливый', Math.round(cats.mood || 0) + ' / 100') +
          detRow('🧮 Гуру экономии', groupDigits(cats.saver || 0)) +
        '</div>' +
        '<button class="btn btn-primary" data-act="close">Понятно</button>',
        function (act) { if (act === 'close') closeModal(); }
      );
      return;
    }

    openModal(
      '<h3>🏆 Таблицы лидеров</h3>' +
      '<p>Выбери категорию. ID таблиц настраиваются в кабинете приложения ВК ' +
      '(js/vk.js → LEADERBOARDS).</p>' +
      '<button class="btn btn-ghost" data-act="score">Общий рейтинг · ' + groupDigits(cats.score || end.score) + '</button>' +
      '<button class="btn btn-ghost" data-act="money">💰 Самый богатый · ' + money(cats.money || 0) + '</button>' +
      '<button class="btn btn-ghost" data-act="mood">🙂 Самый счастливый · ' + Math.round(cats.mood || 0) + '</button>' +
      '<button class="btn btn-ghost" data-act="saver">🧮 Гуру экономии · ' + groupDigits(cats.saver || 0) + '</button>' +
      '<button class="btn btn-mini" data-act="close">Закрыть</button>',
      function (act) {
        if (act === 'close') { closeModal(); return; }
        closeModal();
        VK.leaderboard(cats[act] || end.score, act);
      }
    );
  }

  /* -------------------------------------------------------------- модалки ---- */
  function closeModal() {
    el.modalBack.classList.add('hidden');
    el.modal.innerHTML = '';
  }

  function openModal(html, onAction) {
    el.modal.innerHTML = html;
    el.modalBack.classList.remove('hidden');
    el.modal._onAction = onAction || null;
  }

  function rulesModal() {
    openModal(
      '<h3>Как играть</h3>' +
      '<p>Ты живёшь от зарплаты до зарплаты. Один день — одно событие и один выбор.</p>' +
      '<ul>' +
        '<li>Цель — дожить до 100-го дня.</li>' +
        '<li>❤️ здоровье, ⚡ силы, 🙂 настроение, 🤝 отношения — от 0 до 100.</li>' +
        '<li>Скрытые характеристики (👨‍👩‍👧 семья, 💼 работа, 🥱 усталость, 🍀 удача, 🎲 риск) смотри в кнопке 📊.</li>' +
        '<li>Упадёт до нуля здоровье или настроение — конец. Ноль сил два дня подряд — выгорание. Усталость режет сон.</li>' +
        '<li>Минус 50 000 ₽ на карте — долговая яма.</li>' +
        '<li>🩹 <b>Износ</b>: экономишь на сне и здоровье — он копится, режет ночной отдых и здоровье. Вылезти из него всё труднее.</li>' +
        '<li>Расходы живые: устал — еда дороже, убитая машина ест больше бензина, а высокая склонность к риску добавляет случайные траты (🍀 удача их уменьшает).</li>' +
        '<li>Критические состояния показываются чипами, звуком и вибрацией — не молча.</li>' +
        '<li>Аванс 15-го, зарплата 30-го, квартплата 1-го, кредит за машину 12-го.</li>' +
        '<li>Удачные и неудачные решения возвращаются последствиями через несколько дней.</li>' +
        '<li>За достижения дают очки в итоговом рейтинге.</li>' +
        '<li>Прогресс сохраняется сам: можно закрыть и вернуться.</li>' +
      '</ul>' +
      '<button class="btn btn-primary" data-act="close">Понятно</button>',
      function (act) { if (act === 'close') closeModal(); }
    );
  }

  function menuModal() {
    var s = Game.get();
    openModal(
      '<h3>Меню</h3>' +
      '<p>День ' + s.day + ' из ' + Game.BALANCE.maxDays + ' · ' + money(s.money) + '</p>' +
      '<button class="btn btn-ghost" data-act="sound">' + (Sound.isOn() ? '🔊 Звук включён' : '🔇 Звук выключен') + '</button>' +
      '<button class="btn btn-ghost" data-act="details">📊 Подробно о состоянии</button>' +
      '<button class="btn btn-ghost" data-act="journal">📒 Журнал расходов</button>' +
      '<button class="btn btn-ghost" data-act="ask">🤝 Попросить в долг у друга</button>' +
      '<button class="btn btn-ghost" data-act="rules">📖 Как играть</button>' +
      '<button class="btn btn-ghost danger" data-act="restart">🔄 Начать заново</button>' +
      '<button class="btn btn-mini" data-act="close">Продолжить игру</button>',
      function (act) {
        if (act === 'close') closeModal();
        if (act === 'rules') rulesModal();
        if (act === 'details') detailsModal();
        if (act === 'journal') journalModal();
        if (act === 'ask') askFriendModal();
        if (act === 'sound') {
          var on = Sound.toggle();
          Storage.setMeta({ soundOn: on });
          el.btnSoundStart.textContent = on ? '🔊 Звук' : '🔇 Звук';
          menuModal();
        }
        if (act === 'restart') {
          openModal(
            '<h3>Начать заново?</h3>' +
            '<p>Текущая партия удалится. Рекорды останутся.</p>' +
            '<button class="btn btn-ghost danger" data-act="yes">Да, начать новую жизнь</button>' +
            '<button class="btn btn-mini" data-act="no">Отмена</button>',
            function (a) {
              if (a === 'yes') { closeModal(); Game.newGame(); screen('game'); }
              if (a === 'no') menuModal();
            }
          );
        }
      }
    );
  }

  /* ===================== СТАРТ: ЦЕЛИ, ПРОФЕССИИ, ПЕРКИ ==================== */
  /* Выбор игрока на старте храним в UI-состоянии: он не часть партии, а её
     настройка. Значения по умолчанию — первый пункт каждого списка. */
  var pickGoal = null;
  var pickArch = null;

  function renderGoals() {
    if (!el.goalList) return;
    if (!pickGoal) pickGoal = Game.GOALS[0].id;
    var meta = Storage.meta();
    var html = '';
    for (var i = 0; i < Game.GOALS.length; i++) {
      var g = Game.GOALS[i];
      var done = meta.goalsDone[g.id] || 0;
      html += '<button class="pick' + (pickGoal === g.id ? ' on' : '') + '" data-goal="' + g.id + '">' +
        '<span class="pick-ico">' + g.icon + '</span>' +
        '<span class="pick-body"><b>' + g.name + '</b><small>' + g.note +
        (done ? ' · сделано: ' + done : '') + '</small></span>' +
      '</button>';
    }
    el.goalList.innerHTML = html;
  }

  function renderArchs() {
    if (!el.archList) return;
    if (!pickArch) pickArch = Game.ARCHETYPES[0].id;
    var html = '';
    for (var i = 0; i < Game.ARCHETYPES.length; i++) {
      var a = Game.ARCHETYPES[i];
      html += '<button class="pick' + (pickArch === a.id ? ' on' : '') + '" data-arch="' + a.id + '">' +
        '<span class="pick-ico">' + a.icon + '</span>' +
        '<span class="pick-body"><b>' + a.name + '</b><small>' + a.note + '</small></span>' +
      '</button>';
    }
    el.archList.innerHTML = html;
  }

  function renderPerks() {
    if (!el.perkList) return;
    var meta = Storage.meta();
    el.pointsLabel.textContent = meta.points;
    el.pointsNote.textContent = meta.points > 0 ? 'есть что купить' : 'копятся за партии';
    var html = '';
    for (var i = 0; i < Game.PERKS.length; i++) {
      var p = Game.PERKS[i];
      var owned = !!meta.perks[p.id];
      var afford = meta.points >= p.cost;
      html += '<button class="perk' + (owned ? ' on' : '') + '" data-perk="' + p.id + '"' +
        (owned || !afford ? ' disabled' : '') + '>' +
        '<span class="pick-ico">' + p.icon + '</span>' +
        '<span class="pick-body"><b>' + p.name + '</b><small>' + p.note + '</small></span>' +
        '<span class="perk-cost">' + (owned ? '✓' : p.cost + ' 💎') + '</span>' +
      '</button>';
    }
    el.perkList.innerHTML = html;
  }

  /** Тема: интерфейс меняет вид, состояние игры не трогает. */
  var THEMES = ['dark', 'light', 'retro'];
  function applyTheme(name) {
    var theme = THEMES.indexOf(name) === -1 ? 'dark' : name;
    doc.body.classList.remove('theme-dark', 'theme-light', 'theme-retro');
    doc.body.classList.add('theme-' + theme);
    var colors = { dark: '#0b0e13', light: '#f2f4f8', retro: '#0d1b0d' };
    var metaTag = doc.querySelector ? doc.querySelector('meta[name="theme-color"]') : null;
    if (metaTag) metaTag.setAttribute('content', colors[theme]);
    if (el.btnTheme) el.btnTheme.textContent = '🎨 ' + ({ dark: 'тёмная', light: 'светлая', retro: 'ретро' })[theme];
    return theme;
  }

  /** Одна функция — одна правда о том, как выглядит игрок сейчас. */
  function avatarFor(s) {
    if (s.health < 20 || (s.strain || 0) >= 8) return '🤒';
    if (s.mood < 22) return '😩';
    if (s.energy < 20 || (s.fatigue || 0) > 75) return '🥴';
    if (s.money < 0) return '😰';
    if (s.strain >= 5) return '😐';
    if (s.mood >= 75 && s.health >= 70) return '😄';
    if (s.money > 100000) return '🤑';
    return '🙂';
  }

  /** Чипы под HUD: мечта, сезон, активный кризис. */
  function renderChips() {
    if (!el.hudChips) return;
    var today = Game.today();
    if (!today) { el.hudChips.innerHTML = ''; return; }
    var html = '<span class="chip goal">' + today.goal.icon + ' ' + today.goal.progress + '</span>';
    html += '<span class="chip season">' + today.season.icon + ' ' + today.season.name + '</span>';
    if (today.crisis) html += '<span class="chip crisis">' + today.crisis.icon + ' ' + today.crisis.text + '</span>';
    el.hudChips.innerHTML = html;
    // при низком состоянии и износе экран «тускнеет»
    var s = Game.get();
    if (s && (s.mood < 30 || (s.strain || 0) >= 6)) doc.body.classList.add('dull');
    else doc.body.classList.remove('dull');
  }

  /** Журнал расходов: куда ушли деньги за последнюю неделю. */
  function journalModal() {
    var data = Game.ledger(7);
    var total = 0, cats = [], key;
    for (key in data.byCat) {
      if (Object.prototype.hasOwnProperty.call(data.byCat, key)) {
        total += data.byCat[key];
        cats.push({ key: key, sum: data.byCat[key] });
      }
    }
    cats.sort(function (a, b) { return b.sum - a.sum; });

    var html = '<h3>📒 Куда ушли деньги · 7 дней</h3>';
    html += '<p>Итог за неделю: <b>' + (data.total >= 0 ? '+' : '−') + money(data.total) + '</b></p>';

    if (cats.length) {
      html += '<div class="bars">';
      for (var i = 0; i < cats.length; i++) {
        var share = total ? Math.round(cats[i].sum / total * 100) : 0;
        html += '<div class="bar-row"><span>' + (Game.SPEND_LABELS[cats[i].key] || cats[i].key) + '</span>' +
          '<div class="bar"><i style="width:' + share + '%"></i></div>' +
          '<b>' + money(cats[i].sum) + '</b></div>';
      }
      html += '</div>';
    } else {
      html += '<p>За эту неделю трат не было.</p>';
    }

    if (data.rows.length) {
      html += '<div class="ledger">';
      for (var j = data.rows.length - 1; j >= 0 && j > data.rows.length - 26; j--) {
        var r = data.rows[j];
        html += '<div class="ledger-row"><span class="ld-day">д' + r.day + '</span>' +
          '<span class="ld-text">' + r.icon + ' ' + r.text + '</span>' +
          '<b class="' + (r.delta > 0 ? 'up' : 'down') + '">' +
          (r.delta > 0 ? '+' : '−') + money(r.delta) + '</b></div>';
      }
      html += '</div>';
    }

    html += '<button class="btn btn-primary" data-act="close">Понятно</button>';
    openModal(html, function (act) { if (act === 'close') closeModal(); });
  }

  /* ------------------------------------------------------------- старт ------- */
  function refreshStart() {
    var meta = Storage.meta();
    var info = Game.saveInfo();

    applyTheme(meta.theme);
    renderGoals();
    renderArchs();
    renderPerks();

    if (meta.bestScore > 0) {
      el.startBest.classList.remove('hidden');
      el.startBest.innerHTML =
        '🏅 Личный рекорд: <b>' + groupDigits(meta.bestScore) + '</b><br>' +
        'Лучший забег: <b>' + meta.bestDays + ' ' + plural(meta.bestDays, ['день', 'дня', 'дней']) + '</b> · лучше <b>' + meta.bestPercent + '%</b> игроков · попыток: <b>' + meta.runs + '</b>';
    } else {
      el.startBest.classList.add('hidden');
    }

    if (info) {
      el.btnContinue.classList.remove('hidden');
      el.contDay.textContent = info.day;
      el.btnNew.textContent = '▶\u00a0 Новая жизнь';
    } else {
      el.btnContinue.classList.add('hidden');
      el.btnNew.textContent = '▶\u00a0 Начать жизнь';
    }

    el.btnSoundStart.textContent = Sound.isOn() ? '🔊 Звук' : '🔇 Звук';

    if (el.startHint) {
      /* Числа динамические (контент-паки могут добавить событий), поэтому
         формы слов считаем хелпером, а не пишем жёстко: «5 мечты» —
         неверное склонение. Перки в этой строке не упоминаем: новичок
         всё равно не может их купить (очков ещё нет), а список перков
         виден ниже своим блоком. */
      var evs = Game.eventCount();
      el.startHint.textContent =
        evs + ' ' + plural(evs, ['событие', 'события', 'событий']) + ' · ' +
        Game.GOALS.length + ' ' + plural(Game.GOALS.length, ['мечта', 'мечты', 'мечт']) + ' · ' +
        Game.ARCHETYPES.length + ' ' + plural(Game.ARCHETYPES.length, ['профессия', 'профессии', 'профессий']);
    }
    if (el.startScroll) el.startScroll.scrollTop = 0;
  }

  /* --------------------------------------------------------------- init ------ */
  function init() {
    el.hudDay = $('hudDay'); el.hudMoney = $('hudMoney'); el.hudStats = $('hudStats'); el.hudCar = $('hudCar');
    el.tableInner = $('tableInner'); el.actions = $('actions'); el.table = $('table');
    el.btnNew = $('btnNew'); el.btnContinue = $('btnContinue'); el.contDay = $('contDay');
    el.btnSoundStart = $('btnSoundStart'); el.btnRulesStart = $('btnRulesStart'); el.startBest = $('startBest');
    el.btnMenu = $('btnMenu'); el.btnDetails = $('btnDetails'); el.btnJournal = $('btnJournal');
    el.hudAvatar = $('hudAvatar'); el.hudChips = $('hudChips');
    el.startScroll = $('startScroll'); el.startHint = $('startHint');
    el.pointsLabel = $('pointsLabel'); el.pointsNote = $('pointsNote');
    el.perkList = $('perkList'); el.goalList = $('goalList'); el.archList = $('archList');
    el.btnDaily = $('btnDaily'); el.btnTheme = $('btnTheme');
    el.endGoal = $('endGoal'); el.endGoalNote = $('endGoalNote');
    el.endArch = $('endArch'); el.endPoints = $('endPoints');
    el.btnAgain = $('btnAgain'); el.btnShare = $('btnShare'); el.btnToStart = $('btnToStart');
    el.endBadge = $('endBadge'); el.endTitle = $('endTitle'); el.endSub = $('endSub');
    el.endDays = $('endDays'); el.endDaysWord = $('endDaysWord');
    el.endEarned = $('endEarned'); el.endSpent = $('endSpent');
    el.endCause = $('endCause'); el.endCauseNote = $('endCauseNote');
    el.endWorst = $('endWorst'); el.endWorstNote = $('endWorstNote');
    el.endBest = $('endBest'); el.endBestNote = $('endBestNote');
    el.endGigs = $('endGigs'); el.endBreakdowns = $('endBreakdowns');
    el.endFamily = $('endFamily'); el.endWork = $('endWork');
    el.endStyle = $('endStyle'); el.endStyleNote = $('endStyleNote');
    el.endAchv = $('endAchv'); el.endAchvCount = $('endAchvCount');
    el.endPercent = $('endPercent'); el.endScore = $('endScore');
    el.endRatingBar = $('endRatingBar'); el.endRecord = $('endRecord');
    el.fxLayer = $('fxLayer'); el.noticeZone = $('noticeZone');
    el.modalBack = $('modalBack'); el.modal = $('modal');
    el.warnStrip = $('warnStrip');
    el.btnCard = $('btnCard'); el.btnBoard = $('btnBoard');

    buildStats();
    Sound.init(Storage.meta().soundOn);
    refreshStart();

    /* --- звук на первое касание + клик по кнопкам --- */
    doc.addEventListener('pointerdown', function () { Sound.unlock(); }, { passive: true });
    doc.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('button') : null;
      if (btn && !btn.disabled && !btn.classList.contains('choice')) Sound.play('tap');
    });

    /* --- старт: выбор мечты, профессии и перков --- */
    el.goalList.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.pick') : null;
      if (!btn) return;
      pickGoal = btn.dataset.goal;
      Sound.play('tap'); buzz('light');
      renderGoals();
    });

    el.archList.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.pick') : null;
      if (!btn) return;
      pickArch = btn.dataset.arch;
      Sound.play('tap'); buzz('light');
      renderArchs();
    });

    el.perkList.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.perk') : null;
      if (!btn || btn.disabled) return;
      var id = btn.dataset.perk, perk = null;
      for (var i = 0; i < Game.PERKS.length; i++) if (Game.PERKS[i].id === id) perk = Game.PERKS[i];
      if (!perk) return;
      var res = Storage.buyPerk(id, perk.cost);
      if (res.ok) {
        Sound.play('rare'); buzz('success');
        toast('Куплено: ' + perk.icon + ' ' + perk.name);
      } else {
        Sound.play('warn'); buzz('error');
        toast(res.reason);
      }
      renderPerks();
    });

    el.btnNew.addEventListener('click', function () {
      Game.newGame({ goal: pickGoal, arch: pickArch });
      screen('game');
    });

    /* Ежедневный забег: у всех игроков одинаковое зерно, поэтому и события,
       и риск-броски совпадают — можно честно сравнивать результаты. */
    el.btnDaily.addEventListener('click', function () {
      Game.newGame({
        goal: pickGoal,
        arch: pickArch,
        seed: Game.dailySeed(),
        daily: true,
        dailyDate: Game.dailyDate()
      });
      screen('game');
      toast('🌍 Ежедневный забег · ' + Game.dailyDate());
    });

    el.btnContinue.addEventListener('click', function () { Game.resume(); });
    el.btnSoundStart.addEventListener('click', function () {
      var on = Sound.toggle();
      Storage.setMeta({ soundOn: on });
      refreshStart();
    });
    el.btnTheme.addEventListener('click', function () {
      var meta = Storage.meta();
      var next = THEMES[(THEMES.indexOf(meta.theme) + 1) % THEMES.length];
      Storage.setTheme(next);
      applyTheme(next);
      Sound.play('tap');
    });
    el.btnRulesStart.addEventListener('click', rulesModal);

    /* --- игра --- */
    /* КРАЕВЫЕ СЛУЧАИ, которые здесь закрыты:
       1) Быстрый двойной тап: Game.choose сам вернёт null, если ход уже сделан
          (await = true), поэтому дубль просто не пройдёт. Но мы ещё и глушим
          повторный тап на 350 мс, чтобы не было двойной анимации/звука.
       2) Кнопка устарела: пока игрок думал, состояние могло измениться
          (например, цепочка списала деньги). Тогда choose вернёт null, и мы
          не оставляем «мёртвый тап» — перерисовываем карточку и объясняем. */
    var tapLocked = false;
    el.actions.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.choice') : null;
      if (!btn || btn.disabled || tapLocked) return;

      tapLocked = true;
      global.setTimeout(function () { tapLocked = false; }, 350);

      Sound.play('tap');

      /* «Критический выбор» = дорогое списание или риск. Такой тап
         отдаётся средней вибрацией, обычный — лёгкой: палец чувствует
         разницу между «взять хлеб» и «поставить машину на ремонт». */
      var s = Game.get();
      var card = (s && global.Events) ? Events.get(s.cardId) : null;
      var choice = (card && card.choices) ? card.choices[Number(btn.dataset.i)] : null;
      var cost = choice ? (typeof choice.cost === 'number' ? choice.cost : (choice.cost && choice.cost.money) || 0) : 0;
      var risky = !!(choice && choice.risk && choice.risk.length);
      buzz((cost >= 5000 || (risky && cost >= 2000)) ? 'medium' : 'light');

      if (!Game.choose(Number(btn.dataset.i))) {
        toast('Этот вариант больше недоступен');
        renderHUD();
        if (lastCardPayload) renderCard(lastCardPayload);
      }
    });
    el.btnMenu.addEventListener('click', menuModal);
    el.btnDetails.addEventListener('click', detailsModal);
    el.btnJournal.addEventListener('click', journalModal);

    /* --- финал --- */
    el.btnAgain.addEventListener('click', function () { Game.newGame({ goal: pickGoal, arch: pickArch }); screen('game'); });
    el.btnToStart.addEventListener('click', function () {
      Storage.clear();            // партия закончена: сейв больше не нужен, рекорды остаются
      refreshStart();
      screen('start');
    });
    el.btnShare.addEventListener('click', function () {
      var end = Game.get().end;
      if (!end) { toast('Сначала доиграй партию'); return; }
      var text = shareText(end);
      if (global.VK && VK.share) {
        VK.share(text);
      } else if (global.navigator && navigator.share) {
        navigator.share({ text: text }).catch(function () {});
      } else if (global.navigator && navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { toast('Результат скопирован'); }, function () { toast(text); });
      } else {
        toast(text);
      }
    });
    el.btnCard.addEventListener('click', function () { storyCard(Game.get().end); });
    el.btnBoard.addEventListener('click', leaderboardModal);

    /* --- модалка --- */
    el.modalBack.addEventListener('click', function (e) {
      if (e.target === el.modalBack) { closeModal(); return; }
      var btn = e.target.closest ? e.target.closest('button[data-act]') : null;
      if (!btn) return;
      var fn = el.modal._onAction;
      if (fn) fn(btn.dataset.act);
    });

    /* --- подписка на игру --- */
    Game.on('card', function (payload) {
      lastCardPayload = payload;
      screen('game');
      renderHUD();
      renderCard(payload);
    });

    Game.on('result', function (res) {
      screen('game');
      renderHUD();
      renderResult(res);
    });

    Game.on('end', function (end) { showEnd(end); });

    Game.on('achievement', function (a) { showAchievement(a); });

    /* Свежий критический порог: чип, «тревожный» звук и вибрация. */
    Game.on('warning', function (w) { showWarning(w); });

    /* Если игрок закрыл приложение уже после финала — показываем его итоги. */
    var last = Storage.load();
    if (last && last.over && last.end) showEnd(last.end);

    /* В ВК: облачный сейв, просьбы о помощи и проверка подарков. */
    if (!Storage.load() && global.VK && VK.cloudLoad) {
      VK.cloudLoad(function (cloud) {
        if (!cloud || !cloud.day) return;
        Storage.save(cloud);
        refreshStart();
        toast('Прогресс подгружен из облака ВК');
      });
    }
    initHelpFlow();

    /* Сообщаем сторожу запуска (см. inline-скрипт в index.html), что игра
       поднялась: иначе он через 2 секунды покажет плашку с ошибкой. */
    global.__DZ_BOOTED = true;
  }

  global.UI = {
    init: init,
    screen: screen,
    toast: toast,
    render: renderHUD,
    showEnd: showEnd
  };

  /* index.html подключает скрипты в конце body, но на всякий случай
     поддерживаем и загрузку до готовности DOM. */
  if (doc) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
    else init();
  }

})(typeof window !== 'undefined' ? window : globalThis);
