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
        { id: "core", label: "Core" },
        { id: "nova", label: "NOVA" },
        { id: "unitour", label: "UniTour" },
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
      metrics: [
        { title: "Smart CRM", desc: "Track leads and clients automatically." },
        { title: "Effortless Accounting", desc: "Real-time P&L and multi-branch finance." },
        { title: "AI Integrations", desc: "Telegram bot and AI camera attendance." },
      ],
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
          label: "For Schools & Academies (NOVA)",
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
          label: "For Travel Agencies (UniTour)",
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
      tagline: "A unified SaaS ecosystem for business, education and travel.",
      emailPlaceholder: "Enter Your Email",
      getStarted: "Get Started",
      columns: [
        {
          title: "Solutions",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "Integrations"],
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
        { id: "core", label: "Core" },
        { id: "nova", label: "NOVA" },
        { id: "unitour", label: "UniTour" },
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
      metrics: [
        { title: "Умная CRM", desc: "Автоматически отслеживайте лиды и клиентов." },
        { title: "Простой учёт", desc: "P&L в реальном времени и финансы по филиалам." },
        { title: "AI-интеграции", desc: "Telegram-бот и AI-камера для посещаемости." },
      ],
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
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "Интеграции"],
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
        { id: "core", label: "Core" },
        { id: "nova", label: "NOVA" },
        { id: "unitour", label: "UniTour" },
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
      metrics: [
        { title: "Aqlli CRM", desc: "Lidlar va mijozlarni avtomatik kuzating." },
        { title: "Oson buxgalteriya", desc: "Real vaqtda P&L va filiallar moliyasi." },
        { title: "AI integratsiyalar", desc: "Telegram bot va AI kamera davomati." },
      ],
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
      tagline: "Biznes, ta'lim va sayohat uchun yagona SaaS ekotizimi.",
      emailPlaceholder: "Email manzilingiz",
      getStarted: "Boshlash",
      columns: [
        {
          title: "Yechimlar",
          links: ["UniPath Core", "NOVA Edu", "UniTour Travel", "Integratsiyalar"],
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
