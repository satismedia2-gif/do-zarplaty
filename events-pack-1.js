/* events-pack-1.js — контент-пак: работа, деньги, кредиты, подработки. */
(function () {
  'use strict';
  if (typeof Events === 'undefined' || !Events.add) {
    if (typeof console !== 'undefined') console.error('events-pack-1: Events.add не найден');
    return;
  }

  Events.add([

    {
      id: 'w_report_late', icon: '📊', rarity: 'common', weight: 10, minDay: 2, cooldown: 12,
      chain: 'report',
      title: 'Отчёт не готов',
      text: 'Начальник ждёт цифры, а Excel закрылся с ошибкой. Дедлайн был вчера.',
      require: { workBelow: 75 },
      choices: [
        { id: 'a', label: 'Сидеть до ночи', icon: '🌙', hint: '−силы · +работа',
          effects: { energy: -20, work: +12, mood: -8, fatigue: +8, exp: 1 },
          next: { id: 'w_report_tired', in: 1 },
          result: 'Ты отправил файл в 02:40. Начальник ответил «ок».' },
        { id: 'b', label: 'Отправить как есть', icon: '📨', hint: 'риск · −работа',
          effects: { work: -8, mood: +2 },
          risk: [{ chance: 0.5, text: 'Нашли ошибку и разнесли при всех', effects: { work: -10, mood: -10 } }],
          next: { id: 'w_report_shame', in: 2 },
          result: 'Ты нажал «отправить» и закрыл ноутбук.' },
        { id: 'c', label: 'Сказать, что заболел', icon: '🤒', hint: '−работа · +силы',
          effects: { work: -12, energy: +8, mood: +3, flag: 'lied_sick' },
          result: 'Ты соврал и весь день чувствовал себя отвратительно.' }
      ]
    },
    {
      id: 'w_report_tired', icon: '🥱', rarity: 'common', weight: 1, queued: true, chain: 'report',
      title: 'Утро после ночного отчёта',
      text: 'Кофе не помогает. На совещании ты киваешь в такт своим мыслям.',
      choices: [
        { id: 'a', label: 'Держаться', icon: '☕️', hint: '−силы · +работа',
          effects: { energy: -12, work: +6, fatigue: +10 },
          result: 'Ты дожил до вечера на трёх кофе и злости.' },
        { id: 'b', label: 'Уйти пораньше', icon: '🚪', hint: '+силы · −работа',
          effects: { energy: +10, work: -8 },
          result: 'Ты ушёл в шесть и весь вечер ждал звонка.' }
      ]
    },
    {
      id: 'w_report_shame', icon: '😳', rarity: 'common', weight: 1, queued: true, chain: 'report',
      title: 'Разбор ошибки',
      text: 'В сводке «нарисовалось» лишнее. Начальник вызвал «на две минуты».',
      choices: [
        { id: 'a', label: 'Свалить на Excel', icon: '🖥️', hint: 'риск · +мораль',
          effects: { mood: +3, work: -4 },
          risk: [{ chance: 0.4, text: 'Он открыл файл у тебя на глазах', effects: { work: -8, mood: -8 } }],
          result: 'Ты рассказал про «кривой шаблон» и почти поверил сам.' },
        { id: 'b', label: 'Признать и исправить', icon: '🛠️', hint: '+работа · −силы',
          effects: { work: +9, energy: -10, exp: 1 },
          result: 'Ты переделал всё за час и получил «ну вот, можешь же».' }
      ]
    },

    {
      id: 'w_payday', icon: '💰', rarity: 'common', weight: 8, minDay: 28, cooldown: 30,
      chain: 'salary',
      title: 'Зарплата пришла',
      text: 'Смс от банка: зачисление. Через минуту — смс про квартплату.',
      choices: [
        { id: 'a', label: 'Сразу отложить', icon: '🏦', hint: '+деньги · +спокойствие',
          effects: { money: +6000, mood: +4, family: +3 },
          result: 'Ты перевёл часть на «неприкосновенное» и почувствовал себя взрослым.' },
        { id: 'b', label: 'Отметить', icon: '🍕', hint: '−деньги · +мораль',
          cost: { money: 5200, category: 'fun' },
          effects: { money: +6000, mood: +12, social: +6, health: -4, parties: +1 },
          result: 'Пицца, друзья, «я угощаю». Кто вообще считает в такой вечер?' },
        { id: 'c', label: 'Закрыть кредитку', icon: '💳', hint: '−долг · −свобода',
          effects: { money: +6000, creditPay: 9800, mood: -3, family: +4 },
          result: 'Ты погасил платёж и с облегчением закрыл приложение банка.' }
      ]
    },
    {
      id: 'w_salary_delay', icon: '⏳', rarity: 'uncommon', weight: 6, minDay: 18, cooldown: 28, once: true,
      chain: 'delay',
      title: 'Зарплату задержали',
      text: 'Бухгалтерия молчит, в чате уже шутят про «до конца квартала».',
      choices: [
        { id: 'a', label: 'Ждать своим ходом', icon: '🧘', hint: '−мораль · +надежда',
          effects: { mood: -10, fatigue: +8, work: -4 },
          next: { id: 'w_collector', in: 3 },
          result: 'Ты решил не паниковать. Паника решила иначе.' },
        { id: 'b', label: 'Мелкий займ до пятницы', icon: '📱', hint: '+деньги · +долг',
          effects: { money: +15000, creditAdd: 19000, mood: +3, debts: +1 },
          next: { id: 'w_collector', in: 6 },
          result: 'Деньги пришли за семь минут. Условия ты читать не стал.' },
        { id: 'c', label: 'Продать что-нибудь', icon: '📦', hint: '+деньги · −вещи',
          effects: { money: +6000, mood: -6, family: -2 },
          result: 'Ты отнёс на продажу то, что «всё равно не нужно».' }
      ]
    },
    {
      id: 'w_gray_cash', icon: '💼', rarity: 'uncommon', weight: 7, minDay: 6, cooldown: 24, once: true,
      chain: 'gray',
      title: 'Серые схемы',
      text: 'Начальник предложил часть оклада «в конверте»: «так всем удобнее».',
      choices: [
        { id: 'a', label: 'Согласиться', icon: '🤝', hint: '+деньги · +риск',
          effects: { money: +22000, mood: +6, work: +5, risk: +12 },
          risk: [{ chance: 0.35, text: 'Проверка, объяснительная, три часа стыда', effects: { money: -15000, mood: -12, work: -8 } }],
          result: 'Конверт ты взял и спрятал в бардачок, как в кино.' },
        { id: 'b', label: 'Отказаться', icon: '🙅', hint: '−деньги · +спокойствие',
          effects: { mood: -3, work: -5, family: +4 },
          result: 'Ты сказал «только официально» и стал в отделе подозрительно честным.' }
      ]
    },
    {
      id: 'w_collector', icon: '📞', rarity: 'rare', weight: 4, minDay: 20, cooldown: 30, queued: true,
      chain: 'delay',
      title: 'Звонки из банка',
      text: 'Номер незнакомый, вежливый голос называет тебя по имени-отчеству.',
      choices: [
        { id: 'a', label: 'Договориться о платеже', icon: '🗓️', hint: '−деньги · −долг',
          requires: { money: 6000 },
          effects: { money: -6000, creditPay: 6000, mood: +5, family: +4 },
          result: 'Ты согласовал платёж и сбросил напряжение хотя бы в груди.' },
        { id: 'b', label: 'Не брать трубку', icon: '🙈', hint: '−мораль · +долг',
          effects: { mood: -8, health: -4, creditAdd: 3000, fatigue: +6 },
          result: 'Ещё три пропущенных и одно «мы вам напишем».' }
      ]
    },
    {
      id: 'w_bonus_half', icon: '🎁', rarity: 'common', weight: 9, minDay: 10, cooldown: 20,
      title: 'Премия «половиной»',
      text: 'В приказе премия есть, в расчётке — её половина. «Налоги, понимаешь».',
      choices: [
        { id: 'a', label: 'Спросить напрямую', icon: '❓', hint: 'риск · +ясность',
          effects: { work: -3, mood: +2 },
          risk: [{ chance: 0.45, text: 'Тебе объяснили, что ты «не командный игрок»', effects: { work: -8, mood: -8 } }],
          result: 'Ты задал вопрос и внимательно выслушал про «структуру выплат».' },
        { id: 'b', label: 'Смолчать и ждать', icon: '🤐', hint: '+мораль · −деньги',
          effects: { mood: +3, work: +3, money: +3000 },
          result: 'Ты решил, что половина премии лучше целого ничего.' },
        { id: 'c', label: 'Написать в HR', icon: '📝', hint: 'риск · +справедливость',
          requires: { flag: 'lied_sick' },
          effects: { mood: +6, work: -6, exp: 1 },
          result: 'HR пообещал «разобраться» и прислал памятку о корпоративной этике.' }
      ]
    },
    {
      id: 'w_promo', icon: '📈', rarity: 'uncommon', weight: 5, minDay: 12, cooldown: 30, once: true, chain: 'career',
      title: 'Предложение повышения',
      text: 'Начальник зовёт «поговорить». В руках у него твоя же презентация.',
      require: { workAbove: 60 },
      choices: [
        { id: 'a', label: 'Согласиться', icon: '🚀', hint: '+деньги · +нагрузка',
          effects: { money: +18000, work: +12, mood: +8, energy: -12, exp: 2 },
          next: { id: 'w_burnout_risk', in: 4 },
          result: 'Ты стал «ответственным за направление». Звучит гордо, спать не даёт.' },
        { id: 'b', label: 'Просить больше', icon: '🗣️', hint: 'риск · +деньги',
          effects: { mood: +4, work: +4 },
          risk: [{ chance: 0.4, text: 'Вакансию «поставили на паузу»', effects: { mood: -10, work: -6 } },
                 { chance: 0.35, text: 'Дали больше, чем ты просил', effects: { money: +26000, mood: +10 } }],
          next: { id: 'w_burnout_risk', in: 5 },
          result: 'Ты назвал сумму и на всякий случай добавил «обсуждаемо».' },
        { id: 'c', label: 'Отказаться', icon: '🛑', hint: '−карьера · +силы',
          effects: { work: -6, mood: +6, energy: +10, family: +6 },
          result: 'Ты сказал «мне и так хорошо» и впервые за месяц выспался.' }
      ]
    },
    {
      id: 'w_burnout_risk', icon: '🕯️', rarity: 'common', weight: 8, minDay: 14, cooldown: 18, chain: 'career',
      title: 'Выгорание подкралось',
      text: 'Ты открываешь ноутбук и физически чувствуешь, как он тяжелеет.',
      require: { fatigueAbove: 25 },
      choices: [
        { id: 'a', label: 'Взять паузу', icon: '🌿', hint: '+силы · −работа',
          effects: { energy: +18, health: +8, mood: +10, work: -8, fatigue: -20 },
          result: 'Два дня без чатов. Мир не рухнул, а ты — почти ожил.' },
        { id: 'b', label: 'Дожать квартал', icon: '🔥', hint: '−силы · +работа',
          effects: { work: +14, health: -12, energy: -15, mood: -10, fatigue: +18, exp: 1 },
          result: 'Ты дожал. Квартал закрыт, ты — нет.' }
      ]
    },
    {
      id: 'w_layoff', icon: '📉', rarity: 'uncommon', weight: 4, minDay: 20, cooldown: 30, once: true, chain: 'career',
      title: 'Сокращение штата',
      text: 'В отделе новый «оптимизационный» список. Твоя фамилия — третья сверху.',
      choices: [
        { id: 'a', label: 'Забрать предложенное', icon: '📄', hint: '+деньги · −работа',
          effects: { money: +65000, work: -25, mood: -10, energy: +10, fatigue: -12, flag: 'unemployed', exp: 2 },
          result: 'Ты подписал соглашение и вышел на улицу с папкой и странной лёгкостью.' },
        { id: 'b', label: 'Торговаться за условия', icon: '⚖️', hint: 'риск · +деньги',
          effects: { mood: -4, energy: -6 },
          risk: [{ chance: 0.5, text: 'Юрист согласился не сразу, но добавил два оклада', effects: { money: +94000, mood: +10 } }],
          result: 'Ты пришёл с распечаткой Трудового кодекса. Это произвело впечатление.' },
        { id: 'c', label: 'Остаться любой ценой', icon: '😬', hint: '−мораль · +стабильность',
          effects: { mood: -12, work: +6, health: -6, flag: 'stayed_after_cut' },
          result: 'Тебя оставили. Взамен ты теперь «тот, кто остался».' }
      ]
    },
    {
      id: 'w_new_job', icon: '🧭', rarity: 'common', weight: 7, minDay: 22, cooldown: 20, chain: 'career',
      title: 'Собеседование назначено',
      text: 'Позвонили из компании, куда ты отправил резюме «на всякий случай».',
      require: { flag: 'unemployed' },
      choices: [
        { id: 'a', label: 'Пойти официально', icon: '👔', hint: '+деньги · +стабильность',
          effects: { money: +30000, work: +10, mood: +12, energy: -8, unflag: 'unemployed', exp: 2 },
          result: 'Ты вышел на новую работу с договором, а не с обещаниями.' },
        { id: 'b', label: 'Согласиться на серую', icon: '🕶️', hint: '+деньги · +риск',
          effects: { money: +24000, work: +6, mood: +6, risk: +14, unflag: 'unemployed' },
          result: '«Оформление потом». Ты согласился, потому что надо платить за машину.' },
        { id: 'c', label: 'Пока подождать', icon: '🛋️', hint: '−деньги · +силы',
          effects: { mood: +5, energy: +12, money: -4000, fatigue: -10 },
          result: 'Ты решил «немного выдохнуть». Выдох получился на две недели.' }
      ]
    },
    {
      id: 'w_budget_cut', icon: '🔻', rarity: 'common', weight: 10, minDay: 6, cooldown: 16,
      title: 'Оптимизация бюджета',
      text: 'Объявили: премий в этом квартале не будет. Никому. Даже Вале.',
      require: { workBelow: 70 },
      choices: [
        { id: 'a', label: 'Искать подработку', icon: '🔍', hint: '−силы · +деньги',
          effects: { money: +5000, energy: -14, mood: -4, fatigue: +10, gigs: +1 },
          result: 'Ты разослал десять заявок и получил два ответа «мы вам перезвоним».' },
        { id: 'b', label: 'Урезать расходы', icon: '✂️', hint: '−веселье · +деньги',
          effects: { mood: -5, money: +4000, family: +3 },
          result: 'Подписки отменены, кофе с собой — только по праздникам.' },
        { id: 'c', label: 'Просто работать', icon: '🧱', hint: '+работа · +мораль',
          effects: { work: +8, mood: +3, energy: -8 },
          result: 'Ты решил, что «спокойствие дороже», и не стал дёргаться.' }
      ]
    },
    {
      id: 'w_hours_cut', icon: '⏰', rarity: 'uncommon', weight: 6, minDay: 10, cooldown: 20,
      chain: 'cut',
      title: 'Сократили ставку',
      text: '«Рынок сложный». Тебе предложили 0,85 ставки с сохранением «всех задач».',
      choices: [
        { id: 'a', label: 'Согласиться', icon: '😐', hint: '−деньги · −нервы',
          effects: { money: -9000, mood: -10, work: +5, fatigue: +8 },
          result: 'Ты подписал допсоглашение и стал работать меньше за меньшие деньги.' },
        { id: 'b', label: 'Искать новое место', icon: '🔎', hint: '−время · +шанс',
          effects: { energy: -12, mood: -4, work: -5, exp: 1 },
          next: { id: 'w_new_job', in: 5 },
          result: 'Резюме обновлено, будильник на шесть — теперь на два фронта.' },
        { id: 'c', label: 'Уйти в отпуск за свой счёт', icon: '🏝️', hint: '−деньги · +силы',
          effects: { money: -6000, energy: +18, health: +10, mood: +8, fatigue: -20 },
          result: 'Ты взял три недели без содержания и впервые по-настоящему выспался.' }
      ]
    },
    {
      id: 'w_boss_fine', icon: '📋', rarity: 'common', weight: 9, minDay: 5, cooldown: 15,
      title: 'Штраф «по-товарищески»',
      text: 'Начальник говорит: «Тут не система, тут ты». И кладёт бумажку на 4 800.',
      choices: [
        { id: 'a', label: 'Оспорить', icon: '🧾', hint: 'риск · +принцип',
          effects: { mood: +6, work: -6, risk: +6 },
          risk: [{ chance: 0.45, text: 'Штраф «нашёл» подтверждение задним числом', effects: { money: -4800, mood: -10, work: -6 } }],
          result: 'Ты попросил показать основание и приложил заявление.' },
        { id: 'b', label: 'Заплатить молча', icon: '💸', hint: '−деньги · +тишина',
          cost: { money: 4800, category: 'other' },
          effects: { mood: -8, work: +3 },
          result: 'Ты отдал деньги и весь день считал, сколько это обедов.' },
        { id: 'c', label: 'Отработать штраф', icon: '🧹', hint: '−силы · −деньги',
          effects: { energy: -16, work: +8, mood: -3, fatigue: +10 },
          result: 'Вместо денег ты «помог с инвентаризацией» до восьми вечера.' }
      ]
    },
    {
      id: 'w_team_hat', icon: '🎩', rarity: 'rare', weight: 4, minDay: 8, cooldown: 22,
      chain: 'team',
      title: 'Интриги в коллективе',
      text: 'Тебе предложили «быть за старшего», пока Валя в отпуске. Без доплаты.',
      choices: [
        { id: 'a', label: 'Взять и показать', icon: '💪', hint: '−силы · +работа',
          effects: { work: +12, energy: -14, mood: +4, exp: 2, social: +6 },
          next: { id: 'w_shabashka', in: 3 },
          result: 'Ты вёл планёрки и подписывал то, за что не хотел отвечать.' },
        { id: 'b', label: 'Отказаться мягко', icon: '🕊️', hint: '−социум · +силы',
          effects: { social: -8, energy: +8, mood: +3 },
          result: 'Ты сказал «не потяну по времени» и остался вне всех схем.' }
      ]
    },
    {
      id: 'w_weekend_call', icon: '📞', rarity: 'common', weight: 11, minDay: 3, cooldown: 10,
      title: 'Звонок в субботу',
      text: 'Руководитель: «Тут на двадцать минут». Ты уже знаешь, что это ложь.',
      choices: [
        { id: 'a', label: 'Выехать', icon: '🚗', hint: '−выходной · +работа',
          effects: { money: +5000, work: +10, energy: -16, mood: -8, fatigue: +12 },
          result: '«Двадцать минут» превратились в семь часов и один торт.' },
        { id: 'b', label: 'Сказать «не могу»', icon: '🚫', hint: '−работа · +семья',
          effects: { work: -10, family: +10, mood: +6, energy: +8, social: -4, risk: +4 },
          result: 'Ты выключил телефон и до вечера был обычным человеком.' },
        { id: 'c', label: 'Найти замену', icon: '🔄', hint: '−деньги · +свобода',
          cost: { money: 3000, category: 'other' },
          effects: { work: +3, mood: +5, social: +5, family: +6 },
          result: 'Коллега согласился за «просто спасибо и три тысячи».' }
      ]
    },
    {
      id: 'w_razgruz', icon: '📦', rarity: 'common', weight: 10, minDay: 2, cooldown: 9,
      title: 'Шабашка на разгрузке',
      text: 'Знакомый зовёт вечером разгрузить фуру. «Работа не пыльная, только тяжёлая».',
      choices: [
        { id: 'a', label: 'Пойти', icon: '💪', hint: '+деньги · −силы',
          effects: { money: +4500, energy: -20, health: -8, mood: +5, fatigue: +14, gigs: +1 },
          result: 'Ты принёс домой деньги, запах склада и боль в спине.' },
        { id: 'b', label: 'Отказаться', icon: '🛋️', hint: '+силы · −деньги',
          effects: { energy: +10, mood: +2, family: +4 },
          result: 'Ты выбрал диван и сериал. Спина сказала спасибо.' }
      ]
    },
    {
      id: 'w_shabashka', icon: '🧰', rarity: 'uncommon', weight: 7, minDay: 3, cooldown: 12, chain: 'gig',
      title: 'Шабашка на выходные',
      text: 'Бывший коллега просит «посмотреть отчётность» за выходные. Оплата наличными.',
      choices: [
        { id: 'a', label: 'Взять заказ', icon: '🖥️', hint: '−силы · +деньги',
          effects: { money: +9000, energy: -18, mood: +4, fatigue: +12, gigs: +1, exp: 1 },
          next: { id: 'w_gig_second', in: 4 },
          result: 'Ты сделал всё за субботу и получил перевод без комментариев.' },
        { id: 'b', label: 'Назвать двойную цену', icon: '💰', hint: 'риск · +деньги',
          effects: { mood: +2, social: -3 },
          risk: [{ chance: 0.5, text: 'Клиент согласился, но теперь ждёт вдвое больше', effects: { money: +18000, energy: -22, work: -6 } }],
          next: { id: 'w_gig_second', in: 5 },
          result: 'Ты назвал сумму и добавил: «сроки короткие, сами понимаете».' }
      ]
    },
    {
      id: 'w_gig_second', icon: '📨', rarity: 'common', weight: 1, queued: true, chain: 'gig',
      title: 'Постоянный клиент',
      text: 'Тот же заказчик пишет: «а можно ещё? и теперь срочно».',
      choices: [
        { id: 'a', label: 'Взять ещё', icon: '🔁', hint: '−силы · +деньги',
          effects: { money: +12000, energy: -20, fatigue: +14, gigs: +1, mood: +5 },
          result: 'Ты стал «своим человеком» с ноутбуком и без выходных.' },
        { id: 'b', label: 'Передать знакомому', icon: '🤝', hint: '+социум · +силы',
          effects: { social: +8, energy: +10, mood: +4, money: +2000 },
          result: 'Ты отдал заказ другу и получил «проценты» и благодарность.' },
        { id: 'c', label: 'Отказаться от потока', icon: '⛔️', hint: '+силы · −деньги',
          effects: { energy: +14, mood: +6, family: +5, work: +4 },
          result: 'Ты сказал «в этот раз без меня» и провёл вечер с семьёй.' }
      ]
    },
    {
      id: 'w_defect', icon: '🧾', rarity: 'common', weight: 8, minDay: 5, cooldown: 14, chain: 'gig',
      title: 'Брак в работе',
      text: 'Клиент пишет: «тут не то». И прикладывает скриншот твоего же файла.',
      choices: [
        { id: 'a', label: 'Переделать бесплатно', icon: '🛠️', hint: '−силы · +репутация',
          effects: { energy: -12, mood: -6, social: +6, exp: 1 },
          result: 'Ты переделал за вечер и сохранил клиента.' },
        { id: 'b', label: 'Объяснить, что так и надо', icon: '🧐', hint: 'риск · +время',
          effects: { mood: +2, social: -4 },
          risk: [{ chance: 0.45, text: 'Клиент ушёл и забрал предоплату', effects: { money: -4000, mood: -10 } }],
          result: 'Ты написал длинное сообщение с терминами и надеждой.' }
      ]
    },
    {
      id: 'w_courier', icon: '🛵', rarity: 'common', weight: 11, minDay: 2, cooldown: 8,
      title: 'Вечер в доставке',
      text: 'Приложение пишет: «высокий спрос, повышенный тариф». Ты уже надеваешь куртку.',
      choices: [
        { id: 'a', label: 'Три часа по району', icon: '📍', hint: '+деньги · +риск',
          effects: { money: +3200, energy: -16, fatigue: +12, health: -4, gigs: +1, carCondition: -6 },
          risk: [{ chance: 0.35, text: 'Во дворе поймал бордюр и лакированный столбик', effects: { carCondition: -14, money: -1500, mood: -8 } }],
          result: 'Ты развёз четырнадцать заказов и один раз попал под дождь.' },
        { id: 'b', label: 'Только до полуночи', icon: '🌙', hint: '+деньги · +сон',
          effects: { money: +1400, energy: -8, fatigue: +6, gigs: +1 },
          result: 'Ты отработал два часа и уехал домой, пока район не начал пить.' },
        { id: 'c', label: 'Взять паузу', icon: '🛑', hint: '+силы · −деньги',
          effects: { energy: +12, mood: +5, family: +4 },
          result: 'Ты закрыл приложение и посмотрел сериал про таких же курьеров.' }
      ]
    },
    {
      id: 'w_sell_thing', icon: '📦', rarity: 'common', weight: 10, minDay: 3, cooldown: 11,
      title: 'Объявления на «Авито»',
      text: 'Ты нашёл дома то, чем «точно не пользуешься». Три вещи и надежда.',
      choices: [
        { id: 'a', label: 'Продавать не торгуясь', icon: '🏷️', hint: '+деньги · −вещи',
          effects: { money: +8500, mood: +5, family: -3 },
          result: 'Первые покупатели приехали вечером и уехали с твоим барахлом.' },
        { id: 'b', label: 'Ждать свою цену', icon: '⌛️', hint: '−время · +деньги',
          effects: { money: +11000, energy: -8, mood: -4, fatigue: +6 },
          result: 'Через две недели ты продал дороже, но переписок было сорок.' },
        { id: 'c', label: 'Отдать нуждающимся', icon: '❤️', hint: '−деньги · +душа',
          effects: { money: 0, mood: +10, social: +6, charity: +1 },
          result: 'Ты отдал вещи в хорошие руки и почувствовал себя человеком.' }
      ]
    },
    {
      id: 'w_found_money', icon: '💵', rarity: 'rare', weight: 5, minDay: 5, cooldown: 21,
      title: 'В кофте нашлись деньги',
      text: 'В кармане зимней куртки — конверт. На конверте написано «на квартплату».',
      choices: [
        { id: 'a', label: 'Оставить себе', icon: '🫣', hint: '+деньги · −семья',
          effects: { money: +12500, mood: -5, family: -6 },
          result: 'Ты не стал уточнять, зачем и когда ты это спрятал.' },
        { id: 'b', label: 'Отнести в общий конверт', icon: '🏠', hint: '+семья · +спокойствие',
          effects: { family: +10, mood: +6, money: +4000 },
          result: 'Дома сказали «вот это по-нашему» и накормили ужином.' }
      ]
    },
    {
      id: 'w_debt_friend', icon: '🤝', rarity: 'uncommon', weight: 7, minDay: 6, cooldown: 15,
      title: 'Долг другу',
      text: 'Ты вспомнил, что «на неделю» занимал у Димы тридцать тысяч. Прошло восемь месяцев.',
      choices: [
        { id: 'a', label: 'Вернуть всё', icon: '✅', hint: '−деньги · +дружба',
          requires: { money: 30000 },
          cost: { money: 30000, category: 'other' },
          effects: { social: +12, mood: +8, family: +4 },
          result: 'Дима написал «спасибо, брат» и впервые за год они встретились.' },
        { id: 'b', label: 'Вернуть часть и попросить время', icon: '📆', hint: '−деньги · −репутация',
          cost: { money: 10000, category: 'other' },
          effects: { social: -4, mood: -3, debts: +1 },
          result: 'Ты отдал десятку и пообещал «с зарплаты закрыть».' },
        { id: 'c', label: 'Пока промолчать', icon: '🤐', hint: '+деньги · −социум',
          effects: { social: -10, mood: -8, family: -4 },
          result: 'Ты начал избегать звонков и общих встреч.' }
      ]
    },
    {
      id: 'w_micro', icon: '📱', rarity: 'rare', weight: 3, minDay: 15, cooldown: 26,
      chain: 'credit',
      title: 'Микрозайм за пять минут',
      text: 'Реклама в телефоне: «до зарплаты, без справок, деньги сразу».',
      require: { moneyBelow: 15000 },
      choices: [
        { id: 'a', label: 'Взять 20 000', icon: '💳', hint: '+деньги · +долг',
          effects: { money: +20000, creditAdd: 27000, mood: +6, debts: +1, risk: +8 },
          next: { id: 'w_collector', in: 7 },
          result: 'Деньги пришли на карту через семь минут. Это было слишком легко.' },
        { id: 'b', label: 'Взять 5 000', icon: '🔹', hint: '+деньги · +долг',
          effects: { money: +5000, creditAdd: 7500, mood: +2, debts: +1, risk: +5 },
          next: { id: 'w_credit_load', in: 9 },
          result: 'Ты взял «немного» и пообещал себе вернуть в пятницу.' },
        { id: 'c', label: 'Удалить приложение', icon: '🗑️', hint: '+спокойствие · −деньги',
          effects: { mood: -5, family: +3, money: -2000 },
          result: 'Ты удалил приложение и пошёл считать остатки в кошельке.' }
      ]
    },
    {
      id: 'w_car_credit', icon: '🚗', rarity: 'uncommon', weight: 5, minDay: 12, cooldown: 30, once: true, chain: 'car',
      title: 'Кредит за машину',
      text: 'Ты стоишь в салоне. Менеджер уже печатает договор и улыбается цифре 42 000.',
      choices: [
        { id: 'a', label: 'Взять кредит', icon: '✍️', hint: '+машина · +долг',
          requires: { car: false },
          effects: { money: -20000, creditAdd: 420000, mood: +12, carCondition: +35, fatigue: -10, debts: +1, risk: +10 },
          next: { id: 'w_car_pay', in: 4 },
          result: 'Ты уехал на своей машине и с ощущением, что подписал что-то важное.' },
        { id: 'b', label: 'Копить самостоятельно', icon: '🐖', hint: '−время · +деньги',
          effects: { mood: -6, money: +3000, family: +5, exp: 1 },
          result: 'Ты вышел из салона пешком и с твёрдым планом на два года.' },
        { id: 'c', label: 'Взять б/у без кредита', icon: '🔧', hint: '−деньги · +машина',
          requires: { money: 280000 },
          cost: { money: 260000, category: 'car' },
          effects: { carCondition: +18, mood: +10, fatigue: -8, risk: +4 },
          result: 'Ты купил честные «двенадцать лет, один хозяин» и был счастлив.' }
      ]
    },
    {
      id: 'w_car_pay', icon: '💳', rarity: 'common', weight: 1, queued: true, chain: 'car',
      title: 'Платёж по автокредиту',
      text: 'Напоминание: 9 800 ₽ должны списаться в течение трёх дней.',
      choices: [
        { id: 'a', label: 'Оплатить вовремя', icon: '🕐', hint: '−деньги · −долг',
          effects: { money: -9800, creditPay: 9800, mood: +5, family: +4 },
          result: 'Платёж прошёл, банк прислал «спасибо, что с нами».' },
        { id: 'b', label: 'Закрыть частично', icon: '➗', hint: '−деньги · +долг',
          effects: { money: -5000, creditPay: 5000, creditAdd: 3000, mood: -6, fatigue: +5 },
          result: 'Ты заплатил сколько смог и получил письмо про «техническую задолженность».' },
        { id: 'c', label: 'Отложить на неделю', icon: '😰', hint: '+деньги · +риск',
          effects: { mood: -10, risk: +10, creditAdd: 4000, fatigue: +8 },
          result: 'Ты перенёс платёж и весь месяц ждал неприятного звонка.' }
      ]
    },
    {
      id: 'w_car_payoff', icon: '🎉', rarity: 'uncommon', weight: 4, minDay: 10, cooldown: 30, once: true, chain: 'car',
      title: 'Кредит закрывается',
      text: 'В приложении осталось 46 000 ₽. Банк предлагает «закрыть досрочно и красиво».',
      require: { credit: true },
      choices: [
        { id: 'a', label: 'Закрыть досрочно', icon: '🏁', hint: '−деньги · −долг',
          requires: { money: 46000 },
          cost: { money: 46000, category: 'credit' },
          effects: { creditPay: 60000, mood: +18, family: +12, health: +5, fatigue: -15, exp: 2 },
          result: 'Ты закрыл кредит и полночи перечитывал смс «задолженность 0 ₽».' },
        { id: 'b', label: 'Оставить как есть', icon: '📅', hint: '+деньги · +долг',
          effects: { money: -9800, creditPay: 9800, mood: -3, family: +3 },
          result: 'Ты решил не трогать график и заплатил как обычно.' }
      ]
    },
    {
      id: 'w_car_trouble', icon: '🔧', rarity: 'common', weight: 9, minDay: 4, cooldown: 13,
      title: 'Машина захотела денег',
      text: 'На сервисе сказали: «ездить можно, но недолго». И показали смету.',
      require: { car: true },
      choices: [
        { id: 'a', label: 'Сделать по-хорошему', icon: '🧰', hint: '−деньги · +машина',
          requires: { money: 24000 },
          cost: { money: 24000, category: 'car' },
          effects: { carCondition: +28, mood: -6, family: -4, repairs: +1, exp: 1 },
          result: 'Машина поехала тихо. Ты — тихо и без денег.' },
        { id: 'b', label: 'Потом починим', icon: '🙈', hint: '+деньги · +риск',
          effects: { money: +2000, carCondition: -10, risk: +8, mood: -4 },
          risk: [{ chance: 0.4, text: 'Через два дня машина встала на кольцевой', effects: { carCondition: -20, money: -9000, mood: -12 } }],
          result: 'Ты решил, что «гремит, но едет» — это тоже характеристика.' },
        { id: 'c', label: 'Спросить у знакомого мастера', icon: '☎️', hint: '−социум · +деньги',
          effects: { social: -4, carCondition: +12, money: -6000, repairs: +1 },
          result: 'Мастер взял по-божески, но теперь ты должен ему услугу.' }
      ]
    },
    {
      id: 'w_tax', icon: '🧮', rarity: 'uncommon', weight: 7, minDay: 14, cooldown: 29, once: true,
      title: 'Письмо из налоговой',
      text: 'В личном кабинете висит начисление на 18 400 ₽ и срок «до вчера».',
      choices: [
        { id: 'a', label: 'Заплатить самому', icon: '💸', hint: '−деньги · −нервы',
          requires: { money: 18400 },
          cost: { money: 18400, category: 'other' },
          effects: { mood: +8, family: +5, exp: 1 },
          result: 'Ты оплатил и получил квитанцию, которую сохранил на всякий случай.' },
        { id: 'b', label: 'Пусть вычитают', icon: '🏦', hint: '−деньги · +пени',
          effects: { money: -20000, creditAdd: 1500, mood: -6, fatigue: +6 },
          result: 'Деньги ушли автоматически, вместе с небольшой пенёй «за компанию».' },
        { id: 'c', label: 'Игнорировать письмо', icon: '🚮', hint: '+деньги · +риск',
          effects: { mood: -8, risk: +12, creditAdd: 3000 },
          result: 'Ты закрыл письмо и постарался про него не думать.' }
      ]
    },
    {
      id: 'w_self', icon: '🧑‍💻', rarity: 'uncommon', weight: 6, minDay: 10, cooldown: 24, chain: 'self',
      title: 'Левый заказчик',
      text: 'Тебе предлагают постоянные заказы, но «без всяких там договоров».',
      choices: [
        { id: 'a', label: 'Оформить самозанятость', icon: '📗', hint: '−время · +свобода',
          effects: { money: +7000, mood: +8, work: +5, exp: 2, risk: -6, flag: 'self_employed' },
          next: { id: 'w_gig_second', in: 4 },
          result: 'Ты зарегистрировался за вечер и получил статус «самозанятый».' },
        { id: 'b', label: 'Работать в серую', icon: '🕶️', hint: '+деньги · +риск',
          effects: { money: +11000, risk: +12, mood: +4, fatigue: +8, gigs: +1 },
          result: 'Деньги на карту, договор в голове, отчётности нет.' },
        { id: 'c', label: 'Отказаться от схем', icon: '🚪', hint: '−деньги · +спокойствие',
          effects: { mood: +3, money: -1000, family: +3 },
          result: 'Ты сказал «давайте официально» и клиент пропал.' }
      ]
    },
    {
      id: 'w_courses', icon: '🎓', rarity: 'common', weight: 8, minDay: 4, cooldown: 17,
      title: 'Курсы «для роста»',
      text: 'Реклама обещает «новую профессию за 3 месяца» и зарплату «от 150 000».',
      choices: [
        { id: 'a', label: 'Купить курс', icon: '💳', hint: '−деньги · +опыт',
          requires: { money: 32000 },
          cost: { money: 32000, category: 'other' },
          effects: { exp: 3, mood: +10, work: +8, energy: -10, fatigue: +6 },
          result: 'Ты купил курс и посмотрел первые четыре урока из девяноста.' },
        { id: 'b', label: 'Найти бесплатное', icon: '🔎', hint: '−время · +опыт',
          effects: { exp: 2, energy: -8, mood: +5, work: +4 },
          result: 'Ты собрал программу сам из лекций, статей и чужих конспектов.' },
        { id: 'c', label: 'Отложить на потом', icon: '📥', hint: '+деньги · +силы',
          effects: { mood: +3, energy: +6, money: +2000 },
          result: 'Ты сохранил в закладки. Закладок стало на одну больше.' }
      ]
    },
    {
      id: 'w_second_job', icon: '🌃', rarity: 'uncommon', weight: 6, minDay: 8, cooldown: 19,
      title: 'Вторая работа',
      text: 'Знакомый предлагает вечерние смены на складе: «три часа, каждый день, стабильно».',
      require: { moneyBelow: 40000 },
      choices: [
        { id: 'a', label: 'Взять и терпеть', icon: '💪', hint: '+деньги · −силы',
          effects: { money: +26000, energy: -25, health: -12, mood: -6, fatigue: +18, work: -6, gigs: +2, exp: 1 },
          result: 'Ты работаешь на двух работах и спишь в метро стоя.' },
        { id: 'b', label: 'Взять на две недели', icon: '⏱️', hint: '+деньги · +сон',
          effects: { money: +12000, energy: -14, fatigue: +10, gigs: +1, mood: +3 },
          result: 'Ты отработал две недели и ушёл, пока не привык.' },
        { id: 'c', label: 'Отказаться', icon: '🛌', hint: '+силы · −деньги',
          effects: { energy: +14, health: +8, mood: +8, family: +6, money: -2000 },
          result: 'Ты выбрал одну работу и нормальный сон. Пока что.' }
      ]
    },
    {
      id: 'w_vacation_own', icon: '🏖️', rarity: 'common', weight: 6, minDay: 5, cooldown: 20,
      title: 'Отпуск за свой счёт',
      text: 'Начальник: «Возьми без содержания, если так надо». Отпускные при этом — ноль.',
      choices: [
        { id: 'a', label: 'Взять две недели', icon: '🌴', hint: '−деньги · +силы',
          cost: { money: 14000, category: 'fun' },
          effects: { health: +14, energy: +20, mood: +14, fatigue: -22, work: -8, family: +8 },
          result: 'Ты уехал к родителям и впервые за год не смотрел рабочий чат.' },
        { id: 'b', label: 'Взять три дня', icon: '🗓️', hint: '−деньги · +силы',
          cost: { money: 4000, category: 'fun' },
          effects: { energy: +12, mood: +8, health: +5, fatigue: -10, family: +4 },
          result: 'Короткий отдых — как чай вприкуску: мало, но вкусно.' },
        { id: 'c', label: 'Не брать', icon: '🧱', hint: '+деньги · −силы',
          effects: { money: +3000, fatigue: +12, mood: -8, health: -6 },
          result: 'Ты отработал всё лето и получил премию «за отсутствие отпуска».' }
      ]
    },
    {
      id: 'w_child', icon: '👶', rarity: 'rare', weight: 3, minDay: 12, cooldown: 30, once: true, chain: 'family',
      title: 'Пополнение в семье',
      text: 'Две полоски. Ты сидишь на кухне и почему-то считаешь деньги за год вперёд.',
      choices: [
        { id: 'a', label: 'Готовиться основательно', icon: '🛒', hint: '−деньги · +семья',
          requires: { money: 45000 },
          cost: { money: 45000, category: 'home' },
          effects: { family: +25, mood: +18, health: -8, fatigue: +15, exp: 3 },
          next: { id: 'w_payday', in: 5 },
          result: 'Кроватка, коляска, три пакета «мелочей» — и это только начало.' },
        { id: 'b', label: 'Принять и жить дальше', icon: '❤️', hint: '+семья · +нагрузка',
          effects: { family: +18, mood: +12, energy: -14, money: -6000, fatigue: +10 },
          next: { id: 'w_payday', in: 6 },
          result: 'Ты обнял жену и решил, что прорвётесь. Все прорываются.' },
        { id: 'c', label: 'Сразу искать подработку', icon: '💼', hint: '−силы · +деньги',
          effects: { money: +9000, family: +8, energy: -20, fatigue: +16, gigs: +1, mood: +4 },
          result: 'Ты подписался на две подработки и стал чаще видеть рассвет.' }
      ]
    },
    {
      id: 'w_sick_leave', icon: '🤒', rarity: 'uncommon', weight: 8, minDay: 3, cooldown: 15,
      title: 'Больничный',
      text: 'Температура 38, а в графике — планёрка и три задачи «на сегодня».',
      choices: [
        { id: 'a', label: 'Лечиться дома', icon: '🛌', hint: '−деньги · +здоровье',
          effects: { health: +18, energy: +14, mood: +8, money: -5000, work: -8, fatigue: -12 },
          result: 'Ты закрыл ноутбук и пролежал два дня, как человек.' },
        { id: 'b', label: 'Работать «на удалёнке»', icon: '💻', hint: '+деньги · −здоровье',
          effects: { money: +6000, work: +5, health: -14, energy: -10, fatigue: +12, mood: -8 },
          result: 'Ты отвечал в чатах с градусником под мышкой.' },
        { id: 'c', label: 'Попросить коллег подстраховать', icon: '🤝', hint: '−социум · +здоровье',
          effects: { family: +4, energy: +12, health: +10, social: -6, work: -4 },
          result: 'Коллеги сказали «выздоравливай», но запомнили. Ты тоже запомнил.' }
      ]
    },
    {
      id: 'w_gray_income', icon: '🕶️', rarity: 'rare', weight: 4, minDay: 12, cooldown: 25,
      chain: 'gray',
      title: 'Подработка «мимо кассы»',
      text: 'Знакомый предлагает расплатиться наличными со скидкой. «Никто не узнает».',
      choices: [
        { id: 'a', label: 'Взять наличными и молчать', icon: '🤫', hint: '+деньги · +риск',
          effects: { money: +24000, risk: +14, mood: +6, fatigue: +6 },
          risk: [{ chance: 0.4, text: 'Заказчик «забыл» про вторую половину суммы', effects: { money: -6000, mood: -10 } }],
          result: 'Ты взял наличные и в тот же день положил их в банкомат с осторожностью.' },
        { id: 'b', label: 'Только официально', icon: '📄', hint: '−деньги · +спокойствие',
          effects: { money: +12000, work: +6, mood: +8, risk: -8, exp: 1 },
          result: 'Ты попросил договор и перевод. Заказчик поворчал, но согласился.' },
        { id: 'c', label: 'Отказаться вовсе', icon: '🙅', hint: '−деньги · +нервы',
          effects: { mood: +4, money: -1500, family: +4, energy: +6 },
          result: 'Ты сказал «не хочу потом объясняться» и остался при своих.' }
      ]
    },
    {
      id: 'w_overtime', icon: '🌙', rarity: 'rare', weight: 5, minDay: 5, cooldown: 18,
      title: 'Сверхурочные с оплатой',
      text: 'Начальник предлагает подменить смену в ночь: «по двойному тарифу, честно».',
      choices: [
        { id: 'a', label: 'Взять ночь', icon: '🌃', hint: '+деньги · −силы',
          effects: { money: +16000, energy: -22, health: -10, mood: -6, fatigue: +18, work: +10, gigs: +1 },
          result: 'Ты отработал ночь и утром сдал смену, как в кино про врачей.' },
        { id: 'b', label: 'Взять половину', icon: '🕐', hint: '+деньги · +сон',
          effects: { money: +8000, energy: -10, fatigue: +8, work: +5, mood: +2 },
          result: 'Ты отработал до двух и уехал домой спать по-человечески.' },
        { id: 'c', label: 'Отказаться', icon: '🛑', hint: '+силы · −деньги',
          effects: { energy: +12, health: +8, mood: +8, work: -4, family: +5 },
          result: 'Ты сказал «не сегодня» и впервые нормально поужинал дома.' }
      ]
    },
    {
      id: 'w_colleague_loan', icon: '🫱', rarity: 'uncommon', weight: 7, minDay: 6, cooldown: 16,
      title: 'Стрельнуть до зарплаты',
      text: 'Ты стоишь у кофейни и понимаешь, что на обед не хватает трёхсот рублей.',
      choices: [
        { id: 'a', label: 'Попросить у коллеги', icon: '🙏', hint: '+деньги · −социум',
          effects: { money: +3000, social: -6, mood: -3, debts: +1 },
          result: 'Коллега перевёл без вопросов, но теперь вы оба это помните.' },
        { id: 'b', label: 'Дотянуть на своём', icon: '🍞', hint: '−мораль · +гордость',
          effects: { health: -6, mood: -6, energy: -6, family: +3 },
          result: 'Ты пообедал тем, что нашлось в сумке. Гордость дороже.' },
        { id: 'c', label: 'Обед в долг в столовой', icon: '🍲', hint: '+деньги · +долг',
          effects: { money: +800, mood: +4, debts: +1, social: +2 },
          result: 'Тётя Зина записала тебя в тетрадочку. Ты — в списке.' }
      ]
    },
    {
      id: 'w_advance', icon: '🏧', rarity: 'common', weight: 9, minDay: 3, cooldown: 12,
      title: 'Просьба об авансе',
      text: 'До зарплаты двенадцать дней, а деньги кончились ещё вчера.',
      require: { moneyBelow: 8000 },
      choices: [
        { id: 'a', label: 'Попросить аванс', icon: '📝', hint: '+деньги · +разговор',
          effects: { money: +12000, work: -6, mood: -4, social: -4, family: +5 },
          result: 'Аванс дали под расписку и под взгляд бухгалтера.' },
        { id: 'b', label: 'Пережить на запасах', icon: '🥫', hint: '−мораль · +независимость',
          effects: { health: -8, mood: -8, money: +2500, energy: -8, family: +4 },
          result: 'Ты открыл банку «на всякий случай» и вспомнил про крупы.' },
        { id: 'c', label: 'Занять у родителей', icon: '☎️', hint: '+деньги · −гордость',
          effects: { money: +10000, family: +8, mood: -5, debts: +1 },
          result: 'Мама перевела сразу и ещё спросила, точно ли ты поел.' }
      ]
    },
    {
      id: 'w_sell_car', icon: '🚙', rarity: 'rare', weight: 4, minDay: 15, cooldown: 30,
      chain: 'car',
      title: 'Продать машину?',
      text: 'Покупатель предлагает наличные сегодня. Ты уже посчитал, что это закроет кредит.',
      require: { credit: true },
      choices: [
        { id: 'a', label: 'Продать и закрыть долг', icon: '🤝', hint: '+свобода · −машина',
          requires: { carCondAbove: 45 },
          effects: { money: +150000, creditPay: 120000, carGone: true, mood: -8, family: +10, health: +6, fatigue: -18, exp: 3 },
          result: 'Ты отдал ключи, погасил кредит и поехал домой на автобусе — свободным.' },
        { id: 'b', label: 'Оставить машину', icon: '🔑', hint: '+машина · +долг',
          effects: { mood: +6, family: -3, carCondition: +4 },
          result: 'Ты отказал покупателю и сам не понял, почему стало легче.' },
        { id: 'c', label: 'Продать дороже и без торга', icon: '📈', hint: 'риск · +деньги',
          effects: { energy: -10, mood: -4, fatigue: +6 },
          risk: [{ chance: 0.5, text: 'Покупатель нашёлся через месяц и дал больше', effects: { money: +175000, creditPay: 120000, carGone: true, mood: +10 } }],
          result: 'Ты поднял цену и стал ждать «своего» покупателя.' }
      ]
    },
    {
      id: 'w_weekend_shift', icon: '🗓️', rarity: 'common', weight: 8, minDay: 4, cooldown: 14,
      title: 'Работа в выходные',
      text: 'В графике появилась суббота. Формулировка: «добровольно-обязательно».',
      require: { workBelow: 65 },
      choices: [
        { id: 'a', label: 'Выйти и отработать', icon: '🛠️', hint: '+деньги · −выходной',
          effects: { money: +7000, work: +10, energy: -18, mood: -8, fatigue: +14, family: -6, exp: 1 },
          result: 'Ты вышел в субботу и в понедельник был уже никакой.' },
        { id: 'b', label: 'Сослаться на планы', icon: '🎭', hint: '−работа · +семья',
          effects: { work: -8, family: +10, mood: +6, energy: +8, social: -3, risk: +5 },
          result: 'Планы были. Правда, придуманы в четверг вечером.' },
        { id: 'c', label: 'Отработать половину дня', icon: '⚖️', hint: '+деньги · −силы',
          effects: { money: +3500, work: +5, energy: -9, mood: -3, fatigue: +7 },
          result: 'Ты приехал к десяти и уехал в два, сказав «всё, что мог».' }
      ]
    },
    {
      id: 'w_credit_load', icon: '🏦', rarity: 'uncommon', weight: 6, minDay: 8, cooldown: 22,
      title: 'Кредитная нагрузка',
      text: 'Банк предлагает «рефинансирование под низкий процент». Мелким шрифтом — на пять лет.',
      require: { credit: true },
      choices: [
        { id: 'a', label: 'Согласиться на рефинанс', icon: '🔁', hint: '+свобода · +срок',
          effects: { creditAdd: 60000, money: +40000, mood: +8, creditPay: 25000, fatigue: -6, risk: +6, debts: +1 },
          result: 'Платёж стал меньше, а срок — длиннее. Ты выбрал дышать сейчас.' },
        { id: 'b', label: 'Отказаться и платить как есть', icon: '🧱', hint: '−деньги · −долг',
          effects: { money: -9800, creditPay: 9800, mood: -4, family: +4 },
          result: 'Ты заплатил по графику и решил не умножать сущности.' },
        { id: 'c', label: 'Спросить у знающего', icon: '📞', hint: '−время · +ясность',
          effects: { exp: 1, energy: -6, mood: +4, risk: -6 },
          result: 'Друг-экономист нашёл в договоре страховку на 19 000. Ты её вычеркнул.' }
      ]
    },
    {
      id: 'w_part_time', icon: '🕰️', rarity: 'common', weight: 7, minDay: 6, cooldown: 16,
      title: 'Подработка по вечерам',
      text: 'Кофейня у дома ищет человека «на четыре часа, пять дней в неделю».',
      choices: [
        { id: 'a', label: 'Взять смены', icon: '☕️', hint: '+деньги · −силы',
          effects: { money: +19000, energy: -22, fatigue: +16, social: +6, health: -8, gigs: +2, mood: +3 },
          result: 'Ты варишь кофе по вечерам и знаешь всех собак своего района.' },
        { id: 'b', label: 'Только выходные', icon: '📅', hint: '+деньги · −выходные',
          effects: { money: +8000, energy: -12, fatigue: +10, gigs: +1, social: +4, family: -4 },
          result: 'Суббота и воскресенье ушли в работу, зато деньги появились.' },
        { id: 'c', label: 'Отказаться', icon: '🛋️', hint: '+силы · −деньги',
          effects: { energy: +12, mood: +6, family: +5 },
          result: 'Ты решил, что вечер — это тоже часть жизни.' }
      ]
    },
    {
      id: 'w_side_hustle', icon: '🧃', rarity: 'common', weight: 8, minDay: 5, cooldown: 15,
      title: 'Подработка на районе',
      text: 'Сосед предлагает по выходным собирать заказы в пункте выдачи. «Работа простая».',
      choices: [
        { id: 'a', label: 'Попробовать день', icon: '📦', hint: '+деньги · −силы',
          effects: { money: +2800, energy: -12, social: +5, fatigue: +8, gigs: +1 },
          result: 'Ты выдал сорок посылок и запомнил, как выглядит отчаяние курьеров.' },
        { id: 'b', label: 'Договориться на постоянку', icon: '📈', hint: '+деньги · +нагрузка',
          effects: { money: +11000, energy: -18, fatigue: +14, gigs: +2, work: -4, mood: +4 },
          result: 'Ты стал «своим» в пункте выдачи и получил график на месяц.' },
        { id: 'c', label: 'Отказаться вежливо', icon: '🎩', hint: '+силы · −деньги',
          effects: { energy: +8, mood: +5, social: +2, family: +4 },
          result: 'Ты сказал «давай в другой раз» и сосед не обиделся.' }
      ]
    },
    {
      id: 'w_ex_colleague', icon: '💡', rarity: 'uncommon', weight: 5, minDay: 14, cooldown: 25, chain: 'career',
      title: 'Звонок бывшего коллеги',
      text: '«Есть тема, приходи, обсудим». Он зовёт в стартап с «долей и перспективой».',
      require: { flag: 'unemployed' },
      choices: [
        { id: 'a', label: 'Пойти в стартап', icon: '🚀', hint: '+шанс · +риск',
          effects: { money: +20000, work: +10, mood: +14, energy: -12, exp: 3, risk: +12, unflag: 'unemployed' },
          result: 'Ты стал четвёртым человеком в компании без офиса и с большими планами.' },
        { id: 'b', label: 'Попросить время подумать', icon: '🤔', hint: '+ясность · −время',
          effects: { mood: +3, exp: 1, energy: -4 },
          result: 'Ты попросил неделю и всю неделю гуглил «как живут стартапы».' },
        { id: 'c', label: 'Отказаться и искать надёжное', icon: '🛡️', hint: '−шанс · +стабильность',
          effects: { mood: -3, work: +4, family: +5, money: +3000 },
          result: 'Ты выбрал белую зарплату и понятный график. Пока что.' }
      ]
    },
    {
      id: 'w_gig_delivery', icon: '📮', rarity: 'common', weight: 10, minDay: 2, cooldown: 10,
      title: 'Курьер на один день',
      text: 'Знакомый просит подменить его и развезти посылки по району. Оплата в конце дня.',
      choices: [
        { id: 'a', label: 'Поработать день', icon: '🚲', hint: '+деньги · −силы',
          effects: { money: +5000, energy: -18, health: -6, fatigue: +14, gigs: +1, mood: +4, carCondition: -4 },
          result: 'Ты развёз двадцать восемь адресов и один раз перепутал подъезд.' },
        { id: 'b', label: 'Только утро', icon: '🌤️', hint: '+деньги · +время',
          effects: { money: +2300, energy: -8, fatigue: +6, gigs: +1, family: +4 },
          result: 'Ты отработал до обеда и успел на футбол сына.' },
        { id: 'c', label: 'Отказаться', icon: '🙅', hint: '+силы · −деньги',
          effects: { energy: +8, mood: +4, social: -2 },
          result: 'Ты объяснил, что «сегодня никак», и это была чистая правда.' }
      ]
    },
    {
      id: 'w_storage_night', icon: '🌌', rarity: 'uncommon', weight: 6, minDay: 8, cooldown: 20,
      title: 'Ночная смена на складе',
      text: 'Смена с двух до шести, ставка двойная, но нужно быть «как штык».',
      choices: [
        { id: 'a', label: 'Взять смену', icon: '🕑', hint: '+деньги · −сон',
          effects: { money: +14000, energy: -24, health: -10, fatigue: +20, mood: -4, gigs: +1, work: -6 },
          result: 'Ты отработал ночь и весь следующий день был как в тумане.' },
        { id: 'b', label: 'Взять раз в неделю', icon: '📆', hint: '+деньги · −ритм',
          effects: { money: +6000, energy: -12, fatigue: +10, health: -4, gigs: +1 },
          result: 'Одна ночь в неделю — терпимо. Так ты себя и уговорил.' },
        { id: 'c', label: 'Отказаться и выспаться', icon: '😴', hint: '+силы · +здоровье',
          effects: { energy: +14, health: +10, mood: +8, fatigue: -14, money: -1500 },
          result: 'Ты выбрал сон и утром чувствовал себя человеком, а не овощем.' }
      ]
    },
    {
      id: 'w_second_income', icon: '🧾', rarity: 'common', weight: 8, minDay: 4, cooldown: 14,
      title: 'Мелкие подработки',
      text: 'В чате района просят помочь: то перевезти диван, то настроить ноутбук.',
      choices: [
        { id: 'a', label: 'Брать всё подряд', icon: '🧰', hint: '+деньги · −силы',
          effects: { money: +9000, energy: -18, social: +8, fatigue: +14, gigs: +2, mood: +4 },
          result: 'Ты стал районным мастером на все руки и уже не помнишь тихих вечеров.' },
        { id: 'b', label: 'Выбрать одно направление', icon: '🎯', hint: '+деньги · +фокус',
          effects: { money: +6000, work: +4, exp: 1, energy: -8, gigs: +1, social: +3 },
          result: 'Ты решил чинить только ноутбуки и стал в этом заметно лучше.' },
        { id: 'c', label: 'Помогать бесплатно', icon: '🤗', hint: '−деньги · +социум',
          effects: { money: -1000, social: +12, mood: +10, family: +4, charity: +1, energy: -10 },
          result: 'Ты помог соседям даром и получил банку варенья и уважение двора.' }
      ]
    },

    /* MARK */

  ]);
})();
