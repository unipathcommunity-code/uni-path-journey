export type Lang = "uz" | "ru" | "en"

export const languages: { code: Lang; label: string; short: string }[] = [
  { code: "uz", label: "O'zbekcha", short: "UZ" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "en", label: "English", short: "EN" },
]

export type Translation = (typeof translations)["en"]

export const translations = {
  en: {
    nav: {
      links: [
        { id: "core", label: "Solutions" },
        { id: "features", label: "Features" },
        { id: "pricing", label: "Pricing" },
        { id: "testimonials", label: "Testimonials" },
      ],
      login: "Sign In",
      getStarted: "Get Started",
    },
    hero: {
      badge: "Multi-Tenant SaaS Platform for Any Business",
      title: "Precision SaaS, Designed to Elevate Your Business Workflow",
      description:
        "A unified system of intelligent components that analyze, organize, and automate your workflow, CRM, finance, and branches.",
      cta: "Experience the Platform",
      painLine: "Tired of stitching together Excel sheets and scattered apps? Bring CRM, finance, attendance and branches into one system.",
      metrics: [
        { title: "Smart CRM", desc: "Track leads and clients automatically." },
        { title: "Effortless Accounting", desc: "Real-time P&L and multi-branch finance." },
        { title: "AI Integrations", desc: "Telegram bot and AI camera attendance." },
      ],
    },
    stats: {
      items: [
        { value: "5 min", label: "to launch your business online" },
        { value: "15+", label: "ready-made vertical solutions" },
        { value: "3", label: "languages — Uzbek, Russian, English" },
        { value: "90%", label: "less manual attendance work with AI cameras" },
      ],
    },
    aiVision: {
      badge: "AI Camera & Computer Vision",
      title: "Automatic attendance with face recognition",
      subtitle:
        "Built in, not bolted on. Our AI cameras and QR check-in mark attendance the moment a student or employee walks in — no paper, no manual roll calls.",
      points: [
        "Face-recognition check-in straight from any camera or phone",
        "Instant QR self check-in with offline queue support",
        "Live timeline so admins and parents see arrivals in real time",
        "Works for academies, gyms, clinics and multi-branch businesses",
      ],
      note: "Already included in your plan — no extra hardware required.",
    },
    demo: {
      trigger: "Book a Demo",
      title: "Request a free demo",
      subtitle: "Leave your details and our team will show you UniPath for your business within 24 hours.",
      name: "Your name",
      namePh: "e.g. Aziz Karimov",
      phone: "Phone",
      phonePh: "+998 90 123 45 67",
      business: "Business type",
      businessPh: "e.g. academy, travel agency, clinic…",
      message: "Message (optional)",
      messagePh: "Tell us a bit about what you need…",
      submit: "Send request",
      submitting: "Sending…",
      success: "Request sent! We will contact you shortly.",
      error: "Could not send the request. Please try again or reach us by phone.",
    },
    modules: {
      badge: "Vertical Modules",
      title: "A New Layer of Intelligence",
      subtitle:
        "Each module works independently and seamlessly together to support your entire organization.",
      cards: [
        {
          tag: "Manage",
          title: "UniPath Core",
          desc: "CRM & accounting, multi-branch, multi-currency, role systems and custom domains for any business.",
        },
        {
          tag: "Educate",
          title: "NOVA Edu",
          desc: "Attendance, student tracking, lesson plans and a parent portal for academies and schools.",
          highlighted: true,
          cta: "Get Started",
        },
        {
          tag: "Travel",
          title: "UniTour Travel",
          desc: "Visa pipeline, tour booking engine and an agent network for travel agencies.",
        },
        {
          tag: "Dine",
          title: "UniFood Restaurant",
          desc: "POS ordering terminals, Menu managers, and real-time Kitchen Display Systems (KDS) for cafés and restaurants.",
        },
        {
          tag: "Stay",
          title: "UniHotel Lodging",
          desc: "Room occupancy grid layouts, Gantt booking calendars, check-in flows, and PDF invoices for lodging.",
        },
        {
          tag: "Celebrate",
          title: "UniWedding Hall",
          desc: "SVG drag-and-drop floor seating designers, coordinator timeline logs, and deposit payment trackers.",
        },
        {
          tag: "Connect",
          title: "Dedicated Integrations",
          desc: "Telegram bot, AI face-recognition cameras and SMS gateways out of the box.",
        },
      ],
    },
    teams: {
      badge: "Workflow Solutions",
      title: "Designed for Every Workflow, Across Every Team",
      subtitle:
        "Whether you run a school, a travel agency or a multi-branch business, the platform adapts effortlessly.",
      tabs: [
        {
          label: "Academies (NOVA)",
          heading: "For Schools & Academies",
          desc: "Admissions, attendance, lesson plans, and parent portal communication from one clean dashboard.",
          points: [
            "Reduce attendance check time by 90% with AI face cameras",
            "Track student progress and monthly payments",
            "Provide parent portals for real-time grades and announcements",
            "Plan and schedule courses across multiple groups",
          ],
        },
        {
          label: "Travel (UniTour)",
          heading: "For Tour Operators & Agencies",
          desc: "Manage booking engines, visa pipelines, and sub-agent commission structures with full visibility.",
          points: [
            "Track every visa application status through custom pipelines",
            "Build itineraries and manage tours in one central hub",
            "Calculate agent commissions and branch distributions",
            "Sync multi-currency payments in real time",
          ],
        },
        {
          label: "Restaurants (UniFood)",
          heading: "For Cafés & Restaurants",
          desc: "Speed up kitchen prep times, manage menu modifiers, and run multi-terminal POS setups.",
          points: [
            "Sync kitchen display systems (KDS) with active dining bills",
            "Design floor plans with custom dining tables and capacities",
            "Track order statuses (Pending, Preparing, Ready, Paid)",
            "Analyze daily revenue metrics by shift and operator",
          ],
        },
        {
          label: "Lodging (UniHotel)",
          heading: "For Hotels & Motels",
          desc: "Manage guest check-ins, coordinate room cleanings, and schedule guest reservations.",
          points: [
            "View real-time room occupancy states in a visual grid",
            "Track bookings across a scrollable Gantt Timeline calendar",
            "Issue PDF receipts and invoices on guest checkout",
            "Manage cleaning, maintenance, and check-in workflows",
          ],
        },
        {
          label: "Wedding Halls (UniWedding)",
          heading: "For Event & Wedding Halls",
          desc: "Design coordinate floor plans, manage guest allocations, and track deposit budgets.",
          points: [
            "Design table layouts using interactive SVG drag-and-drop tools",
            "Coordinate event program schedules with minute timelines",
            "Track progressive deposit budgets and cash flow ledgers",
            "Allocate guest seats and group lists per table",
          ],
        },
        {
          label: "General Businesses (Core)",
          heading: "For General Businesses",
          desc: "Build repeatable workflows for CRM, accounting, and multi-branch operations.",
          points: [
            "Automate repetitive, high-volume operational tasks",
            "Maintain consistency across multi-branch daily routines",
            "Reduce human input errors using intelligent validation checks",
            "Co-ordinate files and tasks across back-office teams",
          ],
        },
        {
          label: "Managers & Admins",
          heading: "For Platform & Tenant Administrators",
          desc: "Get a unified bird's-eye view of every tenant, branch, and team from a single panel.",
          points: [
            "Monitor business health using live performance charts",
            "Define granular roles and permission gates for users",
            "Instantly aggregate multi-currency financial records",
            "Set up and deploy new branches in minutes",
          ],
        },
      ],
    },
    features: {
      badge: "Product Features",
      title: "Features Crafted for Intelligent Business",
      subtitle:
        "Each feature enhances a different part of your workflow, together forming a seamless, powerful experience.",
      cards: [
        {
          title: "Smart CRM",
          desc: "Move leads through Lead → Applied → Closed automatically and never lose a deal.",
        },
        {
          title: "Financial Dashboard",
          desc: "See income, expenses and a real-time P&L report across every branch.",
        },
        {
          title: "AI & Automation",
          desc: "Automated Telegram notifications, invoice builders and AI-driven workflows.",
        },
      ],
      kanban: { lead: "Lead", applied: "Applied", closed: "Closed" },
      finance: { income: "Income", expenses: "Expenses", profit: "Net Profit" },
      automation: { title: "Automation Activity", sent: "Notifications sent", invoice: "Invoice generated" },
    },
    cta: {
      badge: "Intelligent Work Starts Here",
      title: "Unlock a Smarter Way to Scale Your Business",
      subtitle:
        "Experience a refined SaaS platform built for clarity, intelligence and exceptional performance.",
      primary: "Get Started Now",
      secondary: "Book a Demo",
    },
    testimonials: {
      badge: "User Stories",
      title: "What Teams Are Saying",
      items: [
        {
          quote:
            "As an academy director in Tashkent, NOVA cut our attendance work in half. Parents finally see grades in real time, and our payments are never lost.",
          name: "Dilnoza Karimova",
          role: "Director, Bright Future Academy",
        },
        {
          quote:
            "UniTour gave our travel agency a single pipeline for visas and bookings. We coordinate agents across Samarkand without chaos now.",
          name: "Jasur Rahimov",
          role: "Founder, Silk Road Travel",
        },
        {
          quote:
            "Managing multiple branches used to feel chaotic. With UniPath Core, our finance and CRM finally talk to each other in real time.",
          name: "Sofia Lorenza",
          role: "Operations Manager",
        },
      ],
    },
    footer: {
      tagline: "A unified SaaS ecosystem for business, education and travel.",
      emailPlaceholder: "Enter Your Email",
      getStarted: "Get Started",
      columns: [
        {
          title: "Solutions",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "UniFood Restaurant", "UniHotel Lodging", "UniWedding Hall", "Integrations"],
        },
        {
          title: "Product",
          links: ["Overview", "How It Works", "Pricing", "Security"],
        },
      ],
      privacy: "Privacy Policy",
      terms: "Terms of Use",
      rights: "© 2026 UniPath. All rights reserved.",
    },
  },

  ru: {
    nav: {
      links: [
        { id: "core", label: "Решения" },
        { id: "features", label: "Функции" },
        { id: "pricing", label: "Цены" },
        { id: "testimonials", label: "Отзывы" },
      ],
      login: "Вход",
      getStarted: "Начать",
    },
    hero: {
      badge: "Мультитенантная SaaS-платформа для любого бизнеса",
      title: "Точный SaaS, созданный для роста вашего бизнеса",
      description:
        "Единая система интеллектуальных компонентов, которые анализируют, организуют и автоматизируют ваши процессы, CRM, финансы и филиалы.",
      cta: "Попробовать платформу",
      painLine: "Устали склеивать Excel-таблицы и разрозненные приложения? Объедините CRM, финансы, посещаемость и филиалы в одной системе.",
      metrics: [
        { title: "Умная CRM", desc: "Автоматически отслеживайте лиды и клиентов." },
        { title: "Простой учёт", desc: "P&L в реальном времени и финансы по филиалам." },
        { title: "AI-интеграции", desc: "Telegram-бот и AI-камера для посещаемости." },
      ],
    },
    stats: {
      items: [
        { value: "5 мин", label: "чтобы запустить бизнес онлайн" },
        { value: "15+", label: "готовых вертикальных решений" },
        { value: "3", label: "языка — узбекский, русский, английский" },
        { value: "90%", label: "меньше ручной работы с посещаемостью благодаря AI-камерам" },
      ],
    },
    aiVision: {
      badge: "AI-камера и компьютерное зрение",
      title: "Автоматическая посещаемость с распознаванием лиц",
      subtitle:
        "Встроено, а не добавлено сбоку. AI-камеры и QR-отметка фиксируют посещаемость, как только ученик или сотрудник входит — без бумаги и ручных перекличек.",
      points: [
        "Отметка по распознаванию лица с любой камеры или телефона",
        "Мгновенная QR-самоотметка с поддержкой офлайн-очереди",
        "Живая лента — админы и родители видят приходы в реальном времени",
        "Подходит для академий, фитнес-клубов, клиник и мультифилиальных компаний",
      ],
      note: "Уже включено в ваш тариф — без дополнительного оборудования.",
    },
    demo: {
      trigger: "Заказать демо",
      title: "Запросить бесплатное демо",
      subtitle: "Оставьте контакты — наша команда покажет UniPath для вашего бизнеса в течение 24 часов.",
      name: "Ваше имя",
      namePh: "напр. Азиз Каримов",
      phone: "Телефон",
      phonePh: "+998 90 123 45 67",
      business: "Тип бизнеса",
      businessPh: "напр. академия, турагентство, клиника…",
      message: "Сообщение (необязательно)",
      messagePh: "Коротко опишите, что вам нужно…",
      submit: "Отправить запрос",
      submitting: "Отправка…",
      success: "Запрос отправлен! Мы скоро свяжемся с вами.",
      error: "Не удалось отправить запрос. Попробуйте ещё раз или позвоните нам.",
    },
    modules: {
      badge: "Вертикальные модули",
      title: "Новый уровень интеллекта",
      subtitle:
        "Каждый модуль работает независимо и вместе, поддерживая всю вашу организацию.",
      cards: [
        {
          tag: "Управление",
          title: "UniPath Core",
          desc: "CRM и учёт, мультифилиалы, мультивалюта, роли и собственные домены для любого бизнеса.",
        },
        {
          tag: "Образование",
          title: "NOVA Edu",
          desc: "Посещаемость, учёт учеников, планы уроков и портал для родителей в академиях и школах.",
          highlighted: true,
          cta: "Начать",
        },
        {
          tag: "Туризм",
          title: "UniTour Travel",
          desc: "Визовый конвейер, движок бронирования туров и сеть агентов для турагентств.",
        },
        {
          tag: "Рестораны",
          title: "UniFood Restaurant",
          desc: "Терминалы продаж (POS), менеджер меню и кухонные экраны (KDS) для ресторанов и кафе.",
        },
        {
          tag: "Отели",
          title: "UniHotel Lodging",
          desc: "Интерактивная карта номеров, бронирование на Gantt Timeline, заселение гостей и PDF-чеки.",
        },
        {
          tag: "Торжества",
          title: "UniWedding Hall",
          desc: "Интерактивный планер рассадки гостей (SVG), планировщик таймлайна событий и контроль оплат.",
        },
        {
          tag: "Интеграции",
          title: "Готовые интеграции",
          desc: "Telegram-бот, AI-камеры распознавания лиц и SMS-шлюзы из коробки.",
        },
      ],
    },
    teams: {
      badge: "Решения для процессов",
      title: "Создано для каждого процесса и каждой команды",
      subtitle:
        "Школа, турагентство или мультифилиальный бизнес — платформа адаптируется без усилий.",
      tabs: [
        {
          label: "Академии (NOVA)",
          heading: "Для школ и академий",
          desc: "Приём, посещаемость, уроки и общение с родителями в одной панели.",
          points: [
            "Сократите ручную проверку посещаемости на 90% с AI-камерами",
            "Отслеживайте прогресс и платежи каждого ученика",
            "Дайте родителям портал с оценками и новостями в реальном времени",
            "Планируйте уроки и расписания по всем группам",
          ],
        },
        {
          label: "Турагентства (UniTour)",
          heading: "Для турагентств",
          desc: "Управляйте бронированиями, визами и сетью агентов с полной прозрачностью.",
          points: [
            "Ведите каждую визу через понятный конвейер",
            "Бронируйте туры и управляйте маршрутами в одном месте",
            "Координируйте сеть агентов и комиссии",
            "Синхронизируйте платежи между филиалами в реальном времени",
          ],
        },
        {
          label: "Рестораны (UniFood)",
          heading: "Для ресторанов и кафе",
          desc: "Оптимизируйте работу кухни, управляйте меню и принимайте заказы через POS.",
          points: [
            "Синхронизируйте кухонные экраны (KDS) с активными счетами",
            "Планируйте рассадку за столами с учетом их вместимости",
            "Контролируйте статусы заказов (В очереди, Готовится, Готово, Оплачено)",
            "Анализируйте выручку по сменам и кассирам",
          ],
        },
        {
          label: "Отели (UniHotel)",
          heading: "Для отелей и мотелей",
          desc: "Управляйте заселением, координируйте уборку и планируйте бронирование комнат.",
          points: [
            "Просматривайте занятость номеров на визуальной сетке",
            "Следите за бронированием на интерактивной шкале Gantt Timeline",
            "Печатайте и отправляйте PDF-счета при выезде гостей",
            "Управляйте задачами по уборке и обслуживанию номеров",
          ],
        },
        {
          label: "Залы торжеств (UniWedding)",
          heading: "Для залов торжеств и ресторанов",
          desc: "Создавайте планы залов, распределяйте гостей по столам и ведите учет оплат.",
          points: [
            "Проектируйте рассадку на интерактивном SVG-холсте",
            "Планируйте поминутный таймлайн и сценарий торжества",
            "Отслеживайте авансы, остатки платежей и общий бюджет",
            "Формируйте списки гостей для каждого отдельного стола",
          ],
        },
        {
          label: "Общий бизнес (Core)",
          heading: "Для общего бизнеса",
          desc: "Постройте повторяемые процессы CRM, финансов и операций по всем филиалам.",
          points: [
            "Автоматизируйте рутинные задачи большого объёма",
            "Поддерживайте единообразие в ежедневных процессах",
            "Снижайте число ошибок умными проверками",
            "Ускорьте координацию между отделами",
          ],
        },
        {
          label: "Менеджеры и админы",
          heading: "Для менеджеров и админов",
          desc: "Видите все тенанты, филиалы и команды из единой панели управления.",
          points: [
            "Мониторьте показатели в живых дашбордах",
            "Гибко управляйте ролями и правами",
            "Мгновенно сводите мультивалютную отчётность",
            "Запускайте новые филиалы за минуты, а не недели",
          ],
        },
      ],
    },
    features: {
      badge: "Возможности продукта",
      title: "Функции для интеллектуального бизнеса",
      subtitle:
        "Каждая функция усиливает свою часть процесса, формируя единый и мощный опыт.",
      cards: [
        {
          title: "Умная CRM",
          desc: "Ведите лиды Лид → Заявка → Закрыто автоматически и не теряйте сделки.",
        },
        {
          title: "Финансовый дашборд",
          desc: "Доходы, расходы и P&L в реальном времени по каждому филиалу.",
        },
        {
          title: "AI и автоматизация",
          desc: "Авто-уведомления в Telegram, конструктор счетов и AI-процессы.",
        },
      ],
      kanban: { lead: "Лид", applied: "Заявка", closed: "Закрыто" },
      finance: { income: "Доход", expenses: "Расход", profit: "Чистая прибыль" },
      automation: { title: "Активность автоматизации", sent: "Отправлено уведомлений", invoice: "Счёт создан" },
    },
    cta: {
      badge: "Умная работа начинается здесь",
      title: "Откройте умный способ масштабировать бизнес",
      subtitle:
        "Утончённая SaaS-платформа, созданная для ясности, интеллекта и выдающейся производительности.",
      primary: "Начать сейчас",
      secondary: "Заказать демо",
    },
    testimonials: {
      badge: "Истории клиентов",
      title: "Что говорят команды",
      items: [
        {
          quote:
            "Как директор академии в Ташкенте, я с NOVA вдвое сократила работу с посещаемостью. Родители видят оценки в реальном времени, а платежи не теряются.",
          name: "Дилноза Каримова",
          role: "Директор, Bright Future Academy",
        },
        {
          quote:
            "UniTour дал нашему турагентству единый конвейер для виз и бронирований. Теперь мы координируем агентов в Самарканде без хаоса.",
          name: "Жасур Рахимов",
          role: "Основатель, Silk Road Travel",
        },
        {
          quote:
            "Управление филиалами было хаосом. С UniPath Core финансы и CRM наконец работают вместе в реальном времени.",
          name: "София Лоренца",
          role: "Операционный менеджер",
        },
      ],
    },
    footer: {
      tagline: "Единая SaaS-экосистема для бизнеса, образования и туризма.",
      emailPlaceholder: "Введите ваш Email",
      getStarted: "Начать",
      columns: [
        {
          title: "Решения",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "UniFood Restaurant", "UniHotel Lodging", "UniWedding Hall", "Интеграции"],
        },
        {
          title: "Продукт",
          links: ["Обзор", "Как это работает", "Цены", "Безопасность"],
        },
      ],
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      rights: "© 2026 UniPath. Все права защищены.",
    },
  },

  uz: {
    nav: {
      links: [
        { id: "core", label: "Yechimlar" },
        { id: "features", label: "Imkoniyatlar" },
        { id: "pricing", label: "Narxlar" },
        { id: "testimonials", label: "Sharhlar" },
      ],
      login: "Kirish",
      getStarted: "Boshlash",
    },
    hero: {
      badge: "Biznesingiz uchun ko'p ijarali (Multi-Tenant) SaaS platforma",
      title: "Biznesingizni Tizimlashtirish va Avtomatlashtirish Uchun Aqlli Platforma",
      description:
        "Mijozlar bilan ishlash (CRM), moliya, xodimlar davomati va filiallar nazoratini bitta tizimda birlashtiring. UniPath yordamida biznesingizni yangi bosqichga olib chiqing.",
      cta: "Tizimni Bepul Sinab Ko'ring",
      painLine: "Excel jadvallar va tarqoq ilovalarni bir-biriga ulashdan charchadingizmi? CRM, moliya, davomat va filiallarni bitta tizimga jamlang.",
      metrics: [
        { title: "Aqlli CRM", desc: "Lidlar va mijozlarni avtomatik kuzating." },
        { title: "Oson buxgalteriya", desc: "Real vaqtda P&L va filiallar moliyasi." },
        { title: "AI integratsiyalar", desc: "Telegram bot va AI kamera davomati." },
      ],
    },
    stats: {
      items: [
        { value: "5 daqiqa", label: "biznesingiz onlayn ishga tushadi" },
        { value: "15+", label: "tayyor vertikal yo'nalish" },
        { value: "3", label: "til — o'zbek, rus, ingliz" },
        { value: "90%", label: "AI kamera bilan qo'lda davomat ishi kamayadi" },
      ],
    },
    aiVision: {
      badge: "AI Kamera & Computer Vision",
      title: "Yuzni aniqlash bilan avtomatik davomat",
      subtitle:
        "Yondan ulangan emas, ichiga qurilgan. AI kameralar va QR belgilash o'quvchi yoki xodim kirishi bilanoq davomatni qayd etadi — qog'ozsiz, qo'lda yo'qlamasiz.",
      points: [
        "Istalgan kamera yoki telefondan yuzni aniqlash orqali belgilash",
        "Oflayn navbat bilan bir zumda QR o'z-o'zini belgilash",
        "Jonli lenta — adminlar va ota-onalar kelishlarni real vaqtda ko'radi",
        "Akademiya, fitnes, klinika va ko'p filialli bizneslar uchun mos",
      ],
      note: "Tarifingizga allaqachon kiritilgan — qo'shimcha qurilma talab qilinmaydi.",
    },
    demo: {
      trigger: "Demo buyurtma qilish",
      title: "Bepul demo so'rang",
      subtitle: "Ma'lumotlaringizni qoldiring — jamoamiz 24 soat ichida UniPath'ni biznesingiz uchun ko'rsatadi.",
      name: "Ismingiz",
      namePh: "masalan, Aziz Karimov",
      phone: "Telefon",
      phonePh: "+998 90 123 45 67",
      business: "Biznes turi",
      businessPh: "masalan, akademiya, turagentlik, klinika…",
      message: "Xabar (ixtiyoriy)",
      messagePh: "Sizga nima kerakligini qisqacha yozing…",
      submit: "So'rovni yuborish",
      submitting: "Yuborilmoqda…",
      success: "So'rov yuborildi! Tez orada bog'lanamiz.",
      error: "So'rovni yuborib bo'lmadi. Qayta urinib ko'ring yoki telefon orqali bog'laning.",
    },
    modules: {
      badge: "Vertikal modullar",
      title: "Biznesingiz Uchun Maxsus Vertikal Yechimlar",
      subtitle:
        "Har bir modul mustaqil va birgalikda ishlab, butun tashkilotingizni qo'llab-quvvatlaydi.",
      cards: [
        {
          tag: "Boshqaruv",
          title: "UniPath Core",
          desc: "CRM va buxgalteriya, ko'p filial, ko'p valyuta, rollar tizimi va maxsus domenlar.",
        },
        {
          tag: "Ta'lim",
          title: "NOVA Edu",
          desc: "Davomat, o'quvchilarni kuzatish, dars rejalari va ota-onalar portali akademiyalar uchun.",
          highlighted: true,
          cta: "Boshlash",
        },
        {
          tag: "Sayohat",
          title: "UniTour Travel",
          desc: "Viza jarayoni, tur bron qilish tizimi va agentlar tarmog'i turagentliklar uchun.",
        },
        {
          tag: "Restoran",
          title: "UniFood Restaurant",
          desc: "Savdo POS terminallari, menyu menejeri va oshxona KDS ekranlari restoran va kafelar uchun.",
        },
        {
          tag: "Mehmonxona",
          title: "UniHotel Lodging",
          desc: "Xonalar bandlik xaritasi, Gantt Timeline kalendari, check-in oqimi va PDF cheklar.",
        },
        {
          tag: "Tantanalar",
          title: "UniWedding Hall",
          desc: "Interaktiv SVG stollar joylashuv planeri, marosimlar taymlayn rejasi va zakalat hisob-kitobi.",
        },
        {
          tag: "Integratsiya",
          title: "Maxsus integratsiyalar",
          desc: "Telegram bot, AI yuzni aniqlash kameralari va SMS shlyuzlar tayyor holatda.",
        },
      ],
    },
    teams: {
      badge: "Jarayon yechimlari",
      title: "Har bir jarayon va jamoa uchun yaratilgan",
      subtitle:
        "Maktab, turagentlik yoki ko'p filialli biznes — platforma osongina moslashadi.",
      tabs: [
        {
          label: "Maktab va akademiyalar (NOVA)",
          heading: "Maktab va akademiyalar uchun",
          desc: "Qabul, davomat, darslar va ota-onalar bilan aloqani bitta paneldan boshqaring.",
          points: [
            "AI kameralar bilan qo'lda davomatni 90% ga kamaytiring",
            "Har bir o'quvchining rivoji va to'lovlarini kuzating",
            "Ota-onalarga real vaqtda baholar portalini bering",
            "Barcha guruhlar bo'yicha darslarni rejalashtiring",
          ],
        },
        {
          label: "Turagentliklar (UniTour)",
          heading: "Turagentliklar uchun",
          desc: "Bronlar, viza jarayoni va agentlar tarmog'ini to'liq nazorat bilan boshqaring.",
          points: [
            "Har bir vizani aniq jarayon orqali kuzating",
            "Turlarni bron qiling va marshrutlarni bir joyda boshqaring",
            "Agentlar tarmog'i va komissiyalarni muvofiqlashtiring",
            "To'lovlarni filiallar bo'ylab real vaqtda sinxronlang",
          ],
        },
        {
          label: "Restoranlar (UniFood)",
          heading: "Restoran va kafelar uchun",
          desc: "Oshxona faoliyatini tezlashtiring, menyularni boshqaring va buyurtmalarni POS orqali qabul qiling.",
          points: [
            "KDS oshxona ekranlarini faol stollar bilan sinxronlashtiring",
            "Stollar joylashuvini ularning sig'imiga qarab rejalashtiring",
            "Buyurtma holatini ko'rib turing (Kutilmoqda, Tayyorlanmoqda, Tayyor, To'langan)",
            "Smenalar va kassirlar bo'yicha kunlik daromadlarni tahlil qiling",
          ],
        },
        {
          label: "Mehmonxonalar (UniHotel)",
          heading: "Mehmonxona va motellar uchun",
          desc: "Mehmonlarni joylashtirishni boshqaring, tozalash ishlarini muvofiqlashtiring va xonalarni bron qiling.",
          points: [
            "Xonalar bandligini vizual xaritada ko'ring",
            "Bronlarni Gantt Timeline kalendarida kuzatib boring",
            "Mehmon chiqib ketishida (Checkout) PDF cheklarini chop eting",
            "Tozalash va xonalarga xizmat ko'rsatish vazifalarini boshqaring",
          ],
        },
        {
          label: "Tantanalar zallari (UniWedding)",
          heading: "To'yxonalar va tantanalar zallari uchun",
          desc: "Zallar rejasini chizing, mehmonlarni stollarga biriktiring va to'lovlarni nazorat qiling.",
          points: [
            "Interaktiv SVG paneli yordamida stollar joylashuvini loyihalashtiring",
            "Tadbirning marosimlar taymlayn rejasini tuzing",
            "Zakalat to'lovlari va umumiy tadbir byudjetini hisoblang",
            "Har bir stol uchun mehmonlar ro'yxatini shakllantiring",
          ],
        },
        {
          label: "Umumiy biznes (Core)",
          heading: "Umumiy biznes uchun",
          desc: "Barcha filiallar uchun CRM, moliya va operatsiyalarda takrorlanadigan jarayonlar quring.",
          points: [
            "Takrorlanuvchi ko'p hajmli vazifatlarni avtomatlashtiring",
            "Kundalik jarayonlarda izchillikni saqlang",
            "Aqlli tekshiruvlar bilan xatolarni kamaytiring",
            "Bo'limlar o'rtasida tezroq muvofiqlashtiring",
          ],
        },
        {
          label: "Menejer va adminlar",
          heading: "Menejer va adminlar uchun",
          desc: "Barcha ijaralar, filiallar va jamoalarni yagona boshqaruv panelidan ko'ring.",
          points: [
            "Jonli dashboardlarda ko'rsatkichlarni kuzating",
            "Rollar va ruxsatlarni nozik boshqaring",
            "Ko'p valyutali hisobotlarni bir zumda jamlang",
            "Yangi filiallarni haftalarda emas, daqiqalarda ishga tushiring",
          ],
        },
      ],
    },
    features: {
      badge: "Mahsulot imkoniyatlari",
      title: "Aqlli biznes uchun yaratilgan imkoniyatlar",
      subtitle:
        "Har bir imkoniyat jarayoningizning bir qismini kuchaytirib, yagona kuchli tajriba hosil qiladi.",
      cards: [
        {
          title: "Aqlli CRM",
          desc: "Lidlarni Lid → Ariza → Yopilgan bosqichlari bo'ylab avtomatik yuriting.",
        },
        {
          title: "Moliyaviy dashboard",
          desc: "Daromad, xarajat va real vaqtdagi P&L har bir filial bo'yicha.",
        },
        {
          title: "AI va avtomatlashtirish",
          desc: "Avtomatik Telegram bildirishnomalar, hisob-faktura va AI jarayonlar.",
        },
      ],
      kanban: { lead: "Lid", applied: "Ariza", closed: "Yopilgan" },
      finance: { income: "Daromad", expenses: "Xarajat", profit: "Sof foyda" },
      automation: { title: "Avtomatlashtirish faoliyati", sent: "Yuborilgan bildirishnomalar", invoice: "Hisob-faktura yaratildi" },
    },
    cta: {
      badge: "Aqlli ish shu yerdan boshlanadi",
      title: "Biznesingizni kengaytirishning aqlli yo'lini oching",
      subtitle:
        "Aniqlik, intellekt va yuqori unumdorlik uchun yaratilgan nafis SaaS platforma.",
      primary: "Hozir boshlash",
      secondary: "Demo buyurtma qilish",
    },
    testimonials: {
      badge: "Mijozlar hikoyalari",
      title: "Jamoalar nima deydi",
      items: [
        {
          quote:
            "Toshkentdagi akademiya direktori sifatida NOVA davomat ishimni ikki barobar qisqartirdi. Ota-onalar baholarni real vaqtda ko'radi, to'lovlar yo'qolmaydi.",
          name: "Dilnoza Karimova",
          role: "Direktor, Bright Future Academy",
        },
        {
          quote:
            "UniTour turagentligimizga vizalar va bronlar uchun yagona jarayon berdi. Endi Samarqanddagi agentlarni tartibsizliksiz muvofiqlashtiramiz.",
          name: "Jasur Rahimov",
          role: "Asoschi, Silk Road Travel",
        },
        {
          quote:
            "Ko'p filialni boshqarish tartibsiz edi. UniPath Core bilan moliya va CRM nihoyat real vaqtda birga ishlaydi.",
          name: "Sofiya Lorensa",
          role: "Operatsion menejer",
        },
      ],
    },
    footer: {
      tagline: "Biznes, ta'lim va sayohat uchun yagona SaaS ekotizimi.",
      emailPlaceholder: "Email manzilingiz",
      getStarted: "Boshlash",
      columns: [
        {
          title: "Yechimlar",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "UniFood Restaurant", "UniHotel Lodging", "UniWedding Hall", "Integratsiyalar"],
        },
        {
          title: "Mahsulot",
          links: ["Umumiy ko'rinish", "Qanday ishlaydi", "Narxlar", "Xavfsizlik"],
        },
      ],
      privacy: "Maxfiylik siyosati",
      terms: "Foydalanish shartlari",
      rights: "© 2026 UniPath. Barcha huquqlar himoyalangan.",
    },
  },
}
