/* events-pack-2.js — контент-пак: семья, дети, соседи, ремонт, дача. */
(function () {
  'use strict';
  if (typeof Events === 'undefined' || !Events.add) {
    if (typeof console !== 'undefined') console.error('events-pack-2: Events.add не найден');
    return;
  }

  Events.add([

    {
      id: 'f_school_fees', icon: '🎒', rarity: 'common', weight: 9, minDay: 5, cooldown: 14,
      chain: 'school',
      title: 'Сборы в школу',
      text: 'Классная просит сдать на шторы, экскурсию и «что-нибудь для класса».',
      choices: [
        { id: 'a', label: 'Сдать всё и сразу', icon: '💸', hint: '−6 000 ₽ · +семья',
          cost: { money: 6000, category: 'other' },
          effects: { family: +14, mood: -5 },
          next: { id: 'f_school_committee', in: 3 },
          result: 'Тебя записали в родительский комитет. Поздравляем.' },
        { id: 'b', label: 'Сдать половину', icon: '🤝', hint: '−3 000 ₽ · −семья',
          cost: { money: 3000, category: 'other' },
          effects: { family: -6, mood: +2 },
          result: 'Ты сдал «на шторы». Про экскурсию промолчал.' },
        { id: 'c', label: 'Сказать, что денег нет', icon: '🙈', hint: '−семья · −настроение',
          effects: { family: -12, mood: -6 },
          result: 'Ребёнок весь вечер молчал. Это было хуже скандала.' }
      ]
    },
    {
      id: 'f_school_committee', icon: '📋', rarity: 'common', weight: 4, minDay: 1, cooldown: 10,
      queued: true, chain: 'school',
      title: 'Родительский комитет зовёт',
      text: 'Нужно «всего лишь» привезти воду, шарики и постоять на ярмарке.',
      choices: [
        { id: 'a', label: 'Согласиться', icon: '🎈', hint: '−время · +семья',
          effects: { family: +12, energy: -14, work: -4, exp: 1 },
          next: { id: 'f_school_trip', in: 5 },
          result: 'Ты стоял с шариками три часа. Ребёнок был счастлив.' },
        { id: 'b', label: 'Купить шарики и уехать', icon: '🎁', hint: '−1 200 ₽ · +семья',
          cost: { money: 1200, category: 'other' },
          effects: { family: +6, mood: +2 },
          result: 'Дешёвый компромисс, который все приняли.' }
      ]
    },
    {
      id: 'f_school_trip', icon: '🚌', rarity: 'common', weight: 4, minDay: 1, cooldown: 12,
      queued: true, chain: 'school',
      title: 'Поездка классом',
      text: 'Экскурсия в другой город: автобус, музей и немного карманных денег.',
      choices: [
        { id: 'a', label: 'Оплатить поездку', icon: '🎟️', hint: '−4 500 ₽ · +семья',
          cost: { money: 4500, category: 'other' },
          effects: { family: +12, mood: +2 },
          risk: [
            { chance: 0.25, text: 'Автобус сломался, вернулись ночью', effects: { mood: -6 } }
          ],
          result: 'Ребёнок вернулся с магнитом и сотней фотографий.' },
        { id: 'b', label: 'Отказаться', icon: '🚫', hint: '−семья · −настроение',
          effects: { family: -10, mood: -4 },
          result: 'В классе поехали все, кроме вашего. Он это запомнил.' }
      ]
    },
    {
      id: 'f_school_marks', icon: '📓', rarity: 'common', weight: 10, minDay: 3, cooldown: 10,
      title: 'Двойка по математике',
      text: 'Дневник лежит на видном месте. Видимо, чтобы ты точно его увидел.',
      choices: [
        { id: 'a', label: 'Нанять репетитора', icon: '📐', hint: '−6 000 ₽ · +семья',
          cost: { money: 6000, category: 'other' },
          effects: { family: +8, mood: -4, work: -2 },
          risk: [
            { chance: 0.3, text: 'Репетитор сам путает дроби', effects: { mood: -6 } }
          ],
          result: 'Занятия два раза в неделю. Дневник пока молчит.' },
        { id: 'b', label: 'Сесть за учебник самому', icon: '📖', hint: '−силы · +семья',
          effects: { family: +10, energy: -12, exp: 1 },
          result: 'Ты вспомнил дроби. Ребёнок — что папа не всезнайка.' },
        { id: 'c', label: 'Устроить разбор полётов', icon: '😤', hint: '−семья · −настроение',
          effects: { family: -12, mood: -6 },
          result: 'Кричал не он. Дневник спрятали в шкаф.' }
      ]
    },
    {
      id: 'f_school_clubs', icon: '🥋', rarity: 'uncommon', weight: 7, minDay: 6, cooldown: 14,
      title: 'Кружки и секции',
      text: 'Ребёнок хочет сразу на плавание, роботов и «ещё чуть-чуть на барабаны».',
      choices: [
        { id: 'a', label: 'Оплатить два кружка', icon: '🏊', hint: '−5 000 ₽ · +семья',
          cost: { money: 5000, category: 'other' },
          effects: { family: +12, mood: -4, energy: -4 },
          result: 'Возить его теперь нужно в две стороны города.' },
        { id: 'b', label: 'Выбрать один', icon: '🎯', hint: '−2 500 ₽ · +семья',
          cost: { money: 2500, category: 'other' },
          effects: { family: +6, mood: +2 },
          result: 'Выбрали плавание. Барабаны подождут до пенсии.' },
        { id: 'c', label: 'Пусть решает сам', icon: '🤷', hint: '−семья · +настроение',
          effects: { family: -4, mood: +3 },
          result: 'Он выбрал ничего. Зато честно.' }
      ]
    },
    {
      id: 'f_summer_camp', icon: '🏕️', rarity: 'rare', weight: 4, minDay: 10, cooldown: 20,
      once: true,
      title: 'Путёвка в лагерь',
      text: 'Лагерь хороший, но путёвка стоит как ползарплаты. И это без карманных.',
      choices: [
        { id: 'a', label: 'Купить путёвку', icon: '💸', hint: '−18 000 ₽ · +семья',
          cost: { money: 18000, category: 'other' },
          effects: { family: +16, mood: -6 },
          risk: [
            { chance: 0.35, text: 'Звонит и просится домой', effects: { mood: -8, family: -4 } }
          ],
          result: 'Чемодан собран, подушка взята, ты уже скучаешь.' },
        { id: 'b', label: 'Отправить к бабушке', icon: '🥧', hint: '−силы · +семья',
          effects: { family: +6, energy: -8, mood: +2 },
          result: 'Бабушка довольна, ребёнок объелся пирогами.' },
        { id: 'c', label: 'Оставить дома', icon: '🛋️', hint: '−семья · +деньги',
          effects: { family: -8, mood: -4 },
          result: 'Каникулы прошли под мультики и твои уговоры.' }
      ]
    },
    {
      id: 'f_family_budget', icon: '💰', rarity: 'common', weight: 10, minDay: 2, cooldown: 12,
      title: 'Семейный бюджет',
      text: 'Жена составила таблицу расходов. Твоя графа называется «прочее» и растёт.',
      choices: [
        { id: 'a', label: 'Сесть и посчитать вместе', icon: '🧮', hint: '−вечер · +семья',
          effects: { family: +12, mood: -4, work: -2, exp: 1 },
          result: 'Выяснилось, что «прочее» — это в основном шашлык.' },
        { id: 'b', label: 'Отдать карту и не спорить', icon: '💳', hint: '−2 000 ₽ · +семья',
          effects: { money: -2000, family: +6, mood: -2 },
          result: 'Карта принята. Отчётность будет ежемесячной.' },
        { id: 'c', label: 'Сказать, что всё нормально', icon: '😌', hint: '−семья · +покой',
          effects: { family: -10, mood: +3 },
          result: 'Через неделю таблица появилась снова. С процентами.' }
      ]
    },
    {
      id: 'f_wife_dress', icon: '👗', rarity: 'common', weight: 9, minDay: 4, cooldown: 12,
      title: 'Платье на выход',
      text: '«Мне нечего надеть» прозвучало третий раз за вечер. Это уже сигнал.',
      choices: [
        { id: 'a', label: 'Купить платье', icon: '🛍️', hint: '−9 000 ₽ · +семья',
          cost: { money: 9000, category: 'other' },
          effects: { family: +12, mood: -4 },
          result: 'Платье висит в шкафу. Надеть его пока некуда.' },
        { id: 'b', label: 'Похвалить то, что есть', icon: '🙃', hint: '+настроение · +риск',
          effects: { mood: +3 },
          risk: [
            { chance: 0.4, text: 'Аргумент «оно старое» победил', effects: { family: -8 } }
          ],
          result: 'Комплимент прозвучал. Прозвучал он зря.' },
        { id: 'c', label: 'Предложить поехать в гости', icon: '🚗', hint: '−семья · +настроение',
          effects: { family: -5, mood: +3 },
          result: 'Вечер прошёл тихо. Слишком тихо.' }
      ]
    },
    {
      id: 'f_husband_tools', icon: '🔧', rarity: 'common', weight: 8, minDay: 5, cooldown: 14,
      title: 'Инструмент для дома',
      text: 'В хозяйственном магазине выяснилось, что «без этой штуки никак».',
      choices: [
        { id: 'a', label: 'Купить набор', icon: '🧰', hint: '−7 500 ₽ · +быт',
          cost: { money: 7500, category: 'home' },
          effects: { repairs: +1, mood: +6, family: -2 },
          result: 'Набор лежит в кладовке. Уже почти пригодился.' },
        { id: 'b', label: 'Взять у соседа', icon: '🤝', hint: '+социум · +настроение',
          effects: { social: +6, mood: +2 },
          result: 'Сосед дал перфоратор и три совета по ремонту.' },
        { id: 'c', label: 'Обойтись отвёрткой', icon: '🪛', hint: '−силы · +быт',
          effects: { energy: -10, repairs: +1, mood: +2 },
          result: 'Сделал. Криво, но сделал. И сам в это верю.' }
      ]
    },
    {
      id: 'f_mother_in_law', icon: '🍲', rarity: 'common', weight: 9, minDay: 7, cooldown: 16,
      title: 'Тёща приехала с кастрюлей',
      text: 'Борщ, котлеты и подробный отчёт о том, как вы живёте и что едите.',
      choices: [
        { id: 'a', label: 'Есть и хвалить', icon: '😋', hint: '+семья · −здоровье',
          effects: { family: +12, health: -4, mood: +3 },
          result: 'Съел три порции. Кастрюлю оставили на всякий случай.' },
        { id: 'b', label: 'Заказать пиццу', icon: '🍕', hint: '−1 800 ₽ · −семья',
          cost: { money: 1800, category: 'food' },
          effects: { family: -6, mood: +4 },
          result: 'Пиццу ели все. Обиделась только кастрюля.' },
        { id: 'c', label: 'Отвезти кастрюлю обратно', icon: '🚙', hint: '−семья · −социум',
          effects: { family: -10, social: -4 },
          result: 'Кастрюля вернулась. Разговор — тоже, но позже.' }
      ]
    },
    {
      id: 'f_mother_in_law_advice', icon: '🧐', rarity: 'uncommon', weight: 7, minDay: 9, cooldown: 18,
      title: 'Свекровь знает лучше',
      text: '«В наше время так не делали» — сказано про ремонт, работу и воспитание.',
      choices: [
        { id: 'a', label: 'Кивать и делать по-своему', icon: '🙂', hint: '−нервы · +опыт',
          effects: { mood: -3, family: +4, exp: 1 },
          result: 'Кивал так убедительно, что почти поверил сам.' },
        { id: 'b', label: 'Согласиться во всём', icon: '🤐', hint: '+семья · −настроение',
          effects: { family: +8, mood: -6, work: -2 },
          result: 'Обои выбрала она. Ты выбрал молчать.' },
        { id: 'c', label: 'Поспорить', icon: '🗣️', hint: '−семья · −настроение',
          effects: { family: -12, mood: -3 },
          result: 'Спор длился два часа. Победила тишина за ужином.' }
      ]
    },
    {
      id: 'f_relative_loan', icon: '🤲', rarity: 'common', weight: 9, minDay: 8, cooldown: 20,
      chain: 'relative',
      title: 'Родственник просит в долг',
      text: 'Брат клянётся вернуть с первой зарплаты. Говорил он так и в прошлом году.',
      choices: [
        { id: 'a', label: 'Дать 15 000', icon: '💸', hint: '−15 000 ₽ · +семья',
          cost: { money: 15000, category: 'other' },
          effects: { family: +10, mood: -6, debts: +1 },
          next: { id: 'f_relative_return', in: 7 },
          risk: [
            { chance: 0.45, text: 'Про зарплату он забыл', effects: { mood: -12, family: -8 } }
          ],
          result: 'Деньги ушли. Осталась надежда и одна расписка.' },
        { id: 'b', label: 'Дать 5 000', icon: '🤏', hint: '−5 000 ₽ · +семья',
          cost: { money: 5000, category: 'other' },
          effects: { family: +5, mood: -2, debts: +1 },
          next: { id: 'f_relative_return', in: 10 },
          result: 'Сумму назвал «подъёмной». Он кивнул без энтузиазма.' },
        { id: 'c', label: 'Отказать', icon: '🚪', hint: '−семья · +деньги',
          effects: { family: -10, mood: +3 },
          result: 'Он назвал тебя жадным. Но телефон больше не звонил.' }
      ]
    },
    {
      id: 'f_relative_return', icon: '🎉', rarity: 'uncommon', weight: 5, minDay: 1, cooldown: 12,
      queued: true, chain: 'relative',
      title: 'Долг вернули',
      text: 'Брат приехал с конвертом и тортом. Торт, видимо, вместо процентов.',
      choices: [
        { id: 'a', label: 'Взять всё', icon: '💵', hint: '+5 000 ₽ · +семья',
          effects: { money: +5000, family: +8, mood: +6, debts: -1 },
          result: 'Конверт был тонкий. Торт — тяжёлый. Считай, сошлись.' },
        { id: 'b', label: 'Простить долг', icon: '🕊️', hint: '+семья · −деньги',
          effects: { family: +14, mood: -4, charity: +1 },
          result: 'Он обнял тебя у подъезда. Долг остался в прошлом.' },
        { id: 'c', label: 'Взять половину', icon: '⚖️', hint: '+2 500 ₽ · +семья',
          effects: { money: +2500, family: +6, mood: +2 },
          result: 'Половина — тоже деньги. И повод не ссориться.' }
      ]
    },
    {
      id: 'f_birthday_party', icon: '🎂', rarity: 'common', weight: 10, minDay: 6, cooldown: 18,
      title: 'День рождения тёщи',
      text: 'Нужен подарок, цветы и тост, который не обидит никого из родни.',
      choices: [
        { id: 'a', label: 'Конверт с деньгами', icon: '✉️', hint: '−8 000 ₽ · +семья',
          cost: { money: 8000, category: 'other' },
          effects: { family: +12, mood: -4 },
          result: 'Конверт приняли. Сумму обсудили позже, без тебя.' },
        { id: 'b', label: 'Торт и цветы', icon: '💐', hint: '−3 500 ₽ · +семья',
          cost: { money: 3500, category: 'food' },
          effects: { family: +8, mood: +2 },
          result: 'Торт был красивый. Съели его за десять минут.' },
        { id: 'c', label: 'Поздравить по телефону', icon: '📞', hint: '−семья · +покой',
          effects: { family: -10, mood: +2 },
          result: 'Поздравил искренне. Трубку положили тоже искренне.' }
      ]
    },
    {
      id: 'f_kids_party', icon: '🎈', rarity: 'rare', weight: 4, minDay: 12, cooldown: 20,
      title: 'Детский праздник',
      text: 'Двенадцать детей, аниматор и квартира, которую потом придётся отмывать.',
      choices: [
        { id: 'a', label: 'Аниматор и торт', icon: '🤡', hint: '−12 000 ₽ · +семья',
          cost: { money: 12000, category: 'fun' },
          effects: { family: +14, mood: +4, energy: -10 },
          result: 'Дети были в восторге. Соседи — не очень.' },
        { id: 'b', label: 'Своими силами', icon: '🎨', hint: '−2 500 ₽ · −силы',
          cost: { money: 2500, category: 'fun' },
          effects: { family: +8, energy: -16, mood: +2 },
          result: 'Ты был и аниматором, и уборщицей, и уставшим папой.' },
        { id: 'c', label: 'Отметить в парке', icon: '🌳', hint: '−силы · +семья',
          effects: { family: +6, energy: -12, mood: +4 },
          result: 'Погода помогла. Убрали за собой почти всё.' }
      ]
    },
    {
      id: 'f_neighbor_drill', icon: '🔨', rarity: 'common', weight: 10, minDay: 3, cooldown: 12,
      chain: 'neighbor',
      title: 'Сосед взял перфоратор',
      text: 'Стена дрожит с восьми утра. Сосед сверлит «по чуть-чуть, ещё недельку».',
      choices: [
        { id: 'a', label: 'Пойти поговорить', icon: '🚪', hint: '+социум · +риск',
          effects: { social: +6, mood: +2 },
          next: { id: 'f_neighbor_flood', in: 4 },
          risk: [
            { chance: 0.3, text: 'Разговор перешёл в спор о стенах', effects: { social: -8, mood: -6 } }
          ],
          result: 'Поговорили по-человечески. Пока по-человечески.' },
        { id: 'b', label: 'Купить беруши', icon: '🎧', hint: '−600 ₽ · +покой',
          cost: { money: 600, category: 'other' },
          effects: { mood: +3, energy: -2 },
          result: 'Беруши спасли. Стена всё ещё дрожит, но уже молча.' },
        { id: 'c', label: 'Начать сверлить самому', icon: '🛠️', hint: '+быт · −социум',
          effects: { repairs: +1, mood: +4, social: -6 },
          result: 'Сверлили в два перфоратора. Получилась симфония.' }
      ]
    },
    {
      id: 'f_neighbor_flood', icon: '💧', rarity: 'uncommon', weight: 5, minDay: 1, cooldown: 14,
      queued: true, chain: 'neighbor',
      title: 'Сосед затопил',
      text: 'Потолок в коридоре стал картой мира. Сосед сверху уверяет, что это не мы.',
      choices: [
        { id: 'a', label: 'Аварийка и акт', icon: '📄', hint: '+бумаги · −нервы',
          effects: { repairs: +1, mood: -6, social: -4, exp: 1 },
          risk: [
            { chance: 0.35, text: 'Ремонт повесили на тебя', effects: { money: -12000, mood: -6 } }
          ],
          result: 'Акт составлен, подписи собраны, сосед притих.' },
        { id: 'b', label: 'Договориться по-хорошему', icon: '🤝', hint: '+социум · +настроение',
          effects: { social: +6, mood: +2 },
          result: 'Сосед сам принёс краску. Синеватую, но зато свою.' },
        { id: 'c', label: 'Махнуть рукой', icon: '🫠', hint: '−здоровье · −настроение',
          effects: { health: -6, mood: -4, repairs: +1 },
          result: 'Пятно подсохло и стало напоминать профиль соседа.' }
      ]
    },
    {
      id: 'f_neighbor_parking', icon: '🚗', rarity: 'common', weight: 9, minDay: 6, cooldown: 14,
      title: 'Чужое место у подъезда',
      text: 'Место, которое ты чистил лопатой три зимы, заняла белая машина нового жильца.',
      choices: [
        { id: 'a', label: 'Поговорить спокойно', icon: '🙂', hint: '+социум · +риск',
          effects: { social: +6, mood: +2 },
          risk: [
            { chance: 0.35, text: 'Спокойно не получилось', effects: { social: -8, mood: -8, health: -3 } }
          ],
          result: 'Объяснил про лопату и зимы. Он кивнул и уехал.' },
        { id: 'b', label: 'Встать вплотную', icon: '🚙', hint: '−машина · −социум',
          effects: { carCondition: -6, mood: +4, social: -6 },
          result: 'Он выехал со второго раза. Ты — с чувством победы.' },
        { id: 'c', label: 'Парковаться дальше', icon: '🚶', hint: '−силы · −машина',
          effects: { energy: -8, carCondition: -3, mood: -4 },
          result: 'До подъезда теперь семь минут. Зато нервы целы.' }
      ]
    },
    {
      id: 'f_neighbor_common', icon: '🧹', rarity: 'uncommon', weight: 7, minDay: 9, cooldown: 16,
      title: 'Общий тамбур',
      text: 'Соседи предлагают скинуться на красоту: плитку, доводчик и диванчик.',
      choices: [
        { id: 'a', label: 'Сдать 7 000', icon: '🧱', hint: '−7 000 ₽ · +социум',
          cost: { money: 7000, category: 'home' },
          effects: { social: +8, mood: +2 },
          result: 'Тамбур стал как в отеле. Ключи, правда, всё те же.' },
        { id: 'b', label: 'Сдать 2 000', icon: '🪙', hint: '−2 000 ₽ · +социум',
          cost: { money: 2000, category: 'home' },
          effects: { social: +3, mood: +2 },
          risk: [
            { chance: 0.3, text: 'Список сдавших читали всем подъездом', effects: { social: -6 } }
          ],
          result: 'Сдал сколько мог. Внутри осталось неприятное чувство.' },
        { id: 'c', label: 'Отказаться', icon: '🙅', hint: '−социум · +деньги',
          effects: { social: -8, mood: +2 },
          result: 'Плитку положили. Твою долю обсудили на лавочке.' }
      ]
    },
    {
      id: 'f_repair_leak', icon: '🚿', rarity: 'common', weight: 9, minDay: 4, cooldown: 14,
      chain: 'repair',
      title: 'Кран капает третий месяц',
      text: 'Счётчик тикает, как метроном. «Потом починим» стало семейной традицией.',
      choices: [
        { id: 'a', label: 'Вызвать мастера', icon: '🧑‍🔧', hint: '−6 500 ₽ · +быт',
          cost: { money: 6500, category: 'home' },
          effects: { repairs: +1, mood: +4 },
          next: { id: 'f_repair_walls', in: 4 },
          risk: [
            { chance: 0.3, text: 'Мастер нашёл ещё кое-что', effects: { money: -9000, mood: -6 } }
          ],
          result: 'Кран молчит. Зато мастер заговорил о трубах.' },
        { id: 'b', label: 'Починить самому', icon: '🔩', hint: '−силы · +быт',
          effects: { energy: -12, repairs: +1, mood: +2 },
          next: { id: 'f_repair_walls', in: 6 },
          risk: [
            { chance: 0.4, text: 'Прокладка не выдержала', effects: { money: -8000, mood: -10, social: -6 } }
          ],
          result: 'Пять минут работы, два похода в магазин.' },
        { id: 'c', label: 'Подставить тазик', icon: '🥣', hint: '−1 500 ₽ · −настроение',
          cost: { money: 1500, category: 'home' },
          effects: { mood: -3, repairs: +1 },
          result: 'Тазик стоит. Кран капает. Договорились.' }
      ]
    },
    {
      id: 'f_repair_walls', icon: '🎨', rarity: 'uncommon', weight: 5, minDay: 1, cooldown: 14,
      queued: true, chain: 'repair',
      title: 'Обои поехали',
      text: 'Под мокрым пятном обои отошли и висят, как занавес перед вторым актом.',
      choices: [
        { id: 'a', label: 'Переклеить комнату', icon: '🖌️', hint: '−14 000 ₽ · +быт',
          cost: { money: 14000, category: 'home' },
          effects: { repairs: +1, mood: +5, energy: -10 },
          result: 'Комната стала светлее. Обои выбрала жена, ты — клей.' },
        { id: 'b', label: 'Заклеить пятно', icon: '🩹', hint: '−2 000 ₽ · +быт',
          cost: { money: 2000, category: 'home' },
          effects: { repairs: +1, mood: +1 },
          next: { id: 'f_repair_ceiling', in: 3 },
          result: 'Пятна нет. Есть небольшой холм обоев.' },
        { id: 'c', label: 'Повесить картину', icon: '🖼️', hint: '+быт · +риск',
          effects: { repairs: +1, mood: +3 },
          risk: [
            { chance: 0.3, text: 'Картина упала ночью', effects: { mood: -6 } }
          ],
          result: 'Пятно закрыто искусством. Пока держится.' }
      ]
    },
    {
      id: 'f_repair_ceiling', icon: '⬜', rarity: 'uncommon', weight: 5, minDay: 1, cooldown: 14,
      queued: true, chain: 'repair',
      title: 'Натяжной потолок',
      text: 'Мастер обещает сделать за один день. Ты уже знаешь, что это значит.',
      choices: [
        { id: 'a', label: 'Сделать во всей квартире', icon: '🏠', hint: '−28 000 ₽ · +быт',
          cost: { money: 28000, category: 'home' },
          effects: { repairs: +2, mood: +6, family: +4 },
          result: 'Потолки ровные, как в журнале. Пыль — тоже везде.' },
        { id: 'b', label: 'Только в коридоре', icon: '🚪', hint: '−12 000 ₽ · +быт',
          cost: { money: 12000, category: 'home' },
          effects: { repairs: +1, mood: +3 },
          result: 'Коридор стал парадным. Остальное подождёт.' },
        { id: 'c', label: 'Оставить как есть', icon: '🫥', hint: '−настроение · +быт',
          effects: { repairs: +1, mood: -4 },
          result: 'Пятно объявили дизайнерским решением.' }
      ]
    },
    {
      id: 'f_repair_later', icon: '🛠️', rarity: 'common', weight: 10, minDay: 3, cooldown: 12,
      title: 'Потом починим',
      text: 'Дверца шкафа держится на честном слове и одном саморезе. Уже год.',
      choices: [
        { id: 'a', label: 'Починить сейчас', icon: '🧰', hint: '−силы · +быт',
          effects: { energy: -10, repairs: +1, mood: +4, family: +4 },
          result: 'Дверца закрывается. Ты чувствуешь себя инженером.' },
        { id: 'b', label: 'Прикрутить на скотч', icon: '🩶', hint: '−300 ₽ · +риск',
          cost: { money: 300, category: 'home' },
          effects: { repairs: +1, mood: +1 },
          risk: [
            { chance: 0.4, text: 'Отвалилось ночью с грохотом', effects: { mood: -6, family: -3 } }
          ],
          result: 'Держится. Держится подозрительно.' },
        { id: 'c', label: 'Оставить до выходных', icon: '📅', hint: '−семья · −настроение',
          effects: { family: -4, mood: -2 },
          result: 'Выходные прошли. Дверца на месте. Пока висит.' }
      ]
    },
    {
      id: 'f_furniture_buy', icon: '🛋️', rarity: 'uncommon', weight: 6, minDay: 8, cooldown: 20,
      title: 'Диван, который на годы',
      text: 'В магазине три дивана одинаковые, но один — с премиум-пружинами.',
      choices: [
        { id: 'a', label: 'Купить премиум', icon: '💎', hint: '−30 000 ₽ · +семья',
          cost: { money: 30000, category: 'home' },
          effects: { family: +12, mood: +6 },
          risk: [
            { chance: 0.3, text: 'Не влез в дверной проём', effects: { money: -3000, mood: -8 } }
          ],
          result: 'Диван в комнате. Дверной проём пришлось простить.' },
        { id: 'b', label: 'Купить обычный', icon: '🛒', hint: '−22 000 ₽ · +семья',
          cost: { money: 22000, category: 'home' },
          effects: { family: +8, mood: +3 },
          result: 'Диван мягкий. Пружины обычные, зато свои.' },
        { id: 'c', label: 'Отложить покупку', icon: '⏳', hint: '−семья · −настроение',
          effects: { family: -8, mood: -4 },
          result: 'Старый диван скрипит, но держится. Как и вы.' }
      ]
    },
    {
      id: 'f_appliance_broken', icon: '🧺', rarity: 'common', weight: 9, minDay: 5, cooldown: 14,
      title: 'Стиральная машина сдалась',
      text: 'На последнем отжиме она издала звук, который не забудешь. И замолчала.',
      choices: [
        { id: 'a', label: 'Купить новую', icon: '🛍️', hint: '−29 000 ₽ · +быт',
          cost: { money: 29000, category: 'home' },
          effects: { mood: +6, family: +6, repairs: +1 },
          risk: [
            { chance: 0.25, text: 'Привезли с браком', effects: { mood: -8, money: -2000 } }
          ],
          result: 'Новая машина тихая. Ты слушаешь её отжим как музыку.' },
        { id: 'b', label: 'Вызвать мастера', icon: '🧑‍🔧', hint: '−7 000 ₽ · +быт',
          cost: { money: 7000, category: 'home' },
          effects: { repairs: +1, mood: +2 },
          risk: [
            { chance: 0.35, text: 'Ремонт не помог', effects: { mood: -8 } }
          ],
          result: 'Мастер пообещал ещё пару лет. Барабан гудит уверенно.' },
        { id: 'c', label: 'Стирать руками', icon: '🫧', hint: '−силы · −семья',
          effects: { energy: -16, mood: -6, family: -6 },
          result: 'Носки чистые. Спина — нет. Все всё поняли.' }
      ]
    },
    {
      id: 'f_dacha_potato', icon: '🥔', rarity: 'common', weight: 10, minDay: 5, cooldown: 10,
      chain: 'dacha',
      title: 'Картошка на даче',
      text: 'Шесть соток, три мешка семян и большая вера в урожай.',
      choices: [
        { id: 'a', label: 'Посадить всё', icon: '🌱', hint: '−силы · +урожай',
          effects: { energy: -18, health: -4, mood: +4 },
          next: { id: 'f_dacha_harvest', in: 12 },
          result: 'Посадил. Спина сказала спасибо только к среде.' },
        { id: 'b', label: 'Посадить половину', icon: '🪴', hint: '−900 ₽ · +урожай',
          cost: { money: 900, category: 'food' },
          effects: { energy: -10, mood: +3 },
          next: { id: 'f_dacha_harvest', in: 14 },
          result: 'Половина грядок — половина мозолей.' },
        { id: 'c', label: 'Нанять соседа', icon: '👨‍🌾', hint: '−6 000 ₽ · +урожай',
          cost: { money: 6000, category: 'other' },
          effects: { energy: -4, mood: +4, social: +4 },
          next: { id: 'f_dacha_harvest', in: 12 },
          result: 'Сосед посадил ровно. И взял семенами сверху.' }
      ]
    },
    {
      id: 'f_dacha_greenhouse', icon: '🍅', rarity: 'uncommon', weight: 7, minDay: 8, cooldown: 16,
      title: 'Теплица сложилась',
      text: 'Старая теплица не пережила снег. Огурцы смотрят на это с укором.',
      choices: [
        { id: 'a', label: 'Купить новую', icon: '🏗️', hint: '−21 000 ₽ · +быт',
          cost: { money: 21000, category: 'home' },
          effects: { mood: +6, family: +4, repairs: +1 },
          risk: [
            { chance: 0.3, text: 'Сборка заняла три выходных', effects: { energy: -14, mood: -6 } }
          ],
          result: 'Теплица стоит. Инструкция так и осталась загадкой.' },
        { id: 'b', label: 'Собрать из того, что было', icon: '🪚', hint: '−силы · +риск',
          effects: { energy: -14, mood: +2, repairs: +1 },
          risk: [
            { chance: 0.35, text: 'Ветер сложил её снова', effects: { mood: -8, money: -4000 } }
          ],
          result: 'Получилось криво, но своё. Огурцы довольны.' },
        { id: 'c', label: 'Отказаться от огурцов', icon: '🥒', hint: '−семья · +покой',
          effects: { family: -6, mood: +2 },
          result: 'Огурцы теперь покупаете. Вкус, говорят, другой.' }
      ]
    },
    {
      id: 'f_dacha_harvest', icon: '🥒', rarity: 'uncommon', weight: 5, minDay: 1, cooldown: 12,
      queued: true, chain: 'dacha',
      title: 'Урожай победил',
      text: 'Кабачков столько, что соседи прячутся, когда ты идёшь с сумкой.',
      choices: [
        { id: 'a', label: 'Закатать банки', icon: '🫙', hint: '−силы · +семья',
          effects: { energy: -16, family: +8, mood: +4 },
          result: 'Двадцать банок. Кладовка пахнет летом и укропом.' },
        { id: 'b', label: 'Продать излишки', icon: '🏪', hint: '+6 000 ₽ · −силы',
          effects: { money: +6000, energy: -10, mood: +4 },
          risk: [
            { chance: 0.3, text: 'Покупателей не нашлось', effects: { mood: -4 } }
          ],
          result: 'Часть урожая ушла в руки, часть — в компост.' },
        { id: 'c', label: 'Раздать всем', icon: '🎁', hint: '+социум · +семья',
          effects: { social: +8, family: +4, charity: +1 },
          next: { id: 'f_dacha_sell', in: 10 },
          result: 'Тебя теперь любит весь дачный кооператив. И ждёт осенью.' }
      ]
    },
    {
      id: 'f_dacha_sell', icon: '💸', rarity: 'rare', weight: 3, minDay: 1, cooldown: 30,
      queued: true, once: true, chain: 'dacha',
      title: 'Продать дачу',
      text: 'Покупатель нашёлся сам: сосед по участку давно смотрит на твой забор.',
      choices: [
        { id: 'a', label: 'Продать', icon: '🤝', hint: '+120 000 ₽ · +риск',
          effects: { money: +120000, mood: +6, family: -6 },
          risk: [
            { chance: 0.35, text: 'Документы, пошлины, очередь', effects: { money: -15000, mood: -8 } }
          ],
          result: 'Деньги пришли. Дача осталась в фотографиях и банках.' },
        { id: 'b', label: 'Оставить детям', icon: '👨‍👩‍👦', hint: '+семья · −деньги',
          effects: { family: +12, mood: +4 },
          result: 'Дети сказали спасибо. Ты не поверил, но было приятно.' },
        { id: 'c', label: 'Сдать на лето', icon: '🏡', hint: '+25 000 ₽ · +быт',
          effects: { money: +25000, mood: +4, repairs: +1 },
          result: 'Дачники приехали. Теплица снова при деле.' }
      ]
    },
    {
      id: 'f_parents_visit', icon: '🚂', rarity: 'common', weight: 8, minDay: 7, cooldown: 18,
      title: 'Поездка к родителям',
      text: 'Триста километров, банки с вареньем и вопросы про второго ребёнка.',
      choices: [
        { id: 'a', label: 'Поехать на машине', icon: '🚗', hint: '−4 500 ₽ · −машина',
          cost: { money: 4500, category: 'car' },
          effects: { family: +12, energy: -12, carCondition: -4 },
          result: 'Дорога туда — пять часов. Обратно — шесть и варенье.' },
        { id: 'b', label: 'Поехать поездом', icon: '🚆', hint: '−3 000 ₽ · +семья',
          cost: { money: 3000, category: 'other' },
          effects: { family: +10, energy: -8, mood: +2 },
          result: 'В поезде хорошо думается. Особенно о своём.' },
        { id: 'c', label: 'Отложить до отпуска', icon: '📵', hint: '−семья · +покой',
          effects: { family: -10, mood: +2 },
          result: 'Мама сказала, что всё понимает. Это было хуже упрёка.' }
      ]
    },
    {
      id: 'f_pet_cat', icon: '🐈', rarity: 'uncommon', weight: 7, minDay: 6, cooldown: 30,
      once: true,
      title: 'Кот на пороге',
      text: 'Ребёнок принёс котёнка и смотрит глазами, против которых нет аргументов.',
      choices: [
        { id: 'a', label: 'Оставить', icon: '❤️', hint: '+семья · +риск',
          effects: { family: +14, mood: +8, health: -2 },
          risk: [
            { chance: 0.35, text: 'Диван ободран, тапки съедены', effects: { money: -6000, mood: -4 } }
          ],
          result: 'Кот выбрал твоё кресло. Ты выбрал смириться.' },
        { id: 'b', label: 'Отнести к бабушке', icon: '👵', hint: '−семья · +покой',
          effects: { family: -8, mood: -2 },
          result: 'У бабушки кот стал главным. Внук обиделся на неделю.' },
        { id: 'c', label: 'Отдать в добрые руки', icon: '📦', hint: '−семья · +доброта',
          effects: { family: -10, mood: -4, charity: +1 },
          result: 'Котёнка забрали хорошие люди. Ребёнок молчал весь вечер.' }
      ]
    },
    {
      id: 'f_wife_pregnant', icon: '🤰', rarity: 'rare', weight: 4, minDay: 20, cooldown: 30,
      once: true, chain: 'baby',
      title: 'Две полоски',
      text: 'Тест лежит на столе. Жена молчит и улыбается. Ты ещё не знаешь, что дальше.',
      choices: [
        { id: 'a', label: 'Обнять и обрадоваться', icon: '🤗', hint: '+семья · +риск',
          effects: { family: +18, mood: +10 },
          next: { id: 'f_baby_born', in: 20 },
          risk: [
            { chance: 0.3, text: 'Внеплановые врачи и анализы', effects: { money: -12000, mood: -4 } }
          ],
          result: 'Вы просидели на кухне до утра, строя планы.' },
        { id: 'b', label: 'Сесть и посчитать деньги', icon: '🧾', hint: '+работа · −настроение',
          effects: { work: +4, mood: -6 },
          next: { id: 'f_baby_born', in: 20 },
          result: 'Таблица сошлась. Нервы — не совсем.' },
        { id: 'c', label: 'Сначала испугаться', icon: '😰', hint: '−настроение · +семья',
          effects: { mood: -8, family: +4 },
          next: { id: 'f_baby_born', in: 20 },
          result: 'Испугался, потом обрадовался. Порядок чувств не важен.' }
      ]
    },
    {
      id: 'f_baby_born', icon: '👶', rarity: 'epic', weight: 4, minDay: 1, cooldown: 30,
      queued: true, once: true, chain: 'baby',
      title: 'Родился ребёнок',
      text: 'Ты держишь пять килограммов счастья и не понимаешь, почему трясутся руки.',
      choices: [
        { id: 'a', label: 'Взять отпуск и быть рядом', icon: '🏡', hint: '−работа · +семья',
          effects: { family: +20, work: -12, energy: -14, mood: +14, exp: 2 },
          result: 'Первая неделя прошла без сна, но с абсолютным счастьем.' },
        { id: 'b', label: 'Работать больше', icon: '💼', hint: '+деньги · −семья',
          effects: { money: +8000, family: -10, fatigue: +10 },
          result: 'Деньги нужны. Но сын растёт и без твоей смены.' },
        { id: 'c', label: 'Нанять помощницу', icon: '🧑‍🍼', hint: '−30 000 ₽ · +семья',
          cost: { money: 30000, category: 'other' },
          effects: { family: +12, mood: +6, energy: -4 },
          result: 'Дома стало спокойнее. Кошелёк стал тише.' }
      ]
    },
    {
      id: 'f_move_flat', icon: '📦', rarity: 'rare', weight: 4, minDay: 25, cooldown: 30,
      once: true, chain: 'move',
      title: 'Предложение переехать',
      text: 'Квартира больше, район лучше, ипотека — тоже больше. Классика жанра.',
      choices: [
        { id: 'a', label: 'Согласиться', icon: '🔑', hint: '+квартира · +долг',
          effects: { family: +14, mood: +8, creditAdd: 900000 },
          next: { id: 'f_move_boxes', in: 10 },
          risk: [
            { chance: 0.3, text: 'Банк поднял ставку', effects: { money: -10000, mood: -8 } }
          ],
          result: 'Ключи получены. Коробки ещё даже не куплены.' },
        { id: 'b', label: 'Отказаться и сделать ремонт', icon: '🎨', hint: '−20 000 ₽ · +быт',
          cost: { money: 20000, category: 'home' },
          effects: { family: +4, mood: -4, repairs: +1 },
          result: 'Остались. Зато теперь знаете каждый угол своей кухни.' },
        { id: 'c', label: 'Подумать месяц', icon: '🤔', hint: '−настроение · +работа',
          effects: { mood: -2, work: +2 },
          result: 'Месяц прошёл. Квартиру забрали другие. Ну и ладно.' }
      ]
    },
    {
      id: 'f_move_boxes', icon: '🏠', rarity: 'common', weight: 4, minDay: 1, cooldown: 30,
      queued: true, once: true, chain: 'move',
      title: 'Тридцать коробок',
      text: 'Тридцать коробок, из которых подписана одна. Угадай, какая именно.',
      choices: [
        { id: 'a', label: 'Нанять грузчиков', icon: '💪', hint: '−18 000 ₽ · −силы',
          cost: { money: 18000, category: 'other' },
          effects: { energy: -4, mood: +4, family: +6 },
          result: 'Грузчики работали быстро. Ты — командовал. Почти.' },
        { id: 'b', label: 'Перевозить самим', icon: '🚚', hint: '−силы · −здоровье',
          effects: { energy: -20, health: -6, family: +4 },
          result: 'Коробки переехали. Спина осталась на старом адресе.' },
        { id: 'c', label: 'Часть выбросить', icon: '🗑️', hint: '−семья · +покой',
          effects: { mood: +4, family: -4, charity: +1 },
          result: 'Выбросили лыжи и три пакета нужного. Стало легче.' }
      ]
    }

  ]);
})();
