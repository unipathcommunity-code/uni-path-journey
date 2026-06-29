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
        { id: "solutions", label: "Solutions" },
        { id: "features", label: "Features" },
        { id: "pricing", label: "Pricing" },
        { id: "testimonials", label: "Testimonials" },
      ],
      dropdown: {
        title: "Solutions",
        core: { title: "UniPath Core", desc: "CRM & Finance for general business" },
        nova: { title: "NOVA Edu", desc: "For Academies and Schools" },
        unitour: { title: "UniTour Travel", desc: "For Tour and Travel agencies" },
        unihotel: { title: "UniHotel Lodging", desc: "For Hotels and Motels" },
        unirest: { title: "UniRest Restaurant", desc: "For Cafes and Restaurants" },
        unihall: { title: "UniHall Events", desc: "For Banquet and Wedding Halls" },
        integrations: { title: "Integrations", desc: "Telegram bots, AI cameras, SMS" }
      },
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
          title: "NOVA Edu SaaS",
          desc: "Attendance, student tracking, lesson plans and a parent portal for academies and schools.",
          highlighted: true,
          cta: "Get Started",
        },
        {
          tag: "Travel",
          title: "UniTour Travel SaaS",
          desc: "Visa pipeline, tour booking engine and an agent network for travel agencies.",
        },
        {
          tag: "Lodging",
          title: "UniHotel Lodging SaaS",
          desc: "Gantt timeline, room occupancy grids, check-in flow, and automated invoices for lodging.",
        },
        {
          tag: "POS",
          title: "UniRest Restaurant POS",
          desc: "Kitchen display system (KDS), digital menu builders, and visual POS ordering terminals.",
        },
        {
          tag: "Events",
          title: "UniHall Seating & Events",
          desc: "Interactive SVG seating floor planners, event timeline programs, and budget deposit ledger.",
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
          label: "Schools & Academies (NOVA)",
          heading: "For Schools & Academies",
          desc: "Run admissions, attendance, lessons and parent communication from one clean dashboard.",
          points: [
            "Reduce manual attendance checks by 90% with AI cameras",
            "Track every student's progress and payments",
            "Give parents a real-time portal for grades and news",
            "Plan lessons and schedules across all groups",
          ],
        },
        {
          label: "Travel Agencies (UniTour)",
          heading: "For Travel Agencies",
          desc: "Manage bookings, visa pipelines and your agent network with full visibility.",
          points: [
            "Track every visa application through a clear pipeline",
            "Book tours and manage itineraries in one place",
            "Coordinate your agent network and commissions",
            "Sync payments in real time across branches",
          ],
        },
        {
          label: "Hotels & Lodging (UniHotel)",
          heading: "For Hotels & Hostels",
          desc: "Manage check-ins, cleanings, and room bookings on a live Gantt calendar visualizer.",
          points: [
            "Live room status grid (Occupied, Cleaning, Available)",
            "Scrollable monthly Gantt calendar for reservations",
            "Quick guest check-in & check-out logs",
            "Automatic invoice printing and revenue analytics",
          ],
        },
        {
          label: "Restaurants & Cafes (UniRest)",
          heading: "For Restaurants & Cafes",
          desc: "Connect frontend POS order pads directly with real-time Kitchen Display screens.",
          points: [
            "Intuitive POS checkout with dynamic product options",
            "Chefs view orders instantly on the KDS display screen",
            "Table layout grid mapping tables with status alerts",
            "Category management and automated billing checks",
          ],
        },
        {
          label: "Wedding & Event Halls (UniHall)",
          heading: "For Banquet & Event Halls",
          desc: "Organize grand ceremonies, table charts, programs and payment progress.",
          points: [
            "Drag-and-drop SVG seating arrangements builder",
            "Assign guests by name to specific tables and seats",
            "Interactive event program timeline scheduler",
            "Progressive payment indicators for deposit accounting",
          ],
        },
        {
          label: "For General Businesses (Core)",
          heading: "For General Businesses",
          desc: "Build repeatable processes for CRM, finance and operations across all your branches.",
          points: [
            "Automate repetitive, high-volume tasks",
            "Maintain consistency across daily workflows",
            "Reduce human error with intelligent checks",
            "Enable faster coordination across departments",
          ],
        },
        {
          label: "For Managers & Admins",
          heading: "For Managers & Admins",
          desc: "Get a bird's-eye view of every tenant, branch and team from a single control panel.",
          points: [
            "Monitor performance with live dashboards",
            "Control roles and permissions granularly",
            "Consolidate multi-currency reporting instantly",
            "Set up new branches in minutes, not weeks",
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
      tagline: "A unified SaaS ecosystem for business, education, travel, lodging, restaurant and events.",
      emailPlaceholder: "Enter Your Email",
      getStarted: "Get Started",
      columns: [
        {
          title: "Solutions",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "UniHotel Lodging", "UniRest Restaurant", "UniHall Events", "Integrations"],
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
        { id: "solutions", label: "Решения" },
        { id: "features", label: "Функции" },
        { id: "pricing", label: "Цены" },
        { id: "testimonials", label: "Отзывы" },
      ],
      dropdown: {
        title: "Решения",
        core: { title: "UniPath Core", desc: "CRM и финансы для общего бизнеса" },
        nova: { title: "NOVA Edu", desc: "Для академий и школ" },
        unitour: { title: "UniTour Travel", desc: "Для туристических агентств" },
        unihotel: { title: "UniHotel Lodging", desc: "Для отелей и мотелей" },
        unirest: { title: "UniRest Restaurant", desc: "Для ресторанов и кафе" },
        unihall: { title: "UniHall Events", desc: "Для банкетных и свадебных залов" },
        integrations: { title: "Интеграции", desc: "Telegram-боты, AI-камеры, SMS" }
      },
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
          title: "NOVA Edu SaaS",
          desc: "Посещаемость, учёт учеников, планы уроков и портал для родителей в академиях и школах.",
          highlighted: true,
          cta: "Начать",
        },
        {
          tag: "Туризм",
          title: "UniTour Travel SaaS",
          desc: "Визовый конвейер, движок бронирования туров и сеть агентов для турагентств.",
        },
        {
          tag: "Отели",
          title: "UniHotel Lodging SaaS",
          desc: "Gantt график бронирований, сетка номеров, check-in гостей и автоматические счета.",
        },
        {
          tag: "Рестораны",
          title: "UniRest Restaurant POS",
          desc: "Дисплей для кухни (KDS), менеджер меню и быстрые терминалы POS-заказов.",
        },
        {
          tag: "События",
          title: "UniHall Seating & Events",
          desc: "Интерактивная карта столов SVG, таймлайн программы и учет предоплат торжеств.",
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
          label: "Школы и академии (NOVA)",
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
          label: "Отели и хостелы (UniHotel)",
          heading: "Для отелей и хостелов",
          desc: "Управляйте заселением, уборкой и бронированием на живом Gantt-календаре.",
          points: [
            "Сетка статусов номеров (Занят, Уборка, Свободен)",
            "Удобный месячный календарь Gantt для резерваций",
            "Быстрая регистрация (check-in) и выезд (check-out) гостей",
            "Печать чеков и автоматический подсчет стоимости ночей",
          ],
        },
        {
          label: "Рестораны и кафе (UniRest)",
          heading: "Для ресторанов и кафе",
          desc: "Подключайте платежные POS-терминалы напрямую к кухонному экрану KDS.",
          points: [
            "Быстрое добавление блюд в корзину и оплата заказа POS",
            "Интерактивный KDS экран очереди заказов для поваров",
            "Карта столов зала с подсветкой занятых мест",
            "Менеджер меню и модификаторы позиций",
          ],
        },
        {
          label: "Банкетные залы (UniHall)",
          heading: "Для свадебных и банкетных залов",
          desc: "Организуйте торжества, рассадку гостей, программу и учет оплат.",
          points: [
            "SVG конструктор рассадки гостей перетаскиванием",
            "Привязка списка гостей к конкретным столам по именам",
            "Таймлайн планировщика свадебной шоу-программы",
            "Счетчик оплат и прогресс сбора бюджета",
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
            "Ускорите координацию между отделами",
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
      tagline: "Единая SaaS-экосистема для бизнеса, образования, туризма, гостиниц, ресторанов и банкетных залов.",
      emailPlaceholder: "Введите ваш Email",
      getStarted: "Начать",
      columns: [
        {
          title: "Решения",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "UniHotel Lodging", "UniRest Restaurant", "UniHall Events", "Интеграции"],
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
        { id: "solutions", label: "Yechimlar" },
        { id: "features", label: "Imkoniyatlar" },
        { id: "pricing", label: "Narxlar" },
        { id: "testimonials", label: "Sharhlar" },
      ],
      dropdown: {
        title: "Yechimlar",
        core: { title: "UniPath Core", desc: "Umumiy biznes uchun CRM va moliya" },
        nova: { title: "NOVA Edu", desc: "O'quv markazlari va maktablar uchun" },
        unitour: { title: "UniTour Travel", desc: "Sayohat va turizm agentliklari uchun" },
        unihotel: { title: "UniHotel Lodging", desc: "Mehmonxona va motellar uchun" },
        unirest: { title: "UniRest Restaurant", desc: "Kafe va restoranlar uchun" },
        unihall: { title: "UniHall Events", desc: "To'yxonalar va tantanalar zallari uchun" },
        integrations: { title: "Integratsiyalar", desc: "Telegram bot, AI kameralar, SMS shlyuz" }
      },
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
          title: "NOVA Edu SaaS",
          desc: "Davomat, o'quvchilarni kuzatish, dars rejalari va ota-onalar portali akademiyalar uchun.",
          highlighted: true,
          cta: "Boshlash",
        },
        {
          tag: "Sayohat",
          title: "UniTour Travel SaaS",
          desc: "Viza jarayoni, tur bron qilish tizimi va agentlar tarmog'i turagentliklar uchun.",
        },
        {
          tag: "Mehmonxona",
          title: "UniHotel Lodging SaaS",
          desc: "Gantt bandlik grafigi, xonalar xaritasi, mehmonlar check-in va PDF kvitansiyalar.",
        },
        {
          tag: "Restoran",
          title: "UniRest Restaurant POS",
          desc: "Oshxona displeyi (KDS), raqamli menyu menejeri va tezkor POS buyurtma berish terminallari.",
        },
        {
          tag: "Tantanalar",
          title: "UniHall Seating & Events",
          desc: "Interaktiv SVG stollar xaritasi, tadbir dasturi timeline va zakalat moliya balansi.",
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
          label: "Mehmonxona va motellar (UniHotel)",
          heading: "Mehmonxona va pansionatlar uchun",
          desc: "Gantt kalendari orqali xonalar bandligi, check-in jarayoni va xona tozaligini boshqaring.",
          points: [
            "Xonalarning joriy holati (Band, Tozalanmoqda, Bo'sh)",
            "Rezervatsiyalar uchun qulay oylik Gantt jadvali",
            "Tezkor kirish (check-in) va chiqish (check-out) qaydlari",
            "Kvitansiyalarni avtomatik hisoblash va yuklab olish",
          ],
        },
        {
          label: "Restoran va kafelar (UniRest)",
          heading: "Restoran va kafelar uchun",
          desc: "Tezkor POS to'lov terminallarini bevosita oshxona displeyiga (KDS) bog'lang.",
          points: [
            "Qulay POS to'lov va buyurtma savatchasi tizimi",
            "Oshxona uchun buyurtmalar navbati (KDS displeyi)",
            "Stollar bandligi va holatini ko'rsatuvchi zal xaritasi",
            "Taomlar toifalari, narxlash va hisob-faktura chop etish",
          ],
        },
        {
          label: "To'yxonalar va zallar (UniHall)",
          heading: "Tadbir va to'yxonalar uchun",
          desc: "Tantanalar, stollar tartibi, tadbir rejasi va to'lovlar tarixini boshqaring.",
          points: [
            "SVG elementlarini sudrab joylashtiruvchi seating planner",
            "Har bir stolga mehmonlarni ismi bilan biriktirish",
            "Marosim vaqtlarini rejalashtiruvchi timeline dasturi",
            "To'lovlar to'lanish foizini ko'rsatuvchi progress barlar",
          ],
        },
        {
          label: "Umumiy biznes (Core)",
          heading: "Umumiy biznes uchun",
          desc: "Barcha filiallar uchun CRM, moliya va operatsiyalarda takrorlanadigan jarayonlar quring.",
          points: [
            "Takrorlanuvchi ko'p hajmli vazifalarni avtomatlashtiring",
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
      tagline: "Biznes, ta'lim, sayohat, mehmonxona, restoran va tadbirlar uchun yagona SaaS ekotizimi.",
      emailPlaceholder: "Email manzilingiz",
      getStarted: "Boshlash",
      columns: [
        {
          title: "Yechimlar",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "UniHotel Lodging", "UniRest Restaurant", "UniHall Events", "Integratsiyalar"],
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
