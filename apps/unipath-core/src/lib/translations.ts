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
      badge: "The operating system for study-abroad agencies",
      title: "Every applicant, from first enquiry to boarding the plane",
      description:
        "One pipeline for leads, documents, university applications, visas and payments — so nothing about a student lives in someone's notebook.",
      cta: "See the platform",
      painLine: "Applicant files in Excel, documents in Telegram, payments in a notebook? Bring the whole journey into one system.",
      metrics: [
        { title: "Applications pipeline", desc: "Lead, contact, documents, visa, enrolment." },
        { title: "Document control", desc: "Upload, review and approve — with a full history." },
        { title: "Telegram built in", desc: "Applicants hear from your own bot, automatically." },
      ],
    },
    stats: {
      items: [
        { value: "5 min", label: "to put your agency online" },
        { value: "6", label: "stages from lead to enrolment" },
        { value: "3", label: "languages — Uzbek, Russian, English" },
        { value: "0", label: "applicant files left in a notebook" },
      ],
    },
    applicantPortal: {
      badge: "Applicant portal",
      title: "Your applicant can see exactly where their file stands",
      subtitle:
        "Every student gets their own login. No more \"what is happening with my documents?\" calls — they open the portal and see the answer, and your bot tells them the moment it changes.",
      points: [
        "Live status: lead, contact, documents, visa, enrolment",
        "Missing documents uploaded from a phone, straight into your review queue",
        "Universities, grants, jobs and housing browsable in one place",
        "Telegram messages sent from your agency's own bot, automatically",
      ],
      note: "Included in every plan — the portal is branded as your agency.",
      cardLabel: "Application status",
      cardName: "Jasur Karimov · Germany, Bachelor",
      steps: [
        "Enquiry received",
        "Consultant assigned",
        "Documents approved",
        "Visa in progress",
        "Enrolled",
        "Departure arranged",
      ],
    },
    demo: {
      trigger: "Book a Demo",
      title: "Request a free demo",
      subtitle: "Leave your details and our team will show you UniPath for your business within 24 hours.",
      name: "Your name",
      namePh: "e.g. Aziz Karimov",
      phone: "Phone",
      phonePh: "+998 90 123 45 67",
      business: "Agency name",
      businessPh: "e.g. Bright Future Education…",
      message: "Message (optional)",
      messagePh: "Tell us a bit about what you need…",
      submit: "Send request",
      submitting: "Sending…",
      success: "Request sent! We will contact you shortly.",
      error: "Could not send the request. Please try again or reach us by phone.",
    },
    modules: {
      badge: "What is inside",
      title: "Everything the agency runs on",
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
      title: "Konsultantning kunini qisqartiradigan imkoniyatlar",
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
      title: "Agentligingizni bir tizimga jamlang",
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
      badge: "Операционная система для агентств по обучению за рубежом",
      title: "Каждый абитуриент — от первой заявки до вылета",
      description:
        "Одна воронка для лидов, документов, заявок в университеты, виз и платежей — чтобы данные о студенте не жили в чьём-то блокноте.",
      cta: "Посмотреть платформу",
      painLine: "Дела абитуриентов в Excel, документы в Telegram, платежи в тетради? Соберите весь путь в одной системе.",
      metrics: [
        { title: "Воронка заявок", desc: "Лид, контакт, документы, виза, зачисление." },
        { title: "Контроль документов", desc: "Загрузка, проверка и утверждение — с историей." },
        { title: "Telegram внутри", desc: "Абитуриенты получают сообщения от вашего бота." },
      ],
    },
    stats: {
      items: [
        { value: "5 мин", label: "чтобы вывести агентство онлайн" },
        { value: "6", label: "этапов от лида до зачисления" },
        { value: "3", label: "языка — узбекский, русский, английский" },
        { value: "0", label: "дел абитуриентов остаётся в тетради" },
      ],
    },
    applicantPortal: {
      badge: "Кабинет абитуриента",
      title: "Абитуриент сам видит, на каком этапе его дело",
      subtitle:
        "У каждого студента свой вход. Больше никаких звонков «что с моими документами?» — он открывает кабинет и видит ответ, а бот сообщает об изменении сразу.",
      points: [
        "Статус в реальном времени: лид, контакт, документы, виза, зачисление",
        "Недостающие документы загружаются с телефона прямо к вам на проверку",
        "Университеты, гранты, работа и жильё — в одном месте",
        "Сообщения в Telegram от бота вашего агентства, автоматически",
      ],
      note: "Входит в любой тариф — кабинет оформлен под ваш бренд.",
      cardLabel: "Статус заявки",
      cardName: "Жасур Каримов · Германия, бакалавр",
      steps: [
        "Заявка получена",
        "Назначен консультант",
        "Документы приняты",
        "Виза в процессе",
        "Зачислен",
        "Вылет организован",
      ],
    },
    demo: {
      trigger: "Заказать демо",
      title: "Запросить бесплатное демо",
      subtitle: "Оставьте контакты — наша команда покажет UniPath для вашего агентства в течение 24 часов.",
      name: "Ваше имя",
      namePh: "напр. Азиз Каримов",
      phone: "Телефон",
      phonePh: "+998 90 123 45 67",
      business: "Название агентства",
      businessPh: "напр. Bright Future Education…",
      message: "Сообщение (необязательно)",
      messagePh: "Коротко опишите, что вам нужно…",
      submit: "Отправить запрос",
      submitting: "Отправка…",
      success: "Запрос отправлен! Мы скоро свяжемся с вами.",
      error: "Не удалось отправить запрос. Попробуйте ещё раз или позвоните нам.",
    },
    modules: {
      badge: "Что внутри",
      title: "Всё, на чём работает агентство",
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
      title: "Возможности, которые экономят день консультанта",
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
      title: "Соберите агентство в одну систему",
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
      badge: "Xorijda ta'lim konsalting agentliklari uchun tizim",
      title: "Har bir abituriyent — birinchi murojaatdan samolyotgacha",
      description:
        "Lidlar, hujjatlar, universitet arizalari, viza va to'lovlar — hammasi bitta voronkada. Talaba haqidagi ma'lumot endi hech kimning daftarida qolmaydi.",
      cta: "Tizimni bepul sinab ko'ring",
      painLine: "Abituriyentlar Excel'da, hujjatlar Telegram'da, to'lovlar daftarda? Butun jarayonni bitta tizimga jamlang.",
      metrics: [
        { title: "Arizalar voronkasi", desc: "Lid, aloqa, hujjat, viza, o'qishga kirish." },
        { title: "Hujjatlar nazorati", desc: "Yuklash, tekshirish, tasdiqlash — tarixi bilan." },
        { title: "Telegram ichida", desc: "Abituriyentlar sizning botingizdan xabar oladi." },
      ],
    },
    stats: {
      items: [
        { value: "5 daqiqa", label: "agentligingiz onlayn ishga tushadi" },
        { value: "6", label: "bosqich — liddan o'qishga kirishgacha" },
        { value: "3", label: "til — o'zbek, rus, ingliz" },
        { value: "0", label: "abituriyent ishi daftarda qolmaydi" },
      ],
    },
    applicantPortal: {
      badge: "Talaba kabineti",
      title: "Abituriyent o'z ishi qaysi bosqichda ekanini o'zi ko'radi",
      subtitle:
        "Har bir talabaning o'z kirishi bor. \"Hujjatlarim nima bo'ldi?\" degan qo'ng'iroqlar tugaydi — u kabinetni ochib javobni ko'radi, o'zgarish bo'lsa bot darrov xabar beradi.",
      points: [
        "Jonli holat: lid, aloqa, hujjatlar, viza, o'qishga kirish",
        "Yetishmayotgan hujjat telefondan yuklanadi — to'g'ridan-to'g'ri tekshiruvingizga",
        "Universitet, grant, ish va turar joy — bitta joyda",
        "Telegram xabarlari agentligingizning o'z botidan, avtomatik",
      ],
      note: "Har bir tarifga kiradi — kabinet sizning brendingizda.",
      cardLabel: "Ariza holati",
      cardName: "Jasur Karimov · Germaniya, bakalavr",
      steps: [
        "Murojaat qabul qilindi",
        "Konsultant biriktirildi",
        "Hujjatlar tasdiqlandi",
        "Viza jarayonda",
        "O'qishga qabul qilindi",
        "Yo'lga tayyor",
      ],
    },
    demo: {
      trigger: "Demo buyurtma qilish",
      title: "Bepul demo so'rang",
      subtitle: "Ma'lumotlaringizni qoldiring — jamoamiz 24 soat ichida UniPath'ni agentligingiz uchun ko'rsatadi.",
      name: "Ismingiz",
      namePh: "masalan, Aziz Karimov",
      phone: "Telefon",
      phonePh: "+998 90 123 45 67",
      business: "Agentlik nomi",
      businessPh: "masalan, Bright Future Education…",
      message: "Xabar (ixtiyoriy)",
      messagePh: "Sizga nima kerakligini qisqacha yozing…",
      submit: "So'rovni yuborish",
      submitting: "Yuborilmoqda…",
      success: "So'rov yuborildi! Tez orada bog'lanamiz.",
      error: "So'rovni yuborib bo'lmadi. Qayta urinib ko'ring yoki telefon orqali bog'laning.",
    },
    modules: {
      badge: "Tizim tarkibi",
      title: "Agentlik ishlaydigan hamma narsa",
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
      title: "Konsultantning kunini qisqartiradigan imkoniyatlar",
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
      title: "Agentligingizni bir tizimga jamlang",
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
