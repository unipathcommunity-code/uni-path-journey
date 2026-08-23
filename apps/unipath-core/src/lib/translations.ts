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
        "Works for single offices and multi-branch agencies alike",
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
      businessPh: "e.g. education consulting agency…",
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
          desc: "CRM & accounting, multi-branch, multi-currency, role systems and custom domains for your agency.",
        },
        {
          tag: "Apply",
          title: "Applications Pipeline",
          desc: "Every applicant moves through a clear pipeline: lead, contact, documents, visa, enrolment.",
          highlighted: true,
          cta: "Get Started",
        },
        {
          tag: "Documents",
          title: "Document Control",
          desc: "Upload, review and approve passports, transcripts and letters with a full audit trail.",
        },
        {
          tag: "Study",
          title: "Universities & Grants",
          desc: "An international university database plus grant and scholarship tracking for every student.",
        },
        {
          tag: "Arrive",
          title: "Visa & Arrival",
          desc: "Visa preparation, transfers, housing and arrival tracking once the student is abroad.",
        },
        {
          tag: "Connect",
          title: "Dedicated Integrations",
          desc: "Telegram bot, notifications and SMS gateways out of the box.",
        },
      ],
    },
    teams: {
      badge: "Workflow Solutions",
      title: "Designed for Every Workflow, Across Every Team",
      subtitle:
        "A single consultant or a multi-branch agency — the platform adapts effortlessly.",
      tabs: [
        {
          label: "Consultants",
          heading: "For Study-Abroad Consultants",
          desc: "Move every applicant from first enquiry to enrolment through one clear pipeline.",
          points: [
            "Track leads, contacts, documents, visa and enrolment in one board",
            "Store and approve every applicant document with an audit trail",
            "Match students to universities, programmes and grants",
            "Keep applicants informed automatically over Telegram",
          ],
        },
        {
          label: "Agents",
          heading: "For Sub-Agents & Partners",
          desc: "Give each agent their own workspace, student list and commission ledger.",
          points: [
            "Assign students to agents and track their progress",
            "Calculate agent commissions and branch distributions",
            "Share notes and tasks across the whole team",
            "Sync multi-currency payments in real time",
          ],
        },
        {
          label: "Students",
          heading: "For Applicants",
          desc: "A personal portal where every student sees exactly where their application stands.",
          points: [
            "Follow the application status step by step",
            "Upload missing documents from any device",
            "Browse universities, grants, jobs and housing",
            "Get arrival and transfer details before departure",
          ],
        },
        {
          label: "Managers & Admins",
          heading: "For Platform & Tenant Administrators",
          desc: "Get a unified bird's-eye view of every agency, branch, and team from a single panel.",
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
            "UniPath cut our paperwork in half. Every applicant now has one file, and nothing gets lost between the consultant and the embassy.",
          name: "Dilnoza Karimova",
          role: "Director, Bright Future Education",
        },
        {
          quote:
            "One pipeline for visas and documents. We coordinate our agents across Samarkand without chaos now.",
          name: "Jasur Rahimov",
          role: "Founder, Silk Road Education",
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
      tagline: "A unified SaaS platform for study-abroad consulting agencies.",
      emailPlaceholder: "Enter Your Email",
      getStarted: "Get Started",
      columns: [
        {
          title: "Solutions",
          links: ["UniPath Core", "Applications Pipeline", "Document Control", "Universities & Grants", "Visa & Arrival", "Integrations"],
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
        "Подходит как для одного офиса, так и для мультифилиальных агентств",
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
      businessPh: "напр. консалтинговое агентство…",
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
          desc: "CRM и бухгалтерия, мультифилиальность, мультивалютность, роли и собственные домены.",
        },
        {
          tag: "Заявки",
          title: "Воронка заявок",
          desc: "Каждый абитуриент проходит понятный путь: лид, контакт, документы, виза, зачисление.",
          highlighted: true,
          cta: "Начать",
        },
        {
          tag: "Документы",
          title: "Контроль документов",
          desc: "Загрузка, проверка и утверждение паспортов, аттестатов и писем с полной историей.",
        },
        {
          tag: "Обучение",
          title: "Университеты и гранты",
          desc: "База зарубежных университетов и учёт грантов и стипендий для каждого студента.",
        },
        {
          tag: "Прибытие",
          title: "Виза и встреча",
          desc: "Подготовка визы, трансфер, жильё и сопровождение студента после прилёта.",
        },
        {
          tag: "Интеграции",
          title: "Готовые интеграции",
          desc: "Telegram-бот, уведомления и SMS-шлюзы из коробки.",
        },
      ],
    },
    teams: {
      badge: "Решения для процессов",
      title: "Создано для каждого процесса и каждой команды",
      subtitle:
        "Один консультант или мультифилиальное агентство — платформа адаптируется без усилий.",
      tabs: [
        {
          label: "Консультанты",
          heading: "Для консалтинга по обучению за рубежом",
          desc: "Ведите абитуриента от первой заявки до зачисления в одной понятной воронке.",
          points: [
            "Лиды, контакты, документы, виза и зачисление — на одной доске",
            "Храните и утверждайте документы с полной историей изменений",
            "Подбирайте университеты, программы и гранты для студентов",
            "Автоматически информируйте абитуриентов через Telegram",
          ],
        },
        {
          label: "Агенты",
          heading: "Для суб-агентов и партнёров",
          desc: "У каждого агента своё рабочее место, список студентов и учёт комиссий.",
          points: [
            "Закрепляйте студентов за агентами и следите за прогрессом",
            "Считайте комиссии агентов и распределение по филиалам",
            "Делитесь заметками и задачами внутри команды",
            "Синхронизируйте мультивалютные платежи в реальном времени",
          ],
        },
        {
          label: "Студенты",
          heading: "Для абитуриентов",
          desc: "Личный кабинет, где студент видит точный статус своей заявки.",
          points: [
            "Следите за статусом заявки шаг за шагом",
            "Загружайте недостающие документы с любого устройства",
            "Изучайте университеты, гранты, работу и жильё",
            "Получайте детали встречи и трансфера до вылета",
          ],
        },
        {
          label: "Менеджеры и админы",
          heading: "Для администраторов платформы и агентств",
          desc: "Единый обзор всех агентств, филиалов и команд в одной панели.",
          points: [
            "Следите за состоянием бизнеса на живых графиках",
            "Настраивайте роли и права доступа пользователей",
            "Мгновенно агрегируйте мультивалютные финансы",
            "Запускайте новые филиалы за считанные минуты",
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
            "UniPath вдвое сократил бумажную работу. У каждого абитуриента одно дело, и ничего не теряется между консультантом и посольством.",
          name: "Дилноза Каримова",
          role: "Директор, Bright Future Education",
        },
        {
          quote:
            "Единая воронка для виз и документов. Теперь мы координируем агентов в Самарканде без хаоса.",
          name: "Жасур Рахимов",
          role: "Основатель, Silk Road Education",
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
      tagline: "Единая SaaS-платформа для агентств по обучению за рубежом.",
      emailPlaceholder: "Введите ваш Email",
      getStarted: "Начать",
      columns: [
        {
          title: "Решения",
          links: ["UniPath Core", "Воронка заявок", "Контроль документов", "Университеты и гранты", "Виза и встреча", "Интеграции"],
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
        "Yakka ofis va ko‘p filialli agentliklar uchun bir xil mos",
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
      businessPh: "masalan, konsalting agentligi…",
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
          desc: "CRM va buxgalteriya, ko‘p filial, ko‘p valyuta, rollar tizimi va maxsus domenlar.",
        },
        {
          tag: "Arizalar",
          title: "Arizalar voronkasi",
          desc: "Har bir abituriyent aniq bosqichlardan o‘tadi: lid, aloqa, hujjatlar, viza, o‘qishga kirish.",
          highlighted: true,
          cta: "Boshlash",
        },
        {
          tag: "Hujjatlar",
          title: "Hujjatlar nazorati",
          desc: "Pasport, attestat va tavsiyanomalarni yuklash, tekshirish va tasdiqlash — to‘liq tarix bilan.",
        },
        {
          tag: "Ta‘lim",
          title: "Universitetlar va grantlar",
          desc: "Xalqaro universitetlar bazasi hamda har bir talaba uchun grant va stipendiyalar hisobi.",
        },
        {
          tag: "Yetib borish",
          title: "Viza va kutib olish",
          desc: "Viza tayyorlash, transfer, turar joy va talaba yetib borgach kuzatuv.",
        },
        {
          tag: "Integratsiya",
          title: "Maxsus integratsiyalar",
          desc: "Telegram bot, bildirishnomalar va SMS shlyuzlar tayyor holatda.",
        },
      ],
    },
    teams: {
      badge: "Jarayon yechimlari",
      title: "Har bir jarayon va jamoa uchun yaratilgan",
      subtitle:
        "Yakka konsultant yoki ko‘p filialli agentlik — platforma osongina moslashadi.",
      tabs: [
        {
          label: "Konsultantlar",
          heading: "Xorijda ta‘lim konsaltingi uchun",
          desc: "Har bir abituriyentni birinchi murojaatdan o‘qishga kirishgacha bitta aniq voronkada olib boring.",
          points: [
            "Lid, aloqa, hujjatlar, viza va o‘qishga kirish — bitta doskada",
            "Har bir hujjatni saqlang va tasdiqlang — to‘liq tarix bilan",
            "Talabaga mos universitet, dastur va grantlarni tanlang",
            "Abituriyentlarni Telegram orqali avtomatik xabardor qiling",
          ],
        },
        {
          label: "Agentlar",
          heading: "Sub-agent va hamkorlar uchun",
          desc: "Har bir agentga alohida ish maydoni, talabalar ro‘yxati va komissiya hisobi.",
          points: [
            "Talabalarni agentlarga biriktiring va jarayonni kuzating",
            "Agent komissiyalari va filiallar ulushini hisoblang",
            "Butun jamoa bo‘ylab eslatma va vazifalarni ulashing",
            "To‘lovlarni real vaqtda ko‘p valyutada sinxronlang",
          ],
        },
        {
          label: "Talabalar",
          heading: "Abituriyentlar uchun",
          desc: "Shaxsiy kabinet — talaba arizasi qaysi bosqichda ekanini aniq ko‘radi.",
          points: [
            "Ariza holatini bosqichma-bosqich kuzating",
            "Yetishmayotgan hujjatlarni istalgan qurilmadan yuklang",
            "Universitet, grant, ish va turar joyni ko‘rib chiqing",
            "Uchishdan oldin kutib olish va transfer ma‘lumotini oling",
          ],
        },
        {
          label: "Menejer va adminlar",
          heading: "Platforma va agentlik administratorlari uchun",
          desc: "Barcha agentlik, filial va jamoalarni bitta paneldan yaxlit ko‘ring.",
          points: [
            "Biznes holatini jonli grafiklarda kuzating",
            "Foydalanuvchilar uchun rol va ruxsatlarni belgilang",
            "Ko‘p valyutali moliyani bir zumda jamlang",
            "Yangi filiallarni bir necha daqiqada ishga tushiring",
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
            "UniPath qog'ozbozlikni ikki barobar qisqartirdi. Har bir abituriyentning bitta ishi bor va konsultant bilan elchixona orasida hech narsa yo'qolmaydi.",
          name: "Dilnoza Karimova",
          role: "Direktor, Bright Future Education",
        },
        {
          quote:
            "Vizalar va hujjatlar uchun yagona jarayon. Endi Samarqanddagi agentlarni tartibsizliksiz muvofiqlashtiramiz.",
          name: "Jasur Rahimov",
          role: "Asoschi, Silk Road Education",
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
      tagline: "Xorijda ta‘lim konsalting agentliklari uchun yagona SaaS platformasi.",
      emailPlaceholder: "Email manzilingiz",
      getStarted: "Boshlash",
      columns: [
        {
          title: "Yechimlar",
          links: ["UniPath Core", "Arizalar voronkasi", "Hujjatlar nazorati", "Universitetlar va grantlar", "Viza va kutib olish", "Integratsiyalar"],
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
