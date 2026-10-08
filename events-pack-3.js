/* events-pack-3.js — контент-пак: магазин, доставка, скидки, машина, здоровье, отпуск. */
(function () {
  'use strict';
  if (typeof Events === 'undefined' || !Events.add) {
    if (typeof console !== 'undefined') console.error('events-pack-3: Events.add не найден');
    return;
  }

  Events.add([

    {
      id: 'h_big_sale', icon: '🏷', rarity: 'common', weight: 10, minDay: 4, cooldown: 12,
      chain: 'sale',
      title: 'Скидка 60% на всё',
      text: 'Магазин закрывается на реконструкцию и сбрасывает цены. Логика отключена.',
      choices: [
        { id: 'a', label: 'Набрать полную тележку', icon: '🛒', hint: '−9 000 ₽ · +настроение',
          cost: { money: 9000, category: 'fun' },
          effects: { mood: +16, fatigue: +6 },
          risk: [{ chance: 0.35, text: 'Половина не влезла в холодильник', effects: { mood: -10, money: -2000, category: 'fun' } }],
          next: { id: 'h_sale_aftermath', in: 2 },
          result: 'Ты еле донёс пакеты до подъезда.' },
        { id: 'b', label: 'Взять только нужное', icon: '🛍', hint: '−2 500 ₽ · спокойно',
          cost: { money: 2500, category: 'food' },
          effects: { mood: +6, exp: 1 },
          result: 'Ты вышел с одним пакетом и чувством превосходства.' },
        { id: 'c', label: 'Пройти мимо', icon: '🚶', hint: 'сэкономить · −настроение',
          effects: { mood: -5 },
          result: 'Ты шёл мимо и повторял, что тебе ничего не нужно.' }
      ]
    },
    {
      id: 'h_sale_aftermath', icon: '🧊', rarity: 'common', weight: 1, minDay: 1, cooldown: 20,
      queued: true, chain: 'sale',
      title: 'Тележка купленного смотрит на тебя',
      text: 'Холодильник забит, половина — то, что ты не ешь.',
      choices: [
        { id: 'a', label: 'Раздать соседям', icon: '🤝', hint: '+отношения · −еда',
          effects: { social: +10, mood: +6, family: +4 },
          result: 'Соседка снизу теперь здоровается первой.' },
        { id: 'b', label: 'Честно доесть всё', icon: '🍽', hint: '+здоровье · −силы',
          effects: { health: +6, energy: -8, mood: -4 },
          result: 'Ты ел одно и то же пять дней. Пять. Дней.' }
      ]
    },

    {
      id: 'h_car_refuse_fix', icon: '🔧', rarity: 'common', weight: 9, minDay: 8, cooldown: 14,
      chain: 'car', require: { car: true },
      title: 'Сервис говорит: «пора»',
      text: 'На диагностике насчитали 6 000 ₽. Мастер смотрит на тебя как на человека, который вернётся.',
      choices: [
        { id: 'a', label: 'Починить у знакомого', icon: '🔩', hint: '−6 000 ₽ · +машина',
          cost: { money: 6000, category: 'car' },
          effects: { carCondition: +18, mood: +4, exp: 1 },
          result: 'Знакомый сделал за день и взял наличными.' },
        { id: 'b', label: 'Потом починим', icon: '🤷', hint: 'бесплатно · −удача',
          effects: { mood: +4, luck: -3, flag: 'car_deferred' },
          next: { id: 'h_car_dead', in: 3 },
          result: 'Ты похлопал машину по капоту и сказал: «Держись».' },
        { id: 'c', label: 'Спросить у соседа-механика', icon: '💬', hint: '+отношения · +опыт',
          effects: { social: +6, exp: 1, mood: +2 },
          result: 'Сосед пообещал посмотреть в выходные. Уже третий месяц.' }
      ]
    },
    {
      id: 'h_car_dead', icon: '🚗', rarity: 'common', weight: 1, minDay: 1, cooldown: 20,
      queued: true, chain: 'car', require: { car: true },
      title: 'Машина встала на полпути',
      text: 'На светофоре что-то хрустнуло, и мотор замолчал. Сзади уже сигналят.',
      choices: [
        { id: 'a', label: 'Вызвать эвакуатор', icon: '🚨', hint: '−7 500 ₽ · машина в сервис',
          cost: { money: 7500, category: 'car' },
          effects: { mood: -8, energy: -8 },
          next: { id: 'h_car_final', in: 2 },
          result: 'Эвакуатор приехал через два часа. Два. Часа.' },
        { id: 'b', label: 'Дотолкать до обочины', icon: '💪', hint: '−силы · −здоровье',
          effects: { energy: -14, health: -4, fatigue: +10, mood: -8 },
          next: { id: 'h_car_final', in: 4 },
          result: 'Ты толкал машину в горку и вспомнил всё, что о ней думал.' },
        { id: 'c', label: 'Позвонить знакомому', icon: '📞', hint: '+отношения · +опыт',
          effects: { social: +6, mood: +4, exp: 1 },
          next: { id: 'h_car_final', in: 3 },
          result: 'Знакомый приехал с тросом и парой шуток.' }
      ]
    },
    {
      id: 'h_car_final', icon: '🧾', rarity: 'common', weight: 1, minDay: 1, cooldown: 25,
      queued: true, chain: 'car', require: { car: true },
      title: 'Счёт за ремонт: держись',
      text: 'Мастер перечисляет детали. Ты киваешь, но слышишь только сумму.',
      choices: [
        { id: 'a', label: 'Починить в сервисе', icon: '🔧', hint: '−18 000 ₽ · +машина',
          cost: { money: 18000, category: 'car' },
          effects: { carCondition: +35, mood: -6, fatigue: +6 },
          result: 'Машина снова едет. Кошелёк снова пустой.' },
        { id: 'b', label: 'Продать как есть', icon: '🏷', hint: 'искать покупателя',
          effects: { mood: -6, luck: -2 },
          next: { id: 'h_sell_car', in: 2 },
          result: 'Ты выставил объявление с честным описанием «нужен ремонт».' },
        { id: 'c', label: 'Ездить на автобусе', icon: '🚌', hint: '−настроение · +опыт',
          effects: { mood: -7, energy: -3, exp: 1 },
          result: 'Автобус в 7:20. Ты узнал всех, кто в нём ездит.' }
      ]
    },
    {
      id: 'h_sell_car', icon: '🚙', rarity: 'uncommon', weight: 1, minDay: 1, cooldown: 30,
      queued: true, once: true, chain: 'car', require: { car: true },
      title: 'Покупатель приехал смотреть',
      text: 'Он обошёл машину три раза и задал вопрос, после которого всё ясно.',
      choices: [
        { id: 'a', label: 'Продать и не торговаться', icon: '🤝', hint: '+90 000 ₽ · −машина',
          effects: { money: +90000, carGone: true, mood: -10, luck: +2, exp: 2 },
          result: 'Деньги на карте. Машины под окном больше нет.' },
        { id: 'b', label: 'Продать дороже, но ждать', icon: '⏳', hint: 'риск · +75 000 ₽',
          effects: { money: +75000, carGone: true, mood: +4 },
          risk: [{ chance: 0.5, text: 'Покупатель сбил цену до последнего рубля', effects: { money: -1500, category: 'car', mood: -8 } }],
          result: 'Ты держался две недели и всё равно продал.' },
        { id: 'c', label: 'Передумать и оставить', icon: '🛑', hint: '−800 ₽ · машина с тобой',
          cost: { money: 800, category: 'car' },
          effects: { mood: +6 },
          result: 'Ты сказал: «Ещё поездит». Машина не согласилась.' }
      ]
    },

    {
      id: 'h_toothache', icon: '🦷', rarity: 'common', weight: 9, minDay: 6, cooldown: 14,
      chain: 'tooth',
      title: 'Зуб напомнил о себе ночью',
      text: 'Ты проснулся от того, что половина лица живёт своей жизнью.',
      choices: [
        { id: 'a', label: 'Терпеть до утра', icon: '😬', hint: '−600 ₽ · −здоровье',
          cost: { money: 600, category: 'health' },
          effects: { health: -8, mood: -5, fatigue: +6 },
          next: { id: 'h_tooth_dentist', in: 4 },
          result: 'Таблетка помогла на четыре часа. Ночь длинная.' },
        { id: 'b', label: 'Сразу записаться к врачу', icon: '📋', hint: '−3 500 ₽ · +здоровье',
          cost: { money: 3500, category: 'health' },
          effects: { health: +10, mood: +5, exp: 1 },
          next: { id: 'h_tooth_dentist', in: 1 },
          result: 'Талон на утро. Ты почти горд собой.' },
        { id: 'c', label: 'Помазать чем-то из аптечки', icon: '💊', hint: 'бесплатно · −здоровье',
          effects: { health: -3, mood: -3 },
          next: { id: 'h_tooth_dentist', in: 3 },
          result: 'Ты нашёл в аптечке мазь 2019 года.' }
      ]
    },
    {
      id: 'h_tooth_dentist', icon: '🪥', rarity: 'common', weight: 1, minDay: 1, cooldown: 20,
      queued: true, chain: 'tooth',
      title: 'Кресло, бормашина, лампочка',
      text: 'Врач смотрит снимок и говорит фразу, от которой холодеет затылок.',
      choices: [
        { id: 'a', label: 'Лечить как надо', icon: '🦷', hint: '−14 000 ₽ · +здоровье',
          cost: { money: 14000, category: 'health' },
          effects: { health: +18, mood: +8, energy: -8 },
          next: { id: 'h_tooth_after', in: 3 },
          result: 'Полтора часа, два укола и один новый зуб.' },
        { id: 'b', label: 'Только пломба', icon: '🩹', hint: '−4 500 ₽ · риск',
          cost: { money: 4500, category: 'health' },
          effects: { health: +6, mood: -2, exp: 1 },
          risk: [{ chance: 0.4, text: 'Через полгода этот зуб разболелся снова', effects: { health: -10, mood: -8 } }],
          next: { id: 'h_tooth_after', in: 6 },
          result: 'Ты вышел с пломбой и списком того, что «надо бы».' },
        { id: 'c', label: 'Взять паузу до зарплаты', icon: '📅', hint: 'бесплатно · −здоровье',
          effects: { health: -6, mood: -5, fatigue: +4 },
          next: { id: 'h_tooth_after', in: 8 },
          result: 'Ты вышел, не открывая рот, чтобы не спугнуть боль.' }
      ]
    },
    {
      id: 'h_tooth_after', icon: '🥣', rarity: 'common', weight: 1, minDay: 1, cooldown: 25,
      queued: true, chain: 'tooth',
      title: 'После стоматолога',
      text: 'Щека ещё онемевшая, а ты уже планируешь, что будешь есть.',
      choices: [
        { id: 'a', label: 'Купить мягкого и вкусного', icon: '🍦', hint: '−900 ₽ · +настроение',
          cost: { money: 900, category: 'food' },
          effects: { mood: +8, health: +4 },
          result: 'Йогурт, суп-пюре и мороженое «по медицинским показаниям».' },
        { id: 'b', label: 'Ничего, потерплю', icon: '😐', hint: '−настроение · −здоровье',
          effects: { mood: -4, health: -2 },
          result: 'Ты весь вечер смотрел, как другие едят.' },
        { id: 'c', label: 'Позвонить маме', icon: '📞', hint: '+семья · +настроение',
          effects: { family: +8, mood: +5, social: +3 },
          result: 'Мама сказала, что надо было идти раньше. Как всегда.' }
      ]
    },

    {
      id: 'h_delivery_night', icon: '🍜', rarity: 'common', weight: 10, minDay: 3, cooldown: 10,
      chain: 'delivery',
      title: 'Доставка работает до трёх',
      text: 'Ты открыл приложение «на минутку» и собрал заказ на 2 400 ₽.',
      choices: [
        { id: 'a', label: 'Заказать как собрал', icon: '🛵', hint: '−2 400 ₽ · +настроение',
          cost: { money: 2400, category: 'food' },
          effects: { mood: +12, health: -4, energy: +6 },
          next: { id: 'h_delivery_after', in: 1 },
          result: 'Курьер приехал быстрее, чем ты успел убрать со стола.' },
        { id: 'b', label: 'Убрать лишнее из корзины', icon: '🧾', hint: '−1 100 ₽ · +опыт',
          cost: { money: 1100, category: 'food' },
          effects: { mood: +5, exp: 1 },
          next: { id: 'h_delivery_after', in: 1 },
          result: 'Ты оставил только роллы. И соус. И ещё один соус.' },
        { id: 'c', label: 'Закрыть приложение', icon: '🚶', hint: 'бесплатно · +здоровье',
          effects: { mood: -6, health: +4 },
          result: 'Гречка с котлетой. Ты сказал себе, что так и хотел.' }
      ]
    },
    {
      id: 'h_delivery_after', icon: '🥡', rarity: 'common', weight: 1, minDay: 1, cooldown: 15,
      queued: true, chain: 'delivery',
      title: 'Пакет, соусы и вопрос',
      text: 'На столе три пакета, два прибора и один ты.',
      choices: [
        { id: 'a', label: 'Съесть всё', icon: '🍽', hint: '−здоровье · +настроение',
          effects: { health: -6, mood: +6, energy: -6, fatigue: +5 },
          result: 'Ты доел и почувствовал себя сытым и виноватым сразу.' },
        { id: 'b', label: 'Убрать в холодильник', icon: '🧊', hint: '+опыт · спокойно',
          effects: { mood: +2, exp: 1 },
          result: 'Завтра ты найдёшь это и обрадуешься. Или нет.' },
        { id: 'c', label: 'Отдать соседу-студенту', icon: '🤝', hint: '+отношения · +настроение',
          effects: { social: +10, mood: +6, family: +2 },
          result: 'Сосед теперь здоровается и спрашивает, не осталось ли чего.' }
      ]
    },

    {
      id: 'h_parcel_impulse', icon: '📦', rarity: 'common', weight: 10, minDay: 5, cooldown: 11,
      chain: 'parcel',
      title: 'Три посылки в пункте выдачи',
      text: 'Ты не помнишь, что заказывал, но код уже в телефоне.',
      choices: [
        { id: 'a', label: 'Забрать все три', icon: '📦', hint: '−5 200 ₽ · +настроение',
          cost: { money: 5200, category: 'fun' },
          effects: { mood: +14, energy: -4 },
          risk: [{ chance: 0.4, text: 'Одна вещь оказалась на два размера меньше', effects: { mood: -8, money: -600, category: 'fun' } }],
          next: { id: 'h_parcel_after', in: 2 },
          result: 'Два пакета — то, что нужно. Третий — загадка.' },
        { id: 'b', label: 'Забрать одну из трёх', icon: '🛍', hint: '−1 500 ₽ · +опыт',
          cost: { money: 1500, category: 'fun' },
          effects: { mood: +5, exp: 1 },
          next: { id: 'h_parcel_after', in: 3 },
          result: 'Ты выбрал самую тяжёлую. Логично.' },
        { id: 'c', label: 'Не забирать вообще', icon: '🚶', hint: 'бесплатно · −удача',
          effects: { mood: -5, luck: -2 },
          result: 'Через неделю посылки уехали обратно. Что там было — тайна.' }
      ]
    },
    {
      id: 'h_parcel_after', icon: '👕', rarity: 'common', weight: 1, minDay: 1, cooldown: 15,
      queued: true, chain: 'parcel',
      title: 'Примерка и разочарование',
      text: 'Вещь лежит на стуле и смотрит на тебя с укором.',
      choices: [
        { id: 'a', label: 'Оформить возврат', icon: '↩️', hint: '−300 ₽ · +опыт',
          cost: { money: 300, category: 'other' },
          effects: { mood: +6, exp: 1 },
          result: 'Ты упаковал, отнёс и получил деньги обратно. Почти спорт.' },
        { id: 'b', label: 'Оставить, вдруг пригодится', icon: '🗄', hint: '−настроение',
          effects: { mood: -4 },
          result: 'Она будет лежать в шкафу до следующего ремонта.' },
        { id: 'c', label: 'Подарить кому-нибудь', icon: '🎁', hint: '+отношения · +настроение',
          effects: { social: +8, mood: +5, family: +4 },
          result: 'Друг сказал спасибо. Ты промолчал про размер.' }
      ]
    },

    {
      id: 'h_vacation_offer', icon: '🏖', rarity: 'rare', weight: 4, minDay: 20, cooldown: 30,
      once: true, chain: 'vacation', require: { money: 40000 },
      title: 'Горящая путёвка на море',
      text: 'Тур на 7 ночей подешевел вдвое. Осталось два места и мало времени.',
      choices: [
        { id: 'a', label: 'Брать, пока есть', icon: '✈️', hint: '−52 000 ₽ · +настроение',
          cost: { money: 52000, category: 'fun' },
          effects: { mood: +18, fatigue: -6, energy: +5 },
          next: { id: 'h_vacation_trip', in: 3 },
          result: 'Ты нажал «оплатить» и почувствовал, как отпуск начался.' },
        { id: 'b', label: 'Спросить семью', icon: '👪', hint: '+семья · +настроение',
          effects: { family: +10, mood: +6, exp: 1 },
          next: { id: 'h_vacation_trip', in: 5 },
          result: 'Семейный чат ожил за минуту. Голосование было бурным.' },
        { id: 'c', label: 'Отказаться, деньги нужнее', icon: '🧾', hint: '−настроение · +опыт',
          effects: { mood: -10, exp: 1 },
          result: 'Ты закрыл приложение и открыл квитанции. Взрослая жизнь.' }
      ]
    },
    {
      id: 'h_vacation_trip', icon: '🧳', rarity: 'uncommon', weight: 1, minDay: 1, cooldown: 30,
      queued: true, chain: 'vacation',
      title: 'Чемодан, аэропорт, очередь',
      text: 'Ты взял три вещи, но чемодан почему-то весит 23 килограмма.',
      choices: [
        { id: 'a', label: 'Доплатить за перевес', icon: '💳', hint: '−3 500 ₽ · −настроение',
          cost: { money: 3500, category: 'fun' },
          effects: { mood: -4, fatigue: +6 },
          next: { id: 'h_vacation_after', in: 5 },
          result: 'Ты заплатил и пообещал в следующий раз взять меньше.' },
        { id: 'b', label: 'Переложить в ручную кладь', icon: '🎒', hint: '−силы · +опыт',
          effects: { energy: -8, mood: +5, luck: +2, exp: 1 },
          next: { id: 'h_vacation_after', in: 5 },
          result: 'Ты стоял в проходе и перекладывал банки с сувенирами.' },
        { id: 'c', label: 'Выбросить лишнее', icon: '🗑', hint: '−настроение · −силы',
          effects: { mood: -6, fatigue: +4 },
          next: { id: 'h_vacation_after', in: 5 },
          result: 'Ты распрощался с феном и вторым свитером.' }
      ]
    },
    {
      id: 'h_vacation_after', icon: '😴', rarity: 'common', weight: 1, minDay: 1, cooldown: 30,
      queued: true, chain: 'vacation',
      title: 'Отпуск закончился, усталость нет',
      text: 'Ты вернулся загорелым, довольным и с тремя рабочими чатами.',
      choices: [
        { id: 'a', label: 'Разобрать почту', icon: '📧', hint: '+работа · −силы',
          effects: { work: +10, energy: -8, mood: -4, exp: 1 },
          result: 'Три часа писем — и ты снова в строю.' },
        { id: 'b', label: 'Ещё денёк ничего не делать', icon: '📺', hint: '+настроение · −работа',
          effects: { mood: +8, work: -6, energy: +6 },
          result: 'Ты смотрел сериал и делал вид, что отпуск ещё идёт.' },
        { id: 'c', label: 'Показать всем фотографии', icon: '📷', hint: '+отношения · +настроение',
          effects: { social: +10, mood: +6, family: +4 },
          result: 'Коллеги посмотрели двадцать фото. Двадцать. Фото.' }
      ]
    },

    {
      id: 'h_gym_membership', icon: '🏋️', rarity: 'common', weight: 9, minDay: 7, cooldown: 20,
      chain: 'gym',
      title: 'Годовая карта в зал со скидкой',
      text: 'Менеджер уверяет, что именно сегодня лучшая цена в году.',
      choices: [
        { id: 'a', label: 'Купить годовую', icon: '💳', hint: '−22 000 ₽ · +здоровье',
          cost: { money: 22000, category: 'health' },
          effects: { mood: +12, health: +6, exp: 1 },
          next: { id: 'h_gym_after', in: 6 },
          result: 'Карта в кошельке. Спортивная форма — в планах.' },
        { id: 'b', label: 'Купить на месяц', icon: '🗓', hint: '−3 200 ₽ · +здоровье',
          cost: { money: 3200, category: 'health' },
          effects: { mood: +6, health: +4 },
          next: { id: 'h_gym_after', in: 6 },
          result: 'Месяц — это тоже срок, если честно.' },
        { id: 'c', label: 'Пойти на пробное занятие', icon: '🤸', hint: 'бесплатно · −силы',
          effects: { health: +4, energy: -8, fatigue: +8, exp: 1 },
          result: 'Ты выжал себя за час и понял, что мышцы существуют.' }
      ]
    },
    {
      id: 'h_gym_after', icon: '🩳', rarity: 'common', weight: 1, minDay: 1, cooldown: 20,
      queued: true, chain: 'gym',
      title: 'Первый месяц и боли в ногах',
      text: 'Ты ходил три раза. Карта лежит на видном месте и молчит.',
      choices: [
        { id: 'a', label: 'Ходить без пропусков', icon: '🏃', hint: '+здоровье · −силы',
          effects: { health: +14, energy: -8, fatigue: +10, mood: +8, exp: 2 },
          result: 'Через месяц ты поднимался по лестнице и не задыхался.' },
        { id: 'b', label: 'Продать карту знакомому', icon: '🤝', hint: '+7 000 ₽ · −настроение',
          effects: { money: +7000, social: +5, mood: -4, exp: 1 },
          result: 'Знакомый счастлив. Ты снова свободен по вечерам.' },
        { id: 'c', label: 'Оставить «на потом»', icon: '🗄', hint: '−настроение',
          effects: { mood: -3 },
          result: 'Она так и лежит. Ты так и планируешь.' }
      ]
    },

    {
      id: 'h_common_cold', icon: '🤒', rarity: 'common', weight: 12, minDay: 3, cooldown: 10,
      title: 'Простуда пришла без приглашения',
      text: 'Утром горло царапало, к вечеру ты говорил шёпотом.',
      choices: [
        { id: 'a', label: 'Аптека и лечение', icon: '💊', hint: '−1 800 ₽ · +здоровье',
          cost: { money: 1800, category: 'health' },
          effects: { health: +10, mood: +4, energy: -4 },
          result: 'Пакет лекарств, лимон и чай. Классика.' },
        { id: 'b', label: 'Переносить на ногах', icon: '😷', hint: 'риск · −здоровье',
          effects: { health: -6, work: -4, mood: -4, exp: 1 },
          risk: [{ chance: 0.55, text: 'К вечеру поднялась температура', effects: { health: -12, fatigue: +10, work: -6 } }],
          result: 'Ты работал, кашлял и всем рассказывал, что всё нормально.' },
        { id: 'c', label: 'Взять день на диване', icon: '🛋', hint: '+здоровье · −работа',
          effects: { health: +6, mood: +5, work: -6, fatigue: -6 },
          result: 'Плед, сериал и три литра чая. Организм сказал спасибо.' }
      ]
    },
    {
      id: 'h_sick_leave', icon: '📋', rarity: 'common', weight: 8, minDay: 6, cooldown: 15,
      title: 'Больничный: бумаги и очередь',
      text: 'Врач спрашивает, чем болел, и смотрит в монитор.',
      choices: [
        { id: 'a', label: 'Оформить официально', icon: '📄', hint: '+здоровье · −работа',
          effects: { health: +8, work: -4, mood: +4 },
          result: 'Три дня дома по закону и с чистой совестью.' },
        { id: 'b', label: 'Работать из дома', icon: '💻', hint: '+работа · −здоровье',
          effects: { health: -4, work: +6, mood: -3, fatigue: +5 },
          result: 'Ты отвечал на сообщения с ноутбуком на одеяле.' },
        { id: 'c', label: 'Отлежаться без оформления', icon: '🛏', hint: '+настроение · +опыт',
          effects: { health: +4, work: -3, mood: +6, exp: 1 },
          result: 'Никто не знал. Все спрашивали, почему ты молчишь в созвоне.' }
      ]
    },
    {
      id: 'h_pharmacy_run', icon: '💊', rarity: 'common', weight: 11, minDay: 2, cooldown: 9,
      title: 'В аптеке снова нет того самого',
      text: 'Фармацевт предлагает аналог, который дороже в три раза.',
      choices: [
        { id: 'a', label: 'Взять дорогой аналог', icon: '💳', hint: '−2 600 ₽ · +здоровье',
          cost: { money: 2600, category: 'health' },
          effects: { health: +8, mood: +2 },
          result: 'Ты заплатил и прочитал инструкцию дважды.' },
        { id: 'b', label: 'Искать в другой аптеке', icon: '🚶', hint: '−силы · +опыт',
          effects: { energy: -6, health: +4, mood: -3, exp: 1 },
          result: 'Ты обошёл три аптеки и нашёл. Победа, но уставшая.' },
        { id: 'c', label: 'Пить чай с малиной', icon: '🍵', hint: '+здоровье · +семья',
          effects: { health: +3, mood: +3, family: +4 },
          result: 'Бабушкин метод снова оказался в топе.' }
      ]
    },
    {
      id: 'h_back_pain', icon: '🦴', rarity: 'common', weight: 9, minDay: 8, cooldown: 14,
      title: 'Спина сказала «хватит»',
      text: 'Ты поднял пакет с продуктами и понял, что больше не разогнёшься.',
      choices: [
        { id: 'a', label: 'К платному массажисту', icon: '💆', hint: '−4 500 ₽ · +здоровье',
          cost: { money: 4500, category: 'health' },
          effects: { health: +14, mood: +8, fatigue: -6 },
          result: 'Час боли и блаженства. Спина сказала спасибо.' },
        { id: 'b', label: 'Купить мазь и терпеть', icon: '🧴', hint: '−700 ₽ · −здоровье',
          cost: { money: 700, category: 'health' },
          effects: { health: +5, mood: -3, fatigue: +4 },
          result: 'Мазь пахнет как детство и немного жжёт.' },
        { id: 'c', label: 'Зарядка по видео', icon: '🧘', hint: '+здоровье · −силы',
          effects: { health: +6, energy: -6, mood: +3, exp: 1 },
          result: 'Ты делал упражнения под комментарии тренера о спине.' }
      ]
    },
    {
      id: 'h_hospital', icon: '🏥', rarity: 'rare', weight: 3, minDay: 12, cooldown: 30,
      once: true,
      title: 'Скорая, приёмное, капельница',
      text: 'Врачи говорят: «Полежишь недельку». Ты смотришь на часы и на телефон.',
      choices: [
        { id: 'a', label: 'Лечь и лечиться', icon: '🛏', hint: '−22 000 ₽ · +здоровье',
          cost: { money: 22000, category: 'health' },
          effects: { health: +22, work: -12, mood: +6, fatigue: -10, exp: 2 },
          result: 'Неделя в палате, сосед храпит, но тебе правда лучше.' },
        { id: 'b', label: 'Уйти под расписку', icon: '✍️', hint: 'риск · −здоровье',
          effects: { health: -8, work: +2, mood: -6 },
          risk: [{ chance: 0.6, text: 'Через два дня стало хуже, и ты вернулся', effects: { health: -18, money: -9000, category: 'health' } }],
          result: 'Ты подписал бумаги и поехал домой. Ненадолго.' },
        { id: 'c', label: 'Позвонить семье', icon: '📞', hint: '+семья · +настроение',
          effects: { family: +12, mood: +8, social: +5, health: +6, exp: 1 },
          result: 'Они приехали в тот же вечер с пакетом еды и одеялом.' }
      ]
    },

    {
      id: 'h_gas_station', icon: '⛽', rarity: 'common', weight: 12, minDay: 2, cooldown: 8,
      require: { car: true },
      title: 'Цены на заправке опять выросли',
      text: 'Ты смотришь на табло и мысленно пересчитываешь поездки.',
      choices: [
        { id: 'a', label: 'Залить полный бак', icon: '⛽', hint: '−3 800 ₽ · +машина',
          cost: { money: 3800, category: 'car' },
          effects: { carCondition: +4, mood: +4, exp: 1 },
          result: 'Полный бак — это спокойствие на две недели.' },
        { id: 'b', label: 'Залить на тысячу', icon: '💵', hint: '−1 000 ₽ · −настроение',
          cost: { money: 1000, category: 'car' },
          effects: { carCondition: +1, mood: -2 },
          result: 'Стрелка поднялась на четверть. Ты сделал вид, что так и планировал.' },
        { id: 'c', label: 'Проехать мимо', icon: '🚗', hint: 'бесплатно · −удача',
          effects: { mood: -3, fatigue: +3, luck: -1 },
          result: 'Дешевле не стало. Зато стало позже.' }
      ]
    },
    {
      id: 'h_tires', icon: '🛞', rarity: 'common', weight: 8, minDay: 10, cooldown: 18,
      require: { car: true },
      title: 'Шины, сезон и очередь',
      text: 'На шиномонтаже двадцать машин, а ты без записи.',
      choices: [
        { id: 'a', label: 'Переобуться в сервисе', icon: '🔧', hint: '−6 500 ₽ · +машина',
          cost: { money: 6500, category: 'car' },
          effects: { carCondition: +12, mood: +5, energy: -4 },
          result: 'Два часа ожидания и четыре новых ощущения на дороге.' },
        { id: 'b', label: 'Купить б/у комплект', icon: '🛞', hint: '−9 000 ₽ · риск',
          cost: { money: 9000, category: 'car' },
          effects: { carCondition: +14, social: +5, mood: +4 },
          risk: [{ chance: 0.35, text: 'Одна шина оказалась с грыжей', effects: { carCondition: -14, mood: -10, money: -3000, category: 'car' } }],
          result: 'Сосед помог занести колёса и рассказал, где их брал.' },
        { id: 'c', label: 'Ездить на летних', icon: '❄️', hint: 'риск · −машина',
          effects: { carCondition: -8, risk: +4, mood: +2, luck: -3 },
          result: 'Первый снег ты встретил на летней резине и с молитвой.' }
      ]
    },
    {
      id: 'h_tech_maintenance', icon: '🔩', rarity: 'common', weight: 8, minDay: 9, cooldown: 16,
      require: { car: true },
      title: 'ТО: список вырос вдвое',
      text: 'Мастер звонит и говорит: «Тут ещё пара моментов».',
      choices: [
        { id: 'a', label: 'Сделать полное ТО', icon: '🧰', hint: '−16 500 ₽ · +машина',
          cost: { money: 16500, category: 'car' },
          effects: { carCondition: +28, mood: -4, exp: 1 },
          result: 'Машина довольна. Ты не очень, но это пройдёт.' },
        { id: 'b', label: 'Только необходимое', icon: '🔧', hint: '−5 200 ₽ · −удача',
          cost: { money: 5200, category: 'car' },
          effects: { carCondition: +10, luck: -2 },
          result: 'Ты отказался от «пара моментов». Пока.' },
        { id: 'c', label: 'Отложить до месяца', icon: '📅', hint: '−машина · −удача',
          effects: { carCondition: -6, mood: +2, luck: -2 },
          result: 'Мастер вздохнул так, что стало стыдно.' }
      ]
    },
    {
      id: 'h_speeding_fine', icon: '🚨', rarity: 'common', weight: 10, minDay: 5, cooldown: 12,
      require: { car: true },
      title: 'Письмо счастья со скидкой',
      text: 'Камера поймала тебя там, где ты «точно успевал».',
      choices: [
        { id: 'a', label: 'Оплатить со скидкой', icon: '💳', hint: '−500 ₽ · +опыт',
          cost: { money: 500, category: 'car' },
          effects: { mood: -3, exp: 1, luck: +1 },
          result: 'Ты нажал «оплатить» и стал ездить медленнее. На неделю.' },
        { id: 'b', label: 'Попробовать оспорить', icon: '⚖️', hint: 'риск · +опыт',
          effects: { mood: +6, exp: 1, work: -3 },
          risk: [{ chance: 0.7, text: 'Суд встал на сторону камеры', effects: { mood: -10, money: -1000, category: 'car' } }],
          result: 'Ты подготовился, пришёл и говорил уверенно.' },
        { id: 'c', label: 'Забыть про штраф', icon: '🙈', hint: '−2 000 ₽ · −удача',
          effects: { money: -2000, category: 'car', mood: -8, luck: -2 },
          result: 'Через месяц сумма выросла. Как и твоё удивление.' }
      ]
    },
    {
      id: 'h_tow_truck', icon: '🚧', rarity: 'uncommon', weight: 6, minDay: 11, cooldown: 16,
      require: { car: true },
      title: 'Машину увезли на эвакуаторе',
      text: 'Ты вышел утром и увидел пустое место и номер на асфальте.',
      choices: [
        { id: 'a', label: 'Забрать со штрафстоянки', icon: '🏁', hint: '−7 500 ₽ · −настроение',
          cost: { money: 7500, category: 'car' },
          effects: { carCondition: +2, mood: -8, energy: -6, exp: 1 },
          result: 'Три часа, две очереди и одна подпись. Машина вернулась.' },
        { id: 'b', label: 'Позвонить знакомому', icon: '📞', hint: '+отношения · −силы',
          effects: { social: +6, energy: -4, mood: -4 },
          result: 'Знакомый подвёз, но всю дорогу учил тебя парковаться.' },
        { id: 'c', label: 'Оставить до завтра', icon: '🚇', hint: '−900 ₽ · +опыт',
          effects: { money: -900, category: 'other', fatigue: +5, mood: -5, exp: 1 },
          result: 'Сутки стоянки стоят дороже. Ты узнал это утром.' }
      ]
    },
    {
      id: 'h_bus_pass', icon: '🚌', rarity: 'common', weight: 10, minDay: 4, cooldown: 10,
      title: 'Проездной или разовые поездки',
      text: 'Ты считаешь в уме и всё равно покупаешь кофе на остановке.',
      choices: [
        { id: 'a', label: 'Купить проездной на месяц', icon: '🎫', hint: '−2 400 ₽ · +опыт',
          cost: { money: 2400, category: 'other' },
          effects: { mood: +6, exp: 1 },
          result: 'Месяц свободы от мелочи в кармане.' },
        { id: 'b', label: 'Ездить разово', icon: '💵', hint: '−600 ₽ · −настроение',
          effects: { money: -600, category: 'other', mood: -2 },
          result: 'Каждый раз казалось, что так дешевле.' },
        { id: 'c', label: 'Ходить пешком, если близко', icon: '🚶', hint: '+здоровье · −силы',
          effects: { health: +6, energy: -6, fatigue: +6, mood: +4, exp: 1 },
          result: 'Ты прошёл шесть остановок и почувствовал себя спортсменом.' }
      ]
    },

    {
      id: 'h_marketplace_impulse', icon: '🛒', rarity: 'common', weight: 11, minDay: 3, cooldown: 9,
      title: 'Корзина на 7 300 ₽ и купон',
      text: 'До бесплатной доставки не хватает 300 ₽. Ты добавил ещё три вещи.',
      choices: [
        { id: 'a', label: 'Оформить заказ', icon: '📦', hint: '−7 300 ₽ · +настроение',
          cost: { money: 7300, category: 'fun' },
          effects: { mood: +12, energy: -3 },
          risk: [{ chance: 0.45, text: 'Две вещи оказались совсем не нужны', effects: { mood: -8, money: -1200, category: 'fun' } }],
          result: 'Курьер привёз четыре пакета, три из которых ты не помнишь.' },
        { id: 'b', label: 'Убрать лишнее из корзины', icon: '🧾', hint: '−2 600 ₽ · +опыт',
          cost: { money: 2600, category: 'home' },
          effects: { mood: +6, exp: 1 },
          result: 'Ты удалил из корзины то, что искал двадцать минут.' },
        { id: 'c', label: 'Отложить до зарплаты', icon: '⭐', hint: '−настроение · +опыт',
          effects: { mood: -4, exp: 1 },
          result: 'В избранном теперь 84 товара. Ты их пересчитал.' }
      ]
    },
    {
      id: 'h_warranty_tech', icon: '📱', rarity: 'uncommon', weight: 6, minDay: 7, cooldown: 15,
      title: 'Гарантия кончилась вчера',
      text: 'Телефон перестал заряжаться через день после конца гарантии.',
      choices: [
        { id: 'a', label: 'Сдать по гарантии', icon: '🧾', hint: 'риск · +опыт',
          effects: { mood: +8, exp: 1, energy: -4 },
          risk: [{ chance: 0.55, text: 'Сервис нашёл следы влаги и отказал', effects: { mood: -10, fatigue: +5 } }],
          result: 'Ты принёс чек, коробку и надежду.' },
        { id: 'b', label: 'Починить за свои', icon: '🔧', hint: '−6 800 ₽ · +опыт',
          cost: { money: 6800, category: 'other' },
          effects: { mood: +6, exp: 1 },
          result: 'Разъём заменили за час и взяли как за новый телефон.' },
        { id: 'c', label: 'Жить с этим', icon: '🔌', hint: '−настроение · −работа',
          effects: { mood: -8, work: -4, fatigue: +5 },
          result: 'Ты заряжал телефон под углом и держал провод рукой.' }
      ]
    },
    {
      id: 'h_found_money', icon: '💰', rarity: 'rare', weight: 5, minDay: 6, cooldown: 20,
      title: 'Находка в куртке и в подъезде',
      text: 'Ты нашёл деньги там, где точно не ждал. И не только ты.',
      choices: [
        { id: 'a', label: 'Оставить себе, честно', icon: '💵', hint: '+9 000 ₽ · +удача',
          effects: { money: +9000, mood: +10, luck: +2 },
          result: 'Ты пересчитал трижды и не поверил.' },
        { id: 'b', label: 'Отнести в полицию', icon: '🚔', hint: '+отношения · +опыт',
          effects: { social: +8, mood: +8, exp: 1, luck: +1 },
          result: 'Заявление приняли, а через месяц пришла благодарность.' },
        { id: 'c', label: 'Потратить на семью', icon: '🎁', hint: '+семья · +настроение',
          effects: { family: +10, mood: +10, social: +4 },
          result: 'Ты принёс домой торт и всех удивил.' }
      ]
    },
    {
      id: 'h_lottery_win', icon: '🎰', rarity: 'epic', weight: 3, minDay: 15, cooldown: 30,
      once: true,
      title: 'Джекпот в лотерейном киоске',
      text: 'Ты купил билет из любопытства и весь вечер проверял комбинацию.',
      choices: [
        { id: 'a', label: 'Забрать выигрыш и вложить', icon: '🏦', hint: '+120 000 ₽ · риск',
          effects: { money: +120000, mood: +20, luck: +5, exp: 2 },
          risk: [{ chance: 0.25, text: 'Часть выигрыша ушла на старые долги', effects: { money: -45000, category: 'other', mood: -12 } }],
          result: 'Деньги на счету. Ты перечитывал смс пять раз.' },
        { id: 'b', label: 'Потратить на мечты', icon: '✨', hint: '+настроение · +семья',
          effects: { money: +120000, mood: +22, family: +12, social: +8, energy: -4 },
          result: 'Ты купил то, о чём говорил годами. И всем рассказал.' },
        { id: 'c', label: 'Отдать часть в фонд', icon: '❤️', hint: '+отношения · +опыт',
          effects: { money: +90000, mood: +18, social: +14, family: +6, charity: +1, exp: 2 },
          result: 'Ты перевёл сумму в фонд и впервые почувствовал себя взрослым.' }
      ]
    },
    {
      id: 'h_big_purchase', icon: '📺', rarity: 'rare', weight: 4, minDay: 14, cooldown: 25,
      once: true, require: { money: 30000 },
      title: 'Крупная покупка: техника',
      text: 'Ты выбирал месяц, а решил за минуту. Консультант уже несёт коробку.',
      choices: [
        { id: 'a', label: 'Купить топовую модель', icon: '💎', hint: '−28 000 ₽ · +настроение',
          cost: { money: 28000, category: 'home' },
          effects: { mood: +16, energy: +5, exp: 1 },
          result: 'Коробка дома, гарантия в папке, счастье на месяц вперёд.' },
        { id: 'b', label: 'Взять среднюю', icon: '📦', hint: '−14 000 ₽ · +настроение',
          cost: { money: 14000, category: 'home' },
          effects: { mood: +10, exp: 1 },
          result: 'Средняя модель делает то же самое, но дешевле.' },
        { id: 'c', label: 'Развернуться и уйти', icon: '🚪', hint: '−настроение · +удача',
          effects: { mood: -6, exp: 1, luck: +2 },
          result: 'Ты вышел без покупки и с чувством, что сэкономил. Ты прав.' }
      ]
    },
    {
      id: 'h_new_job', icon: '💼', rarity: 'rare', weight: 4, minDay: 18, cooldown: 30,
      once: true,
      title: 'Оффер с новой работы',
      text: 'Предлагают больше, но ехать через весь город и знакомиться заново.',
      choices: [
        { id: 'a', label: 'Согласиться и уйти', icon: '🚀', hint: '+работа · +деньги',
          effects: { money: +9000, work: +12, mood: +8, social: +6, fatigue: +6, exp: 3 },
          result: 'Первый день, новый пропуск и кофе в чужой кружке.' },
        { id: 'b', label: 'Просить прибавку', icon: '📈', hint: 'риск · +работа',
          effects: { work: +6, mood: +6, money: +4000, exp: 2 },
          risk: [{ chance: 0.45, text: 'Прибавку не дали, а отношение испортилось', effects: { work: -8, mood: -10 } }],
          result: 'Разговор был коротким. Ответ — неожиданным.' },
        { id: 'c', label: 'Неделя на размышление', icon: '🤔', hint: '+настроение · −работа',
          effects: { mood: +3, work: -3, exp: 1 },
          result: 'Ты взвешивал и считал. Дорогу, деньги и людей.' }
      ]
    }

  ]);
})();
