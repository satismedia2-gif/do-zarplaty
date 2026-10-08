/* ============================================================================
   events.js — весь контент событий и правило выбора карточки дня.

   Схема события:
     id         — уникальный ключ (он же ключ кулдауна)
     icon       — эмодзи-иконка
     title      — заголовок до 45 символов
     text       — 1–2 короткие строки описания
     rarity     — common | uncommon | rare | epic (цвет рамки + звук)
     weight     — базовый вес в розыгрыше (больше вес — чаще выпадает)
     weightFn   — необязательно: (state, weight) => вес, зависит от ситуации
     minDay/maxDay, cooldown, once — условия появления
     queued     — true: событие выпадает ТОЛЬКО как последствие цепочки
     chain      — имя цепочки (для читаемости)
     require    — декларативные условия (см. checkReq ниже)
     requireFn  — необязательно: (state) => boolean для сложной логики
     choices[]  — 2–3 варианта действий

   Схема выбора:
     id, label, icon, hint
     cost:    { money, category }   — списание (уходит в статистику трат);
                                      допускается и просто число
     effects: { money, health, energy, mood, social, family, work, fatigue,
                luck, risk, exp, carCondition, carGone, creditAdd, creditPay,
                flag, unflag, category,
                gigs, breakdowns, debts, parties, charity, repairs, savings }
     risk:    [ { chance, text, effects } ] — броски после выбора: если шансы
              в сумме дают 1, это взаимоисключающие исходы (сработает один),
              иначе каждый бросок независим. См. rollRisks в game.js.
     next:    { id, in }            — последствие: поставить событие в очередь
                                      цепочки через «in» дней
     result:  текст исхода
     requires:{ ... }               — те же ключи, что и в require; иначе кнопка «серая»

   Все ключи условий: car, money, moneyBelow, credit, flag, flagNot,
   healthAbove/Below, energyAbove/Below, moodAbove/Below, socialAbove/Below,
   familyAbove/Below, workAbove/Below, fatigueAbove/Below, luckAbove/Below,
   expAbove, riskAbove, carCondAbove, carCondBelow, counterAbove: { gigs: 3 }

   Словарь эффектов читает game.js — здесь только данные, ни одной формулы.
   ========================================================================== */
(function (global) {
  'use strict';

  var EVENTS = [

    /* ---------------------------------------------------------- ДЕНЬГИ ---- */
    {
      id: 'three_days_left', icon: '🍜', rarity: 'common', weight: 13, minDay: 2, cooldown: 6,
      title: 'До зарплаты три дня, в кошельке 412 ₽',
      text: 'В приложении банка грустно. В холодильнике — банка огурцов и надежда.',
      tags: ['money', 'food'],
      require: { moneyBelow: 8000 },
      weightFn: function (s, w) { return s.money < 3000 ? w * 3 : w; },
      choices: [
        {
          id: 'doshirak', label: 'Режим доширака', icon: '🍜', hint: 'дёшево · −настроение',
          effects: { money: -400, health: -4, mood: -8, energy: +4, category: 'food' },
          result: 'Ты знал, что у лапши есть вкусы. Теперь ты знаешь их все.'
        },
        {
          id: 'borrow', label: 'Занять у друга до зарплаты', icon: '🤝', hint: '+3 000 ₽ · −отношения',
          effects: { money: +3000, social: -12, flag: 'debt_to_friend' },
          result: '«Без вопросов». Вопросы, конечно, будут потом.'
        },
        {
          id: 'sell', label: 'Продать старый телефон', icon: '📦', hint: '+4 500 ₽ · один раз',
          effects: { money: +4500, mood: -3, flag: 'sold_phone' },
          requires: { flagNot: 'sold_phone' },
          result: 'Покупатель сбил цену вдвое. Деньги пришли в тот же день.'
        }
      ]
    },
    {
      id: 'side_gig', icon: '💼', rarity: 'common', weight: 12, minDay: 3, cooldown: 4,
      title: 'Шабашка на вечер',
      text: 'Знакомый просит помочь с переездом. Платят сразу и наличными.',
      tags: ['work', 'money'],
      require: { energyAbove: 20 },
      choices: [
        {
          id: 'go', label: 'Поехать', icon: '💪', hint: '+7 000 ₽ · −силы',
          effects: { money: +7000, energy: -25, health: -4, social: +6 },
          result: 'Диван победил тебя по очкам, но деньги на месте.'
        },
        {
          id: 'half', label: 'Помочь на два часа', icon: '🕑', hint: '+3 000 ₽ · −немного сил',
          effects: { money: +3000, energy: -10, social: +3 },
          result: 'Нормально. Не подвиг, но и не отказ.'
        },
        {
          id: 'rest', label: 'Отлежаться', icon: '🛋', hint: '+силы · −отношения',
          effects: { energy: +12, mood: +4, social: -8 },
          result: 'Ты посмотрел сериал. Знакомый позвал кого-то другого.'
        }
      ]
    },
    {
      id: 'colleague_loan', icon: '🤝', rarity: 'uncommon', weight: 7, minDay: 6, cooldown: 18,
      title: 'Коллега просит до зарплаты',
      text: '«Ты же понимаешь, у меня ипотека». Смотрит честными глазами.',
      tags: ['money', 'social'],
      require: { money: 6000 },
      choices: [
        {
          id: 'lend', label: 'Занять 5 000 ₽', icon: '💸', hint: '−5 000 ₽ · +отношения',
          cost: { money: 5000, category: 'other' },
          effects: { social: +10, mood: +3 },
          risk: [{ chance: 0.35, text: 'Через неделю вернул. Редкий человек.', effects: { money: +5000, social: +5 } }],
          result: 'Ты дал. Теперь ждёшь.'
        },
        {
          id: 'half', label: 'Занять 2 000 ₽', icon: '🪙', hint: '−2 000 ₽',
          cost: { money: 2000, category: 'other' },
          effects: { social: +4, mood: -2 },
          result: '«Больше нет, извини». Он кивнул слишком быстро.'
        },
        {
          id: 'refuse', label: 'Сказать, что сам на мели', icon: '🙅', hint: '−отношения',
          effects: { social: -9, mood: -4 },
          result: 'Он всё понял. И запомнил.'
        }
      ]
    },
    {
      id: 'credit_offer', icon: '💳', rarity: 'uncommon', weight: 8, minDay: 8, cooldown: 22,
      title: 'Банк одобрил кредит',
      text: '«Вам предодобрено 300 000 ₽ под 24,9%». Кнопка «Получить» ярко-зелёная.',
      tags: ['money', 'credit'],
      require: { flagNot: 'credit_taken' },
      choices: [
        {
          id: 'take', label: 'Взять 150 000 ₽', icon: '💸', hint: '+150 000 ₽ · платёж 6 200 ₽/мес',
          effects: { money: +150000, creditAdd: 150000, mood: +10, flag: 'credit_taken' },
          result: 'На одну минуту ты почувствовал себя богатым человеком.'
        },
        {
          id: 'small', label: 'Взять 40 000 ₽ «на всякий»', icon: '🧾', hint: '+40 000 ₽ · платёж 6 200 ₽/мес',
          effects: { money: +40000, creditAdd: 40000, mood: +4, flag: 'credit_taken' },
          result: 'Немного, зато спокойно. Так ты тогда думал.'
        },
        {
          id: 'refuse', label: 'Удалить приложение банка', icon: '🧘', hint: 'спокойствие',
          effects: { mood: +6, energy: +3 },
          result: 'Ты стал беднее на 150 000 ₽, которых у тебя и не было.'
        }
      ]
    },
    {
      id: 'lottery', icon: '🎟', rarity: 'uncommon', weight: 6, minDay: 5, cooldown: 20,
      title: 'Лотерея у кассы',
      text: 'Продавщица говорит: «Берите, вчера мужчина выиграл». Это неправда. Наверное.',
      tags: ['money', 'risk'],
      require: { money: 1000 },
      choices: [
        {
          id: 'buy', label: 'Взять три билета', icon: '🎟', hint: '−900 ₽ · шанс есть',
          cost: { money: 900, category: 'fun' },
          risk: [
            { chance: 0.06, text: 'Выигрыш! +50 000 ₽', effects: { money: +50000, mood: +25 } },
            { chance: 0.14, text: 'Мелкий выигрыш: +1 500 ₽', effects: { money: +1500, mood: +8 } },
            { chance: 0.80, text: 'Три пустых бумажки', effects: { mood: -5 } }
          ],
          result: 'Ты стёр защитный слой прямо у кассы.'
        },
        {
          id: 'pass', label: 'Пройти мимо', icon: '🚶', hint: 'бесплатно',
          effects: { mood: +1 },
          result: 'Ты вышел из магазина и ни о чём не пожалел.'
        }
      ]
    },
    {
      id: 'found_wallet', icon: '👛', rarity: 'rare', weight: 4, minDay: 9, cooldown: 30,
      title: 'На лавочке лежит кошелёк',
      text: 'Внутри — деньги и чья-то карта. Вокруг никого.',
      tags: ['money', 'moral'],
      choices: [
        {
          id: 'police', label: 'Отнести в полицию', icon: '🚔', hint: 'честно · +настроение',
          effects: { mood: +12, social: +6, energy: -6 },
          risk: [{ chance: 0.4, text: 'Владелец нашёлся и дал 3 000 ₽', effects: { money: +3000, mood: +8 } }],
          result: 'Ты потратил вечер на заявление. Зато спал спокойно.'
        },
        {
          id: 'keep', label: 'Забрать себе', icon: '🫣', hint: '+8 000 ₽ · совесть',
          effects: { money: +8000, mood: -6 },
          result: 'Деньги в кармане, взгляд в пол.'
        },
        {
          id: 'search', label: 'Найти владельца по карте', icon: '🔎', hint: 'долго · +отношения',
          effects: { social: +14, energy: -10, mood: +6 },
          result: 'Сработало. Тебе вернули «спасибо» и сотку на такси.'
        }
      ]
    },

    /* ----------------------------------------------------------- АВТО ----- */
    {
      id: 'fuel_light', icon: '⛽', rarity: 'common', weight: 10, minDay: 2, cooldown: 9,
      title: 'Лампочка бензина горит третий день',
      text: 'Ты давно знаешь, что это не «ещё поездит», но надежда жива.',
      tags: ['car', 'money'],
      require: { car: true, money: 1200 },
      choices: [
        {
          id: 'full', label: 'Залить полный бак', icon: '⛽', hint: '−3 200 ₽ · надолго',
          cost: { money: 3200, category: 'car' },
          effects: { mood: +5, carCondition: +1 },
          result: 'Бак полный, и ты на неделю забыл об этой лампочке.'
        },
        {
          id: 'twenty', label: 'Залить на 1 000 ₽', icon: '🪙', hint: '−1 000 ₽ · ненадолго',
          cost: { money: 1000, category: 'car' },
          effects: { mood: -2 },
          risk: [{ chance: 0.25, text: 'Не доехал. Знакомый привёз канистру: −1 500 ₽', effects: { money: -1500, energy: -8, mood: -8 } }],
          result: 'Стрелка поднялась на одно деление и замерла укоризненно.'
        },
        {
          id: 'bus', label: 'Поехать на автобусе', icon: '🚌', hint: '−60 ₽ · −силы',
          effects: { money: -60, energy: -5, mood: -4, category: 'home' },
          result: 'Машина стоит во дворе и смотрит на тебя.'
        }
      ]
    },
    {
      id: 'car_gearbox', icon: '🚗', rarity: 'uncommon', weight: 10, minDay: 4, cooldown: 12,
      title: 'Коробка ушла в закат',
      text: 'На светофоре что-то хрустнуло. Дальше — только вторая и задняя.',
      tags: ['car', 'money'],
      require: { car: true },
      choices: [
        {
          id: 'service', label: 'Сдать в сервис', icon: '🔧', hint: '−18 000 ₽ · надёжно',
          cost: { money: 18000, category: 'car' },
          effects: { carCondition: +35, mood: +4 },
          risk: [{ chance: 0.15, text: '«Нашли ещё одно»: −4 000 ₽', effects: { money: -4000, category: 'car' } }],
          result: 'Мастер сказал «ездий». Ты поехал.'
        },
        {
          id: 'garage', label: 'Гараж у знакомого', icon: '🔩', hint: '−6 000 ₽ · лотерея',
          cost: { money: 6000, category: 'car' },
          effects: { energy: -8, social: +4 },
          risk: [
            { chance: 0.35, text: 'Починил, но теперь гудит', effects: { carCondition: -12, mood: -6 } },
            { chance: 0.65, text: 'Сделал лучше сервиса', effects: { carCondition: +28, mood: +8 } }
          ],
          result: 'В гараже пахло бензином и дружбой.'
        },
        {
          id: 'ride_on', label: 'Ездить так', icon: '🙈', hint: 'бесплатно · риск',
          effects: { carCondition: -20, mood: -7, energy: -4 },
          risk: [{ chance: 0.3, text: 'Встал на мосту. Эвакуатор: −9 000 ₽', effects: { money: -9000, carCondition: -10, category: 'car' } }],
          result: 'Ты научился трогаться со второй и не смотреть на приборы.'
        }
      ]
    },
    {
      id: 'car_tow', icon: '🚨', rarity: 'uncommon', weight: 8, minDay: 5, cooldown: 16,
      title: 'Машину увозит эвакуатор',
      text: 'Ты вышел на две минуты. Этого хватило.',
      tags: ['car', 'money'],
      require: { car: true, money: 3000 },
      weightFn: function (s, w) { return s.car.condition < 45 ? w * 2 : w; },
      choices: [
        {
          id: 'pay', label: 'Забрать со штрафстоянки', icon: '🏧', hint: '−7 500 ₽',
          cost: { money: 7500, category: 'car' },
          effects: { mood: -10, energy: -8 },
          result: 'Очередь, квитанция, ворота. Три часа жизни.'
        },
        {
          id: 'friends', label: 'Звонить знакомому с корочкой', icon: '📞', hint: '−отношения · дешевле',
          cost: { money: 2500, category: 'car' },
          effects: { social: -10, energy: -5, mood: -4 },
          result: 'Помог. Но теперь ты должен. Дважды.'
        },
        {
          id: 'leave', label: 'Оставить до лучших времён', icon: '🫥', hint: '−машина на время',
          effects: { carGone: true, mood: -14, health: -2 },
          result: 'Ты поехал домой на автобусе и всю дорогу молчал.'
        }
      ]
    },
    {
      id: 'sti_check', icon: '👮', rarity: 'common', weight: 9, minDay: 4, cooldown: 11,
      title: 'Инспектор просит остановиться',
      text: '«Документики». Ты вспоминаешь, где они. Не помнишь.',
      tags: ['car', 'money'],
      require: { car: true },
      choices: [
        {
          id: 'pay_fast', label: 'Заплатить со скидкой 50%', icon: '🏧', hint: '−2 500 ₽',
          cost: { money: 2500, category: 'car' },
          effects: { mood: -6 },
          result: 'Двадцать дней на оплату. Ты уложился в двадцать минут.'
        },
        {
          id: 'argue', label: 'Спорить и требовать протокол', icon: '📄', hint: 'риск · нервы',
          effects: { energy: -8, mood: -6 },
          risk: [
            { chance: 0.45, text: 'Отпустил. Ты был прав.', effects: { mood: +10 } },
            { chance: 0.55, text: 'Протокол на полную: −5 000 ₽', effects: { money: -5000, category: 'car' } }
          ],
          result: 'Двадцать минут на солнце у обочины.'
        },
        {
          id: 'rush', label: '«Я на работу опаздываю»', icon: '🏃', hint: 'бесплатно · наглость',
          effects: { mood: -2 },
          risk: [{ chance: 0.35, text: 'Не поверил: −5 000 ₽ и лекция', effects: { money: -5000, mood: -10, category: 'car' } }],
          result: 'Он посмотрел на часы, потом на тебя. И махнул рукой.'
        }
      ]
    },

    /* ---------------------------------------------------------- БЫТ ------- */
    {
      id: 'hot_water_off', icon: '🚿', rarity: 'common', weight: 8, minDay: 2, cooldown: 26,
      title: 'Отключили горячую воду',
      text: 'На две недели. Объявление на подъезде приклеено скотчем.',
      tags: ['home'],
      choices: [
        {
          id: 'kettle', label: 'Чайник и тазик', icon: '🫖', hint: 'бесплатно · −силы',
          effects: { energy: -8, mood: -6 },
          result: 'Ты стал мастером спорта по мытью головы над раковиной.'
        },
        {
          id: 'gym', label: 'Абонемент в зал', icon: '🏋️', hint: '−2 500 ₽ · +здоровье',
          cost: { money: 2500, category: 'health' },
          effects: { health: +8, mood: +7, energy: +5 },
          result: 'Душ, бассейн и мысль «а мог бы и заниматься».'
        },
        {
          id: 'visit', label: 'К маме помыться', icon: '🏡', hint: 'бесплатно · +отношения',
          effects: { mood: +8, social: +8, energy: -4 },
          result: 'Ты унёс с собой банку варенья и чувство вины.'
        }
      ]
    },
    {
      id: 'neighbor_drill', icon: '🔨', rarity: 'common', weight: 10, minDay: 2, cooldown: 8,
      title: 'Сосед сверху начал ремонт',
      text: 'Перфоратор в семь утра. Суббота. Он искренне считает, что так надо.',
      tags: ['home', 'mood'],
      choices: [
        {
          id: 'endure', label: 'Терпеть', icon: '🎧', hint: '−силы · −настроение',
          effects: { energy: -10, mood: -12, health: -3 },
          result: 'Ты выучил ритм его перфоратора. Он был неровный.'
        },
        {
          id: 'talk', label: 'Пойти поговорить', icon: '🚪', hint: 'риск · может помочь',
          effects: { energy: -5 },
          risk: [
            { chance: 0.5, text: 'Договорились на «с десяти»', effects: { mood: +10, social: +6 } },
            { chance: 0.5, text: 'Поссорились. Теперь он сверлит назло', effects: { mood: -14, social: -6 } }
          ],
          result: 'Разговор в подъезде, оба в тапках.'
        },
        {
          id: 'earplugs', label: 'Беруши и наушники', icon: '🛒', hint: '−800 ₽ · тишина',
          cost: { money: 800, category: 'other' },
          effects: { mood: +8, energy: +6 },
          result: 'Лучшие 800 рублей за этот месяц.'
        }
      ]
    },
    {
      id: 'electricity_bill', icon: '💡', rarity: 'common', weight: 7, minDay: 3, cooldown: 27,
      title: 'Счёт за свет вырос вдвое',
      text: '«Возможно, вы стали больше пользоваться электроприборами». Ты — нет.',
      tags: ['home', 'money'],
      weightFn: function (s, w) { return ((s.day - 1) % 30 < 7) ? w * 2 : w * 0.5; },
      choices: [
        {
          id: 'pay', label: 'Оплатить сразу', icon: '🏧', hint: '−4 200 ₽',
          cost: { money: 4200, category: 'home' },
          effects: { mood: +3 },
          result: 'Квитанция в приложении стала зелёной. Мелочь, а приятно.'
        },
        {
          id: 'delay', label: 'Потянуть до зарплаты', icon: '⏳', hint: 'риск · пени',
          effects: { mood: -5 },
          risk: [{ chance: 0.45, text: 'Пени и напоминание: −5 100 ₽ и испорченный вечер', effects: { money: -5100, mood: -8, category: 'home' } }],
          result: 'Ты отложил бумажку под магнит на холодильнике.'
        },
        {
          id: 'dispute', label: 'Позвонить и разобраться', icon: '☎️', hint: '−силы · может выйдет дешевле',
          effects: { energy: -12, mood: -4 },
          risk: [
            { chance: 0.4, text: 'Пересчитали: −2 100 ₽ вместо 4 200 ₽', effects: { money: -2100, mood: +10, category: 'home' } },
            { chance: 0.6, text: '«Всё верно». Заплатил 4 200 ₽ и 40 минут жизни', effects: { money: -4200, category: 'home' } }
          ],
          result: 'Музыка на линии была приятнее разговора.'
        }
      ]
    },
    {
      id: 'pyaterochka_sale', icon: '🛒', rarity: 'common', weight: 10, minDay: 2, cooldown: 6,
      title: 'Акция: два по цене одного',
      text: 'Ты зашёл за хлебом. Ты всегда заходишь за хлебом.',
      tags: ['food'],
      choices: [
        {
          id: 'stock', label: 'Закупиться на неделю', icon: '🛍', hint: '−2 800 ₽ · сыт',
          cost: { money: 2800, category: 'food' },
          effects: { mood: +7, health: +5 },
          result: 'Пакеты режут руки, но холодильник снова полный.'
        },
        {
          id: 'bread', label: 'Взять только хлеб', icon: '🍞', hint: '−60 ₽',
          effects: { money: -60, category: 'food', mood: -2 },
          result: 'Ты вышел с одним пакетом. Это была победа.'
        },
        {
          id: 'impulse', label: 'Набрать всего красивого', icon: '🛒', hint: '−6 500 ₽ · −совесть',
          cost: { money: 6500, category: 'food' },
          effects: { mood: +14, health: -3 },
          result: 'Дома ты не помнил, зачем купил три вида сыра.'
        }
      ]
    },
    {
      id: 'delivery_urge', icon: '🍕', rarity: 'common', weight: 10, minDay: 2, cooldown: 5,
      title: 'Приложение уговаривает на доставку',
      text: '«Ваш любимый ресторан рядом». Промокод на 200 ₽. Скидка на первый заказ.',
      tags: ['food', 'fun'],
      weightFn: function (s, w) { return s.energy < 45 ? w * 1.6 : w; },
      choices: [
        {
          id: 'order', label: 'Заказать пиццу', icon: '🍕', hint: '−1 900 ₽ · +настроение',
          cost: { money: 1900, category: 'fun' },
          effects: { mood: +14, health: -4, energy: +5 },
          result: 'Курьер приехал за 19 минут. Ты даже не успел проголодаться.'
        },
        {
          id: 'cook', label: 'Сварить макароны', icon: '🍝', hint: 'бесплатно · −настроение',
          effects: { mood: -6, energy: -6, health: +2 },
          result: 'Макароны, сыр, кетчуп. Классика жанра.'
        },
        {
          id: 'guests', label: 'Позвать друга и готовить вместе', icon: '👥', hint: '−700 ₽ · +отношения',
          cost: { money: 700, category: 'food' },
          effects: { social: +12, mood: +10, energy: -6 },
          result: 'Получилось странно, но весело. Друг остался до ночи.'
        }
      ]
    },
    {
      id: 'phone_screen', icon: '📱', rarity: 'common', weight: 9, minDay: 3, cooldown: 14,
      title: 'Телефон упал экраном вниз',
      text: 'Звук был такой, будто хрустнуло что-то дорогое. Потому что так и было.',
      tags: ['tech', 'money'],
      choices: [
        {
          id: 'replace', label: 'Новый экран', icon: '🧾', hint: '−8 500 ₽',
          cost: { money: 8500, category: 'other' },
          effects: { mood: +6 },
          result: 'Как новый. Почти.'
        },
        {
          id: 'tape', label: 'Плёнка и молитва', icon: '🩹', hint: 'бесплатно · −настроение',
          effects: { mood: -10, health: -2 },
          result: 'Палец теперь всегда знает, где трещина.'
        },
        {
          id: 'cheap', label: 'Найти мастера «подешевле»', icon: '🔧', hint: '−4 500 ₽ · риск',
          cost: { money: 4500, category: 'other' },
          effects: { mood: +2 },
          risk: [
            { chance: 0.3, text: 'Через день пошли полосы. Деньги вернуть не вышло', effects: { mood: -12, money: -0 } },
            { chance: 0.7, text: 'Сделал аккуратно', effects: { mood: +6 } }
          ],
          result: 'Мастер работал на кухне и смотрел видео с ютуба.'
        }
      ]
    },
    {
      id: 'sneakers_ad', icon: '👟', rarity: 'common', weight: 9, minDay: 4, cooldown: 12,
      title: 'Реклама кроссовок в каждой ленте',
      text: '«Осталось три размера». Ты видишь их четвёртый день подряд.',
      tags: ['money', 'impulse'],
      choices: [
        {
          id: 'buy', label: 'Купить те самые', icon: '👟', hint: '−12 000 ₽ · +настроение',
          cost: { money: 12000, category: 'fun' },
          effects: { mood: +18, social: +4 },
          result: 'Они красивые. Ты носишь их аккуратно и гордо.'
        },
        {
          id: 'analog', label: 'Найти похожие дешевле', icon: '🔍', hint: '−3 500 ₽',
          cost: { money: 3500, category: 'fun' },
          effects: { mood: +7, health: -2 },
          result: 'Сверху почти не отличить. Снизу — очень даже.'
        },
        {
          id: 'delete', label: 'Удалить приложение магазина', icon: '🚫', hint: 'сэкономить',
          effects: { mood: +5, social: -1 },
          result: 'Лента стала тише. Ты стал богаче на 12 000 ₽, которых не потратил.'
        }
      ]
    },
    {
      id: 'black_friday', icon: '🏷', rarity: 'rare', weight: 5, minDay: 20, cooldown: 60, once: true,
      title: 'Чёрная пятница',
      text: 'Цены выросли, чтобы потом упасть. Но скидки действительно есть.',
      tags: ['money', 'impulse'],
      choices: [
        {
          id: 'stock_up', label: 'Закупиться на полгода', icon: '📦', hint: '−28 000 ₽ · выгодно',
          cost: { money: 28000, category: 'other' },
          effects: { mood: +12, energy: -8, flag: 'stocked_up' },
          result: 'Квартира забита, носки и гречка обеспечены до весны.'
        },
        {
          id: 'one_thing', label: 'Купить одну нужную вещь', icon: '🎯', hint: '−6 000 ₽',
          cost: { money: 6000, category: 'other' },
          effects: { mood: +8, health: +3 },
          result: 'Ты купил то, что искал два месяца. И не жалеешь.'
        },
        {
          id: 'skip', label: 'Переждать в подвале', icon: '🧊', hint: 'не смотреть на цены',
          effects: { mood: -3 },
          result: 'Ты честно не открывал приложения три дня.'
        }
      ]
    },

    /* -------------------------------------------------------- ЛЮДИ -------- */
    {
      id: 'friends_bar', icon: '🍻', rarity: 'common', weight: 11, minDay: 5, cooldown: 7,
      title: 'Пацаны зовут в бар',
      text: '«Ну ты чё, на пять минут же». Ты знаешь, что это неправда.',
      tags: ['fun', 'social'],
      choices: [
        {
          id: 'go', label: 'Пойти', icon: '🍺', hint: '−4 500 ₽ · −здоровье',
          cost: { money: 4500, category: 'fun' },
          effects: { mood: +18, social: +14, health: -8, energy: -12 },
          result: 'Пять минут длились до двух ночи.'
        },
        {
          id: 'one', label: 'Зайти на один', icon: '🥤', hint: '−1 200 ₽',
          cost: { money: 1200, category: 'fun' },
          effects: { mood: +7, social: +6, health: -2, energy: -4 },
          result: 'Ты ушёл первым. Это было мудро.'
        },
        {
          id: 'no', label: 'Остаться дома', icon: '🏠', hint: 'сэкономить · −настроение',
          effects: { mood: -9, social: -7, energy: +8 },
          result: 'В чате выложили фото. Ты его лайкнул.'
        }
      ]
    },
    {
      id: 'mom_call', icon: '📞', rarity: 'common', weight: 10, minDay: 3, cooldown: 9,
      title: 'Мама звонит',
      text: 'Она просто спросила, поел ли ты. Это длится сорок минут.',
      tags: ['social'],
      choices: [
        {
          id: 'talk', label: 'Поговорить нормально', icon: '☕️', hint: '+настроение · −силы',
          effects: { mood: +13, social: +10, energy: -6 },
          result: 'Она рассказала про кота и соседей. Тебе стало легче.'
        },
        {
          id: 'later', label: '«Перезвоню, я занят»', icon: '⏱', hint: '−отношения',
          effects: { mood: -8, social: -8 },
          result: 'Ты действительно был занят. Ничем важным.'
        },
        {
          id: 'ask', label: 'Попросить денег', icon: '💸', hint: '+10 000 ₽ · −гордость',
          effects: { money: +10000, social: -10, mood: -8 },
          result: 'Она перевела сразу и сказала, что всё нормально.'
        }
      ]
    },
    {
      id: 'friend_wedding', icon: '💍', rarity: 'uncommon', weight: 6, minDay: 10, cooldown: 50, once: true,
      title: 'Друг пригласил на свадьбу',
      text: 'Ресторан за городом, дресс-код, конверт. Ты рад. Ты правда рад.',
      tags: ['social', 'money'],
      choices: [
        {
          id: 'full', label: 'Подарок и гулять до конца', icon: '🎁', hint: '−12 000 ₽ · −силы',
          cost: { money: 12000, category: 'fun' },
          effects: { mood: +20, social: +18, health: -8, energy: -18 },
          result: 'Ты танцевал с тётей невесты. Она была лучше всех.'
        },
        {
          id: 'cheap', label: 'Скромный подарок и уйти раньше', icon: '🎀', hint: '−3 500 ₽',
          cost: { money: 3500, category: 'fun' },
          effects: { mood: +8, social: +6, energy: -6 },
          result: 'Ты уехал на последнем автобусе, как взрослый человек.'
        },
        {
          id: 'skip', label: 'Не пойти, сослаться на работу', icon: '📵', hint: '−отношения',
          effects: { social: -22, mood: -12 },
          result: 'Он написал «всё нормально, брат». И это было хуже всего.'
        }
      ]
    },
    {
      id: 'boss_saturday', icon: '🗂', rarity: 'uncommon', weight: 10, minDay: 7, cooldown: 9,
      title: 'Начальник просит выйти в субботу',
      text: '«Ты же понимаешь, квартальный отчёт сам себя не закроет».',
      tags: ['work', 'job'],
      choices: [
        {
          id: 'yes', label: 'Выйти', icon: '🖥', hint: '+9 000 ₽ премия · −выходной',
          effects: { money: +9000, energy: -22, mood: -12, social: +4 },
          result: 'Отчёт закрыт. Суббота — нет.'
        },
        {
          id: 'remote', label: 'Поработать из дома', icon: '💻', hint: '+4 000 ₽ · −силы',
          effects: { money: +4000, energy: -10, mood: -4 },
          result: 'Ты работал в кровати и почти не заметил, как прошёл день.'
        },
        {
          id: 'no', label: 'Сказать «не могу»', icon: '🚫', hint: 'риск · −премия',
          effects: { mood: +8, energy: +6 },
          risk: [{ chance: 0.25, text: '«Тогда без премии в этом месяце»: −12 000 ₽', effects: { money: -12000, mood: -8, category: 'other' } }],
          result: 'Ты выспался. Начальник запомнил.'
        }
      ]
    },
    {
      id: 'cat_sick', icon: '🐈', rarity: 'uncommon', weight: 7, minDay: 6, cooldown: 30,
      title: 'Кот третий день не ест',
      text: 'Он лежит на подоконнике и смотрит куда-то мимо тебя.',
      tags: ['health', 'money'],
      choices: [
        {
          id: 'vet', label: 'В ветклинику', icon: '🏥', hint: '−8 000 ₽ · +настроение',
          cost: { money: 8000, category: 'health' },
          effects: { mood: +14, social: +4, energy: -6 },
          result: '«Ничего страшного, просто обиделся». Врач, кажется, тоже про тебя.'
        },
        {
          id: 'folk', label: 'Народные методы', icon: '🧄', hint: 'бесплатно · риск',
          effects: { energy: -6 },
          risk: [
            { chance: 0.4, text: 'Само прошло, кот снова ест', effects: { mood: +8 } },
            { chance: 0.6, text: 'Стало хуже, ночь в клинике: −14 000 ₽', effects: { money: -14000, mood: -14, health: -2, category: 'health' } }
          ],
          result: 'Ты искал советы в интернете до трёх ночи.'
        },
        {
          id: 'friend', label: 'Спросить у знакомой-ветеринара', icon: '💬', hint: '−1 500 ₽ · +отношения',
          cost: { money: 1500, category: 'health' },
          effects: { social: +6, mood: +8 },
          result: 'Она приехала сама и привезла лекарство.'
        }
      ]
    },
    {
      id: 'toothache', icon: '🦷', rarity: 'uncommon', weight: 8, minDay: 5, cooldown: 18,
      title: 'Зуб разболелся ночью',
      text: 'Боль такая, что ты вспомнил все свои долги и школьную физику.',
      tags: ['health'],
      choices: [
        {
          id: 'dentist', label: 'К стоматологу', icon: '🪥', hint: '−11 000 ₽',
          cost: { money: 11000, category: 'health' },
          effects: { health: +12, mood: +9 },
          result: 'Через час ты снова верил в людей.'
        },
        {
          id: 'pills', label: 'Обезболивающее и терпеть', icon: '💊', hint: '−300 ₽ · риск',
          effects: { money: -300, category: 'health', health: -7, mood: -7, energy: -8 },
          risk: [{ chance: 0.25, text: 'К утру щека как у хомяка: срочно −9 000 ₽', effects: { money: -9000, health: -8, category: 'health' } }],
          result: 'Ты выжил. Зуб — тоже, но он обиделся.'
        }
      ]
    },
    {
      id: 'bus_late', icon: '🚌', rarity: 'common', weight: 9, minDay: 2, cooldown: 7,
      title: 'Автобус уехал перед носом',
      text: 'Следующий через двадцать минут. На работу — через двадцать пять.',
      tags: ['home', 'work'],
      choices: [
        {
          id: 'taxi', label: 'Вызвать такси', icon: '🚕', hint: '−600 ₽ · вовремя',
          cost: { money: 600, category: 'home' },
          effects: { mood: -3 },
          result: 'Приехал за минуту до переклички. Считается.'
        },
        {
          id: 'run', label: 'Бежать', icon: '🏃', hint: 'бесплатно · −силы',
          effects: { energy: -14, health: -3, mood: +2 },
          result: 'Ты пришёл мокрый и гордый. Опоздал на семь минут.'
        },
        {
          id: 'warn', label: 'Написать начальнику', icon: '✉️', hint: 'честно · −репутация',
          effects: { mood: -5, social: -3 },
          result: '«Понял». Одно слово, а неприятно.'
        }
      ]
    },

    /* -------------------------------------------------------- РИСК -------- */
    {
      id: 'crypto_pump', icon: '🚀', rarity: 'rare', weight: 4, minDay: 12, cooldown: 25,
      title: 'Крипта иксанула',
      text: 'В чате все уже «в моменте». Ты — единственный, кто ещё думает.',
      tags: ['money', 'risk'],
      require: { money: 20000 },
      choices: [
        {
          id: 'all_in', label: 'Залететь на 30 000 ₽', icon: '🎰', hint: 'x3 или всё',
          cost: { money: 30000, category: 'other' },
          risk: [
            { chance: 0.35, text: 'Иксы! +90 000 ₽', effects: { money: +90000, mood: +25 } },
            { chance: 0.65, text: '«Это был отскок»: всё сгорело', effects: { mood: -25, health: -5 } }
          ],
          result: 'Ты смотрел на график, не мигая.'
        },
        {
          id: 'small', label: 'Закинуть 3 000 ₽', icon: '🪙', hint: 'потешить себя',
          cost: { money: 3000, category: 'other' },
          risk: [
            { chance: 0.4, text: '+7 000 ₽ и чувство гения', effects: { money: +7000, mood: +12 } },
            { chance: 0.6, text: '−3 000 ₽, зато не больно', effects: { mood: -4 } }
          ],
          result: 'Ставка сделана. Нервы целы.'
        },
        {
          id: 'skip', label: 'Пройти мимо', icon: '🧊', hint: 'скучно и правильно',
          effects: { mood: +2 },
          result: 'Через неделю чат молчал. Ты — нет.'
        }
      ]
    },
    {
      id: 'inheritance', icon: '📜', rarity: 'epic', weight: 3, minDay: 25, cooldown: 99, once: true,
      title: 'Бабушка оставила конверт',
      text: 'Она копила «на чёрный день» и не успела потратить. День, кажется, наступил.',
      tags: ['money', 'story'],
      choices: [
        {
          id: 'save', label: 'Отложить всё', icon: '🏦', hint: '+120 000 ₽',
          effects: { money: +120000, mood: +10 },
          result: 'Ты положил деньги на счёт и месяц не заглядывал туда.'
        },
        {
          id: 'car', label: 'Вложить в машину', icon: '🚗', hint: '+120 000 ₽ · ремонт',
          effects: { money: +120000, carCondition: +40, mood: +16 },
          requires: { car: true },
          result: 'Она бы одобрила. Она всегда говорила, что машина — это свобода.'
        },
        {
          id: 'credit', label: 'Закрыть кредит', icon: '💳', hint: '−60 000 ₽ долга',
          effects: { money: +120000, creditPay: 60000, mood: +20 },
          requires: { credit: true },
          result: 'Ты закрыл кредит и впервые за год спал без мыслей о платеже.'
        }
      ]
    },

    /* ============================ ЦЕПОЧКИ ================================= */
    /* Цепочка «машина»: отложил ремонт → встала окончательно → жизнь без машины */
    {
      id: 'car_postpone', icon: '🚗', rarity: 'uncommon', weight: 11, minDay: 6, cooldown: 14,
      chain: 'car', title: 'Мастер сказал: «Ещё поездит»',
      text: 'Сцепление ведёт, но ехать можно. Ремонт прямо сейчас — 18 000 ₽.',
      require: { car: true, carCondBelow: 70 },
      choices: [
        { id: 'fix', label: 'Починить сейчас', icon: '🔧', hint: '−18 000 ₽ · надёжно',
          cost: { money: 18000, category: 'car' }, effects: { carCondition: +35, mood: +6, work: +2, exp: 1 },
          result: 'Машина поехала мягко, как чужая.' },
        { id: 'garage', label: 'Сделать у знакомого', icon: '🔩', hint: '−6 000 ₽ · лотерея',
          cost: { money: 6000, category: 'car' }, effects: { energy: -8, social: +4, exp: 1 },
          risk: [ { chance: 0.35, text: 'Починил, но теперь гудит', effects: { carCondition: -14, mood: -6 } },
                  { chance: 0.65, text: 'Сделал лучше сервиса', effects: { carCondition: +26, mood: +8 } } ],
          result: 'В гараже пахло бензином и дружбой.' },
        { id: 'later', label: 'Потом починим', icon: '🙈', hint: 'бесплатно · риск',
          effects: { mood: -2, carCondition: -6 },
          next: { id: 'car_final_breakdown', in: 3 },
          result: 'Ты похлопал её по капоту и пообещал заняться в выходные.' }
      ]
    },
    {
      id: 'car_final_breakdown', icon: '🚨', rarity: 'uncommon', weight: 1, queued: true, chain: 'car',
      title: 'Машина всё-таки встала',
      text: 'На светофоре что-то хрустнуло. Дальше — только вторая и задняя.',
      choices: [
        { id: 'repair', label: 'Эвакуатор и полный ремонт', icon: '🏧', hint: '−26 000 ₽',
          cost: { money: 26000, category: 'car' }, requires: { money: 26000 },
          effects: { carCondition: +45, mood: -10, energy: -8, breakdowns: +1, exp: 2 },
          result: 'Мастер сказал «ездий». Ты поехал и весь день молчал.' },
        { id: 'sell', label: 'Продать как есть', icon: '🏷', hint: '+45 000 ₽ · без машины',
          effects: { money: +45000, carGone: true, mood: -4, breakdowns: +1, work: -4 },
          next: { id: 'car_without_car', in: 1 },
          result: 'Покупатель приехал с наличными и увёз её на верёвке.' },
        { id: 'park', label: 'Оставить во дворе', icon: '🅿️', hint: 'бесплатно · −работа',
          effects: { carGone: true, mood: -12, energy: -6, work: -8, breakdowns: +1, fatigue: +8 },
          next: { id: 'car_without_car', in: 1 },
          result: 'Теперь она стоит под окнами и напоминает о решении.' }
      ]
    },
    {
      id: 'car_without_car', icon: '🚌', rarity: 'common', weight: 1, queued: true, chain: 'car',
      title: 'Жизнь без машины',
      text: 'Автобус в 7:10, пересадка, сорок минут стоя. Зато без бензина.',
      choices: [
        { id: 'bus', label: 'Автобус и каршеринг', icon: '🚌', hint: '−1 200 ₽ · −силы',
          cost: { money: 1200, category: 'home' }, effects: { energy: -8, mood: -4, work: +2 },
          result: 'Ты выучил расписание лучше, чем водитель.' },
        { id: 'save', label: 'Копить на новую', icon: '🏦', hint: '+дисциплина',
          effects: { work: +6, fatigue: +6, savings: +1, exp: 1 },
          result: 'Ты завёл отдельный конверт и подписал его «на ту самую».' },
        { id: 'bike', label: 'Купить велосипед', icon: '🚲', hint: '−9 000 ₽ · +здоровье',
          cost: { money: 9000, category: 'home' }, effects: { health: +10, energy: -4, mood: +8, exp: 1 },
          result: 'Двадцать минут в день, зато ты снова видишь свой район.' }
      ]
    },

    /* Цепочка «подработка»: взял смену → устал → чем это кончилось */
    {
      id: 'gig_heavy', icon: '💪', rarity: 'common', weight: 12, minDay: 4, cooldown: 6,
      chain: 'gig', title: 'Предлагают смену',
      text: 'Нужен человек на разгрузку. Платят сразу, руками, наличными.',
      require: { energyAbove: 25 },
      choices: [
        { id: 'night', label: 'Взять ночную', icon: '🌙', hint: '+9 500 ₽ · −силы',
          effects: { money: +9500, energy: -28, fatigue: +18, health: -4, gigs: +1, exp: 1 },
          next: { id: 'gig_fatigue_next', in: 1 },
          result: 'Домой ты пришёл в пять утра и с деньгами.' },
        { id: 'day', label: 'Взять дневную', icon: '☀️', hint: '+5 500 ₽ · −силы',
          effects: { money: +5500, energy: -16, fatigue: +9, gigs: +1, exp: 1 },
          next: { id: 'gig_fatigue_next', in: 1 },
          result: 'Четыре часа, две фуры, один сломанный ноготь.' },
        { id: 'no', label: 'Отказаться', icon: '🛋', hint: '+силы · −репутация',
          effects: { energy: +6, mood: +3, work: -3 },
          result: 'Ты остался дома. Смена ушла к другому.' }
      ]
    },
    {
      id: 'gig_fatigue_next', icon: '🥱', rarity: 'common', weight: 1, queued: true, chain: 'gig',
      title: 'Утро после смены',
      text: 'Тело помнит каждый ящик. На работе от тебя пока мало толку.',
      choices: [
        { id: 'coffee', label: 'Три кофе и вперёд', icon: '☕️', hint: '−силы · риск',
          effects: { energy: -8, fatigue: +8, health: -3 },
          risk: [ { chance: 0.35, text: 'Задремал на планёрке', effects: { work: -12, mood: -8 } } ],
          result: 'Ты кивал в такт своим мыслям.' },
        { id: 'sick', label: 'Взять день за свой счёт', icon: '🛌', hint: '−2 000 ₽ · +силы',
          cost: { money: 2000, category: 'other' }, effects: { energy: +16, fatigue: -16, work: -6, mood: +4 },
          result: 'Ты проспал двенадцать часов и снова стал человеком.' },
        { id: 'parents', label: 'Уехать к родителям', icon: '🏡', hint: '+семья · +силы',
          effects: { energy: +14, family: +10, mood: +8, fatigue: -12, work: -4 },
          result: 'Тебя кормили три раза в день и не спрашивали про работу. Почти.' }
      ]
    },

    /* Цепочка «кредит»: платить нечем → микрозайм → коллекторы */
    {
      id: 'credit_due', icon: '💳', rarity: 'uncommon', weight: 8, minDay: 10, cooldown: 15,
      chain: 'credit', title: 'Платёж по кредиту, а денег нет',
      text: 'До списания два дня. На карте — сумма, которой хватит на гречку.',
      require: { credit: true, moneyBelow: 9000 },
      choices: [
        { id: 'find', label: 'Найти и заплатить', icon: '🧮', hint: '−6 200 ₽ · спокойно',
          cost: { money: 6200, category: 'credit' }, requires: { money: 6200 },
          effects: { creditPay: 6200, mood: -6, work: +2 },
          result: 'Ты закрыл месяц и выдохнул.' },
        { id: 'micro', label: 'Взять микрозайм', icon: '🕳', hint: '+15 000 ₽ · долг растёт',
          effects: { money: +15000, creditAdd: 22000, debts: +1, mood: -8, risk: +8 },
          next: { id: 'credit_collector', in: 8 },
          result: 'Деньги пришли за четыре минуты. Так это и работает.' },
        { id: 'family', label: 'Попросить у семьи', icon: '🙏', hint: '+8 000 ₽ · −семья',
          effects: { money: +8000, family: -14, mood: -8, social: -4 },
          result: 'Тебе дали и ничего не сказали. Хуже всего — ничего не сказали.' }
      ]
    },
    {
      id: 'credit_collector', icon: '📞', rarity: 'uncommon', weight: 1, queued: true, chain: 'credit',
      title: 'Звонят из банка. Опять.',
      text: 'Вежливый голос по скрипту объясняет, что ты «вошёл в график просрочки».',
      choices: [
        { id: 'part', label: 'Заплатить часть', icon: '🏧', hint: '−10 000 ₽ · тишина на неделю',
          cost: { money: 10000, category: 'credit' }, requires: { money: 10000 },
          effects: { creditPay: 10000, mood: -10 },
          result: 'Они приняли частичный платёж и пообещали «держать в курсе».' },
        { id: 'script', label: 'Говорить по скрипту', icon: '🤖', hint: '−нервы · риск',
          effects: { mood: -10, energy: -8 },
          risk: [ { chance: 0.4, text: 'Позвонили на работу', effects: { work: -15, mood: -10 } } ],
          result: 'Двадцать минут вежливости и взаимного «хорошего дня».' },
        { id: 'more', label: 'Взять ещё', icon: '🎰', hint: '+30 000 ₽ · долг больше',
          effects: { money: +30000, creditAdd: 38000, debts: +1, mood: -6, risk: +10 },
          result: 'Ты закрыл старый долг новым. Показалось, что стало легче.' }
      ]
    },

    /* ============================ РЕДКИЕ ================================== */
    {
      id: 'rare_garage_find', icon: '📦', rarity: 'rare', weight: 3, minDay: 12, cooldown: 45, once: true,
      title: 'В гараже нашлась коробка',
      text: 'Под банками с болтами — запчасти, про которые ты забыл три года назад.',
      choices: [
        { id: 'sell', label: 'Продать на Авито', icon: '💸', hint: '+32 000 ₽',
          effects: { money: +32000, mood: +14, exp: 2, savings: +1 },
          result: 'Ушли за два дня. Покупатель ещё и спасибо сказал.' },
        { id: 'use', label: 'Поставить на машину', icon: '🔧', hint: '+состояние',
          effects: { carCondition: +25, mood: +10, exp: 2 },
          requires: { car: true },
          result: 'Машина поехала тише и как будто благодарно.' },
        { id: 'give', label: 'Отдать соседу', icon: '🤝', hint: '+отношения',
          effects: { social: +16, charity: +1, mood: +10, luck: +6 },
          result: 'Сосед теперь всегда пропускает тебя на парковке.' }
      ]
    },
    {
      id: 'rare_taxi_luck', icon: '🍀', rarity: 'rare', weight: 3, minDay: 8, cooldown: 40,
      title: 'Попутчик оказался не тем, кем казался',
      text: 'Ты подвёз мужика с сумками до города. Он всю дорогу молчал.',
      require: { car: true },
      choices: [
        { id: 'talk', label: 'Разговорить', icon: '💬', hint: 'риск · может повезти',
          effects: { energy: -4, luck: +6 },
          risk: [ { chance: 0.4, text: 'Это был директор завода. Тебя позвали на собеседование', effects: { work: +18, money: +15000, exp: 3 } },
                  { chance: 0.6, text: 'Он просто вышел и не попрощался', effects: { mood: -3 } } ],
          result: 'Двадцать минут дороги и один странный разговор.' },
        { id: 'money', label: 'Взять за бензин', icon: '⛽', hint: '+2 000 ₽',
          effects: { money: +2000, mood: +4 },
          result: 'Он дал две тысячи и не стал считать сдачу.' },
        { id: 'free', label: 'Довезти бесплатно', icon: '❤️', hint: '+удача',
          effects: { luck: +8, mood: +8, charity: +1 },
          result: 'Иногда просто хочется сделать нормально.' }
      ]
    },

    /* --------------------------------------------- ЗАГЛУШКА ТИХОГО ДНЯ ---- */
    {
      id: 'quiet_day', icon: '🛋', rarity: 'common', weight: 0, minDay: 1, cooldown: 0,
      title: 'Ничего не случилось',
      text: 'Редкий день без происшествий. Даже подозрительно.',
      tags: ['filler'],
      choices: [
        {
          id: 'rest', label: 'Отдохнуть', icon: '😌', hint: '+силы · +настроение',
          effects: { energy: +12, mood: +6 },
          result: 'Ты просто ничего не делал. Это тоже полезно.'
        },
        {
          id: 'tidy', label: 'Разобрать шкаф', icon: '🧺', hint: '+настроение · −силы',
          effects: { mood: +8, energy: -8, social: +2 },
          result: 'Ты нашёл зарядку, которую искал полгода.'
        }
      ]
    }
  ];

  /* ======================== реестр, условия, розыгрыш ===================== */

  // Здесь лежат базовые события; пакеты контента (js/events-pack-*.js)
  // докладывают свои через Events.add() и попадают в тот же общий список.
  var ALL = EVENTS.slice();
  var BY_ID = {};

  function rebuildIndex() {
    BY_ID = {};
    for (var i = 0; i < ALL.length; i++) BY_ID[ALL[i].id] = ALL[i];
  }

  /* ============================ СХЕМА КОНТЕНТА ===========================
     Единственный источник правды о допустимых ключах. Эту же схему читает
     tools/validate.js, поэтому движок и проверка не могут разъехаться.
     Хочешь расширить язык событий — добавь ключ здесь и обработай его в
     applyEffects (game.js). Менять сам реестр не придётся. */
  var SCHEMA = {
    version: 1,
    effectKeys: ['money', 'health', 'energy', 'mood', 'social', 'family', 'work',
      'fatigue', 'luck', 'risk', 'exp', 'carCondition', 'carGone', 'creditAdd',
      'creditPay', 'flag', 'unflag', 'category', 'gigs', 'breakdowns', 'debts',
      'parties', 'charity', 'repairs', 'savings'],
    reqKeys: (function () {
      var stats = ['health', 'energy', 'mood', 'social', 'family', 'work',
        'fatigue', 'luck', 'risk', 'exp', 'strain'];
      var keys = ['car', 'money', 'moneyBelow', 'credit', 'flag', 'flagNot',
        'carCondAbove', 'carCondBelow', 'counterAbove'];
      for (var i = 0; i < stats.length; i++) keys.push(stats[i] + 'Above', stats[i] + 'Below');
      return keys;
    })(),
    categories: ['food', 'home', 'car', 'fun', 'health', 'other', 'credit'],
    rarities: ['common', 'uncommon', 'rare', 'epic'],
    limits: { title: 48, text: 150, label: 34, hint: 34, choices: 3 }
  };

  /** Проверка события по схеме. errors непустой = событие не загружаем,
      warnings — просто замечания для автора контента. */
  function validateEvent(e, knownIds) {
    var errors = [], warnings = [], key, i, r;
    if (!e || typeof e.id !== 'string' || !e.id) return { errors: ['событие без id'], warnings: [] };

    if (!e.choices || !e.choices.length) errors.push('нет ни одного варианта');
    if (!e.icon) warnings.push('нет иконки');
    if (!e.title) warnings.push('нет заголовка');
    if (e.title && e.title.length > SCHEMA.limits.title) warnings.push('длинный заголовок');
    if (e.text && e.text.length > SCHEMA.limits.text) warnings.push('длинное описание');
    if (e.rarity && SCHEMA.rarities.indexOf(e.rarity) === -1) warnings.push('неизвестная редкость «' + e.rarity + '»');

    if (e.require) {
      for (key in e.require) {
        if (Object.prototype.hasOwnProperty.call(e.require, key) && SCHEMA.reqKeys.indexOf(key) === -1) {
          errors.push('require: неизвестный ключ «' + key + '»');
        }
      }
    }

    var choices = e.choices || [], freeOk = false, seen = {};
    for (i = 0; i < choices.length; i++) {
      var c = choices[i], w = 'вариант ' + (i + 1);
      if (!c.label) errors.push(w + ': нет подписи');
      if (!c.result) warnings.push(w + ': нет текста исхода');
      if (c.id && seen[c.id]) errors.push(w + ': повтор id');
      if (c.id) seen[c.id] = true;

      if (c.cost !== undefined) {
        if (typeof c.cost === 'number') { /* допустимо */ }
        else if (c.cost && typeof c.cost.money === 'number') {
          if (c.cost.category && SCHEMA.categories.indexOf(c.cost.category) === -1) {
            errors.push(w + ': неизвестная категория «' + c.cost.category + '»');
          }
        } else errors.push(w + ': cost должен быть числом или { money, category }');
      }
      if (!c.cost && !c.requires) freeOk = true;

      if (c.effects) {
        for (key in c.effects) {
          if (Object.prototype.hasOwnProperty.call(c.effects, key) && SCHEMA.effectKeys.indexOf(key) === -1) {
            errors.push(w + ': неизвестный эффект «' + key + '»');
          }
        }
      }
      if (c.requires) {
        for (key in c.requires) {
          if (Object.prototype.hasOwnProperty.call(c.requires, key) && SCHEMA.reqKeys.indexOf(key) === -1) {
            errors.push(w + ': неизвестное условие «' + key + '»');
          }
        }
      }

      var risks = c.risk || [];
      for (r = 0; r < risks.length; r++) {
        if (typeof risks[r].chance !== 'number' || risks[r].chance <= 0 || risks[r].chance > 1) {
          errors.push(w + ': chance риска вне диапазона 0..1');
        }
        if (risks[r].effects) {
          for (key in risks[r].effects) {
            if (Object.prototype.hasOwnProperty.call(risks[r].effects, key) && SCHEMA.effectKeys.indexOf(key) === -1) {
              errors.push(w + ': неизвестный эффект в риске «' + key + '»');
            }
          }
        }
      }

      if (c.next && c.next.id && knownIds && !knownIds[c.next.id]) {
        warnings.push(w + ': цепочка ведёт на неизвестное событие «' + c.next.id + '»');
      }
    }

    if (!freeOk) errors.push('нет бесплатного варианта — при нуле денег игрок застрянет');
    return { errors: errors, warnings: warnings };
  }

  /** Регистрация контента из пакетов. Каждое событие прогоняется через схему:
      битое пропускаем с предупреждением в консоли, а не роняем игру. */
  function add(list) {
    if (!list || !list.length) return 0;
    var added = 0;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e || typeof e.id !== 'string' || !e.id) continue;
      if (!e.choices || !e.choices.length) continue;
      if (BY_ID[e.id]) continue;

      var check = validateEvent(e, null);
      if (check.errors.length) {
        if (global.console && console.warn) {
          console.warn('[events] «' + e.id + '» пропущено: ' + check.errors.join('; '));
        }
        continue;
      }

      if (typeof e.weight !== 'number') e.weight = 8;
      if (!e.rarity) e.rarity = 'common';
      if (!e.title) e.title = 'Событие';
      if (typeof e.text !== 'string') e.text = '';
      if (!e.icon) e.icon = '❔';
      ALL.push(e);
      BY_ID[e.id] = e;
      added++;
    }
    return added;
  }

  function hasFlag(state, name) {
    return !!(state.flags && state.flags[name]);
  }

  function counterOf(state, name) {
    return (state.counters && state.counters[name]) || 0;
  }

  function num(v) { return typeof v === 'number' && isFinite(v); }

  /** Единая проверка условий: используется и для появления события (require),
      и для доступности кнопки выбора (requires). */
  function checkReq(r, s) {
    if (!r) return true;

    var hasCar = !!(s.car && s.car.has);

    if (r.car !== undefined && hasCar !== !!r.car) return false;
    if (num(r.money) && s.money < r.money) return false;
    if (num(r.moneyBelow) && s.money >= r.moneyBelow) return false;
    if (r.credit !== undefined && ((s.credit && s.credit.debt > 0) !== !!r.credit)) return false;
    if (r.flag && !hasFlag(s, r.flag)) return false;
    if (r.flagNot && hasFlag(s, r.flagNot)) return false;

    var stats = ['health', 'energy', 'mood', 'social', 'family', 'work', 'fatigue', 'luck', 'risk', 'exp', 'strain'];
    for (var i = 0; i < stats.length; i++) {
      var k = stats[i];
      var above = r[k + 'Above'], below = r[k + 'Below'];
      if (num(above) && (s[k] || 0) <= above) return false;
      if (num(below) && (s[k] || 0) >= below) return false;
    }

    if (num(r.carCondAbove) && (!hasCar || s.car.condition <= r.carCondAbove)) return false;
    if (num(r.carCondBelow) && (!hasCar || s.car.condition >= r.carCondBelow)) return false;

    if (r.counterAbove) {
      for (var c in r.counterAbove) {
        if (Object.prototype.hasOwnProperty.call(r.counterAbove, c) && counterOf(s, c) < r.counterAbove[c]) return false;
      }
    }

    return true;
  }

  /** Подходит ли событие по дню, «одноразовости» и условиям (кулдаун отдельно). */
  function meets(e, s) {
    if (e.minDay && s.day < e.minDay) return false;
    if (e.maxDay && s.day > e.maxDay) return false;
    if (e.once && hasFlag(s, 'done_' + e.id)) return false;
    if (typeof e.requireFn === 'function' && !e.requireFn(s)) return false;
    return checkReq(e.require, s);
  }

  function onCooldown(e, s) {
    if (!e.cooldown) return false;
    var last = s.lastSeen ? s.lastSeen[e.id] : null;
    if (last === null || last === undefined) return false;
    return (s.day - last) < e.cooldown;
  }

  /** Рискованное ли событие: хотя бы у одного варианта есть бросок риска. */
  function eventIsRisky(e) {
    if (!e.choices) return false;
    for (var i = 0; i < e.choices.length; i++) {
      if (e.choices[i].risk && e.choices[i].risk.length) return true;
    }
    return false;
  }

  /** Есть ли у события условие «мне уже плохо» — по нему видно карточки
      про усталость, болезни и безденежье. */
  function eventIsBadState(e) {
    var r = e.require;
    if (!r) return false;
    return r.healthBelow !== undefined || r.energyBelow !== undefined ||
           r.moodBelow !== undefined || r.fatigueAbove !== undefined ||
           r.strainAbove !== undefined || r.moneyBelow !== undefined;
  }

  /**
   * Ситуационные множители веса. ЗАЧЕМ: раньше пул событий вообще не зависел
   * от того, как игрок себя загнал. Теперь:
   *   • износ 5+ → вдвое чаще приходят события «мне плохо» (болезни, усталость,
   *     безденежье) — каскад из проблем становится заметным;
   *   • склонность к риску 55+ → чаще выпадают события с риск-бросками,
   *     то есть стиль игры сам подкидывает игроку то, что он любит.
   */
  function stateMultiplier(e, s) {
    var m = 1;

    if ((s.strain || 0) >= 5 && eventIsBadState(e)) m *= 2;

    if ((s.risk || 0) >= 55 && eventIsRisky(e)) {
      m *= 1 + ((s.risk - 55) / 100);          // до ×1.45 на риске 100
    }

    return m;
  }

  function weightOf(e, s) {
    var w = typeof e.weight === 'number' ? e.weight : 1;
    if (typeof e.weightFn === 'function') w = e.weightFn(s, w);
    if (w > 0) w *= stateMultiplier(e, s);
    return w > 0 ? w : 0;
  }

  var Events = {

    all: ALL,

    add: add,

    /** Схема языка событий и проверка контента — для валидатора и внешних
        конфигов: Events.schema, Events.validate(event, knownIds). */
    schema: SCHEMA,
    validate: validateEvent,

    count: function () { return ALL.length; },

    /** Событие по id: нужно и для восстановления партии, и для цепочек. */
    get: function (id) { return BY_ID[id] || null; },

    meets: meets,
    checkReq: checkReq,

    /** Взвешенный розыгрыш карточки дня.
        События с queued: true в обычный розыгрыш не попадают — они приходят
        только как последствие цепочки (см. drawCard/takeQueued в game.js).
        Если всё подходящее на кулдауне, кулдауны игнорируются. */
    pick: function (s, rnd, forced) {
      var pool = [], total = 0, k, e, w;

      for (k = 0; k < ALL.length; k++) {
        e = ALL[k];
        if (e.weight === 0 || e.queued) continue;
        if (!meets(e, s)) continue;
        if (!forced && onCooldown(e, s)) continue;
        w = weightOf(e, s);
        if (w <= 0) continue;
        pool.push([e, w]); total += w;
      }

      if (!pool.length) {
        for (k = 0; k < ALL.length; k++) {
          e = ALL[k];
          if (e.weight === 0 || e.queued || !meets(e, s)) continue;
          w = weightOf(e, s);
          if (w <= 0) continue;
          pool.push([e, w]); total += w;
        }
      }

      if (!pool.length) return BY_ID.quiet_day || ALL[0];

      var value = rnd() * total;
      for (k = 0; k < pool.length; k++) {
        value -= pool[k][1];
        if (value <= 0) return pool[k][0];
      }
      return pool[pool.length - 1][0];
    }
  };

  rebuildIndex();
  global.Events = Events;

  if (typeof module !== 'undefined' && module.exports) module.exports = Events;

})(typeof window !== 'undefined' ? window : globalThis);
