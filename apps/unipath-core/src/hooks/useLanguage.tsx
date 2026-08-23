import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type Language = "uz" | "ru" | "en";

const translations = {
  // Auth
  "auth.welcome_back": { uz: "Xush kelibsiz, tizimga kiring", ru: "С возвращением, войдите в систему", en: "Welcome back, sign in to continue" },
  "auth.create_account": { uz: "NOVA hisobingizni yarating", ru: "Создайте аккаунт NOVA", en: "Create your NOVA account" },
  "auth.sign_in": { uz: "Kirish", ru: "Войти", en: "Sign In" },
  "auth.sign_up": { uz: "Ro'yxatdan o'tish", ru: "Регистрация", en: "Sign Up" },
  "auth.email": { uz: "Elektron pochta", ru: "Электронная почта", en: "Email" },
  "auth.password": { uz: "Parol", ru: "Пароль", en: "Password" },
  "auth.full_name": { uz: "To'liq ism", ru: "Полное имя", en: "Full Name" },
  "auth.no_account": { uz: "Hisobingiz yo'qmi?", ru: "Нет аккаунта?", en: "Don't have an account?" },
  "auth.have_account": { uz: "Hisobingiz bormi?", ru: "Уже есть аккаунт?", en: "Already have an account?" },
  "auth.forgot_password": { uz: "Parolni unutdingizmi?", ru: "Забыли пароль?", en: "Forgot password?" },
  "auth.reset_password": { uz: "Parolni tiklash", ru: "Сброс пароля", en: "Reset Password" },
  "auth.send_reset": { uz: "Tiklash havolasini yuborish", ru: "Отправить ссылку для сброса", en: "Send Reset Link" },
  "auth.new_password": { uz: "Yangi parol", ru: "Новый пароль", en: "New Password" },
  "auth.confirm_password": { uz: "Parolni tasdiqlang", ru: "Подтвердите пароль", en: "Confirm Password" },
  "auth.update_password": { uz: "Parolni yangilash", ru: "Обновить пароль", en: "Update Password" },
  "auth.reset_sent": { uz: "Tiklash havolasi yuborildi!", ru: "Ссылка для сброса отправлена!", en: "Reset link sent!" },
  "auth.password_updated": { uz: "Parol yangilandi!", ru: "Пароль обновлён!", en: "Password updated!" },
  "auth.account_created": { uz: "Hisob yaratildi! Endi kirishingiz mumkin.", ru: "Аккаунт создан! Теперь можете войти.", en: "Account created! You can now sign in." },
  "auth.welcome": { uz: "Xush kelibsiz!", ru: "Добро пожаловать!", en: "Welcome back!" },
  "auth.founded_by": { uz: "Asoschisi: Hasanov Behruz Feruzovich", ru: "Основатель: Хасанов Бехруз Ферузович", en: "Founded by Hasanov Behruz Feruzovich" },
  "auth.back_to_login": { uz: "Kirishga qaytish", ru: "Вернуться к входу", en: "Back to login" },

  // Navigation
  "nav.dashboard": { uz: "Boshqaruv paneli", ru: "Панель управления", en: "Dashboard" },
  "nav.admin": { uz: "Admin", ru: "Админ", en: "Admin" },
  "nav.teacher": { uz: "O'qituvchi", ru: "Учитель", en: "Teacher" },
  "nav.student": { uz: "Talaba", ru: "Студент", en: "Student" },
  "nav.parent": { uz: "Ota-ona", ru: "Родитель", en: "Parent" },
  "nav.sign_out": { uz: "Chiqish", ru: "Выйти", en: "Sign out" },
  "nav.settings": { uz: "Sozlamalar", ru: "Настройки", en: "Settings" },

  // Student Dashboard
  "student.check_in": { uz: "Check-in", ru: "Отметиться", en: "Check-in" },
  "student.evolution": { uz: "Rivojlanish", ru: "Развитие", en: "Evolution" },
  "student.store": { uz: "Do'kon", ru: "Магазин", en: "Store" },
  "student.alerts": { uz: "Bildirishnomalar", ru: "Уведомления", en: "Alerts" },
  "student.no_classes": { uz: "Bugungi darslar yo'q", ru: "На сегодня уроков нет", en: "No classes scheduled for today" },
  "student.notifications": { uz: "Bildirishnomalar", ru: "Уведомления", en: "Notifications" },
  "student.all_caught_up": { uz: "Hammasi o'qildi! 🎉", ru: "Всё прочитано! 🎉", en: "All caught up! 🎉" },
  "student.schedule": { uz: "Dars jadvali", ru: "Расписание", en: "Schedule" },
  "student.today_schedule": { uz: "Bugungi dars jadvali", ru: "Расписание на сегодня", en: "Today's Schedule" },
  "student.no_schedule": { uz: "Bugun darslar yo'q", ru: "На сегодня уроков нет", en: "No classes scheduled today" },
  "student.progress": { uz: "Progress", ru: "Прогресс", en: "Progress" },
  "student.progress_compass": { uz: "Progress kompasi", ru: "Компас прогресса", en: "Progress Compass" },
  "student.avg_score": { uz: "O'rtacha ball", ru: "Средний балл", en: "avg score" },
  "student.homework": { uz: "Uy vazifasi", ru: "Домашнее задание", en: "Homework" },
  "student.payments": { uz: "To'lovlar", ru: "Платежи", en: "Payments" },
  "student.level": { uz: "Daraja", ru: "Уровень", en: "Level" },
  "student.average": { uz: "O'rtacha ball", ru: "Средний балл", en: "Average Score" },
  "student.attendance": { uz: "Davomat", ru: "Посещаемость", en: "Attendance" },
  "student.total_debt": { uz: "Umumiy qarz", ru: "Общий долг", en: "Total Debt" },
  "student.debt": { uz: "Qarz", ru: "Долг", en: "Debt" },
  "student.pay_now": { uz: "To'lash", ru: "Оплатить", en: "Pay Now" },
  "student.processing": { uz: "Jarayonda...", ru: "Обработка...", en: "Processing..." },
  "student.due": { uz: "Muddat", ru: "Срок", en: "Due" },
  "student.submit": { uz: "Topshirish", ru: "Отправить", en: "Submit" },
  "student.graded": { uz: "Baholangan", ru: "Оценено", en: "Graded" },
  "student.pending": { uz: "Kutilmoqda", ru: "Ожидание", en: "Pending" },
  "student.submitted": { uz: "Topshirildi", ru: "Отправлено", en: "Submitted" },
  "student.overdue": { uz: "Muddati o'tgan", ru: "Просрочено", en: "Overdue" },
  "student.paid": { uz: "To'langan", ru: "Оплачено", en: "Paid" },
  "student.upload_file": { uz: "Fayl yuklash", ru: "Загрузить файл", en: "Upload file" },
  "student.score": { uz: "Ball", ru: "Балл", en: "Score" },
  "student.live_now": { uz: "Hozir jonli", ru: "Сейчас в эфире", en: "Live Now" },
  "student.upcoming": { uz: "Kutilmoqda", ru: "Предстоящий", en: "Upcoming" },
  "student.present": { uz: "Kelgan", ru: "Присутствует", en: "Present" },
  "student.late": { uz: "Kechikkan", ru: "Опоздал", en: "Late" },
  "student.absent": { uz: "Kelmagan", ru: "Отсутствует", en: "Absent" },
  "student.live": { uz: "Jonli", ru: "Прямой эфир", en: "Live" },
  "student.missed_classes": { uz: "ta dars qoldirildi", ru: "пропущенных уроков в", en: "classes missed in" },
  "student.motivation_msg": { uz: "Siz {subject} fanida orqada qolmoqdasiz. Kelajakdagi o'zingiz sizga umid qilmoqda.", ru: "Вы отстаёте по {subject}. Ваше будущее «я» рассчитывает на вас.", en: "You are falling behind in {subject}. Your future self is counting on you." },
  "student.catch_up": { uz: "Qoplash", ru: "Наверстать", en: "Catch Up Now" },
  "student.dismiss": { uz: "Yopish", ru: "Закрыть", en: "Dismiss" },
  "student.trend_up": { uz: "O'sish", ru: "Рост", en: "up" },
  "student.trend_down": { uz: "Pasayish", ru: "Падение", en: "down" },
  "student.trend_stable": { uz: "Barqaror", ru: "Стабильно", en: "stable" },

  // Profile
  "profile.change_avatar": { uz: "Rasmni o'zgartirish", ru: "Изменить фото", en: "Change Avatar" },
  "profile.upload_photo": { uz: "Rasm yuklash", ru: "Загрузить фото", en: "Upload Photo" },
  "profile.avatar_updated": { uz: "Avatar yangilandi!", ru: "Аватар обновлён!", en: "Avatar updated!" },

  // Teacher
  "teacher.hub": { uz: "O'qituvchi markazi", ru: "Центр учителя", en: "Educator Hub" },
  "teacher.live": { uz: "Jonli", ru: "Прямой эфир", en: "Live" },
  "teacher.plan": { uz: "Jadval", ru: "Расписание", en: "Schedule" },
  "teacher.students": { uz: "Talabalar", ru: "Студенты", en: "Students" },
  "teacher.ai_planner": { uz: "Aqlli Rejalashtiruvchi", ru: "Умный Планировщик", en: "Smart Planner" },
  "teacher.current_classes": { uz: "Joriy darslar", ru: "Текущие уроки", en: "Current Classes" },
  "teacher.no_active": { uz: "Hozirda dars yo'q", ru: "Сейчас уроков нет", en: "No active classes right now" },
  "teacher.coming_up": { uz: "Keyingi darslar", ru: "Предстоящие", en: "Coming Up" },
  "teacher.all_lessons": { uz: "Barcha darslar", ru: "Все уроки", en: "All Lessons" },
  "teacher.no_lessons": { uz: "Darslar topilmadi", ru: "Уроки не найдены", en: "No lessons found" },
  "teacher.student_intel": { uz: "Talabalar tahlili", ru: "Анализ студентов", en: "Student Intelligence" },
  "teacher.top": { uz: "Eng yaxshi", ru: "Лучшие", en: "Top Performers" },
  "teacher.average": { uz: "O'rtacha", ru: "Средние", en: "Average" },
  "teacher.at_risk": { uz: "Xavfli", ru: "В зоне риска", en: "At Risk" },
  "teacher.presentations": { uz: "Prezentatsiya", ru: "Презентация", en: "Presentations" },
  "teacher.pres_title": { uz: "Avtomatik Taqdimot Generatori", ru: "Авто Генератор Презентаций", en: "Auto Presentation Generator" },
  "teacher.pres_desc": { uz: "Istalgan mavzuda prezentatsiya yarating", ru: "Создавайте презентации на любую тему", en: "Generate presentations on any topic" },
  "teacher.pres_topic": { uz: "Mavzu", ru: "Тема", en: "Topic" },
  "teacher.pres_topic_placeholder": { uz: "masalan: Quyosh tizimi", ru: "например: Солнечная система", en: "e.g. Solar System" },
  "teacher.pres_slides": { uz: "Slaydlar soni", ru: "Кол-во слайдов", en: "Slide Count" },
  "teacher.pres_slides_label": { uz: "slayd", ru: "слайдов", en: "slides" },
  "teacher.pres_style": { uz: "Uslub", ru: "Стиль", en: "Style" },
  "teacher.pres_style_edu": { uz: "Ta'limiy", ru: "Образовательный", en: "Educational" },
  "teacher.pres_style_pro": { uz: "Professional", ru: "Профессиональный", en: "Professional" },
  "teacher.pres_style_creative": { uz: "Ijodiy", ru: "Креативный", en: "Creative" },
  "teacher.pres_style_minimal": { uz: "Minimal", ru: "Минимальный", en: "Minimal" },
  "teacher.pres_generate": { uz: "Prezentatsiya yaratish", ru: "Создать презентацию", en: "Generate Presentation" },
  "teacher.pres_generating": { uz: "Yaratilmoqda...", ru: "Создаётся...", en: "Generating..." },
  "teacher.pres_slide": { uz: "Slayd", ru: "Слайд", en: "Slide" },
  "teacher.pres_prev": { uz: "Oldingi", ru: "Назад", en: "Prev" },
  "teacher.pres_next": { uz: "Keyingi", ru: "Далее", en: "Next" },
  "teacher.pres_download_pdf": { uz: "PDF yuklab olish", ru: "Скачать PDF", en: "Download PDF" },
  "teacher.pres_exporting": { uz: "PDF tayyorlanmoqda...", ru: "Подготовка PDF...", en: "Preparing PDF..." },
  "teacher.pres_exported": { uz: "PDF muvaffaqiyatli yuklandi!", ru: "PDF успешно скачан!", en: "PDF downloaded successfully!" },
  "teacher.pres_export_error": { uz: "PDF yuklab olishda xato", ru: "Ошибка при скачивании PDF", en: "Failed to export PDF" },
  "teacher.pres_swipe": { uz: "Suring", ru: "Листайте", en: "Swipe" },
  "teacher.pres_with_images": { uz: "Rasmlar bilan", ru: "С изображениями", en: "Include images" },
  "teacher.pres_style_scientific": { uz: "Ilmiy", ru: "Научный", en: "Scientific" },
  "teacher.pres_style_story": { uz: "Hikoya", ru: "Рассказ", en: "Storytelling" },

  // Admin
  "admin.command_center": { uz: "Boshqaruv markazi", ru: "Центр управления", en: "Command Center" },
  "admin.god_eye": { uz: "Admin ko'rinishi", ru: "Режим администратора", en: "Admin God-eye view" },
  "admin.total_users": { uz: "Jami foydalanuvchilar", ru: "Всего пользователей", en: "Total Users" },
  "admin.students": { uz: "Talabalar", ru: "Студенты", en: "Students" },
  "admin.teachers": { uz: "O'qituvchilar", ru: "Учителя", en: "Teachers" },
  "admin.live_now": { uz: "Hozir jonli", ru: "Сейчас в эфире", en: "Live Now" },
  "admin.upcoming": { uz: "kelayotgan", ru: "предстоящих", en: "upcoming" },
  "admin.novacoins": { uz: "NovaCoins", ru: "NovaCoins", en: "NovaCoins" },
  "admin.attendance_rate": { uz: "Davomat foizi", ru: "Процент посещаемости", en: "Attendance Rate" },
  "admin.overall_checkin": { uz: "Umumiy check-in", ru: "Общая регистрация", en: "Overall check-in rate" },
  "admin.rooms": { uz: "Xonalar", ru: "Комнаты", en: "Rooms" },
  "admin.configured_spaces": { uz: "Sozlangan xonalar", ru: "Настроенные помещения", en: "Configured spaces" },
  "admin.room_overview": { uz: "Xonalar ko'rinishi", ru: "Обзор комнат", en: "Room Overview" },
  "admin.user_management": { uz: "Foydalanuvchilar", ru: "Управление пользователями", en: "User Management" },
  "admin.no_rooms": { uz: "Xonalar sozlanmagan", ru: "Комнаты не настроены", en: "No rooms configured yet" },
  "admin.no_users": { uz: "Foydalanuvchilar yo'q", ru: "Пользователей пока нет", en: "No users yet" },
  "admin.toggle_roles": { uz: "Rollarni o'zgartirish:", ru: "Управление ролями:", en: "Toggle roles:" },
  "admin.users_count": { uz: "foydalanuvchi", ru: "пользователей", en: "users" },
  "admin.chart_revenue": { uz: "Moliya grafigi", ru: "Финансовый график", en: "Revenue Chart" },
  "admin.chart_monthly": { uz: "Oylik to'lovlar", ru: "Ежемесячные платежи", en: "Monthly payments" },
  "admin.chart_collected": { uz: "Yig'ilgan", ru: "Собрано", en: "Collected" },
  "admin.chart_outstanding": { uz: "Qarzdorlik", ru: "Задолженность", en: "Outstanding" },
  "admin.chart_attendance": { uz: "Davomat grafigi", ru: "График посещаемости", en: "Attendance Chart" },
  "admin.chart_weekly": { uz: "Haftalik ko'rsatkich", ru: "Еженедельные показатели", en: "Weekly metrics" },
  "admin.chart_distribution": { uz: "Rol taqsimoti", ru: "Распределение ролей", en: "Role Distribution" },
  "admin.chart_by_role": { uz: "Rollar bo'yicha", ru: "По ролям", en: "By role type" },
  "admin.chart_mon": { uz: "Dush", ru: "Пн", en: "Mon" },
  "admin.chart_tue": { uz: "Sesh", ru: "Вт", en: "Tue" },
  "admin.chart_wed": { uz: "Chor", ru: "Ср", en: "Wed" },
  "admin.chart_thu": { uz: "Pay", ru: "Чт", en: "Thu" },
  "admin.chart_fri": { uz: "Jum", ru: "Пт", en: "Fri" },
  "admin.chart_sat": { uz: "Shan", ru: "Сб", en: "Sat" },

  // Admin CRUD
  "admin.add_room": { uz: "Xona qo'shish", ru: "Добавить комнату", en: "Add Room" },
  "admin.edit_room": { uz: "Xonani tahrirlash", ru: "Редактировать комнату", en: "Edit Room" },
  "admin.room_name": { uz: "Xona nomi", ru: "Название комнаты", en: "Room name" },
  "admin.room_capacity": { uz: "Sig'imi", ru: "Вместимость", en: "Capacity" },
  "admin.room_floor": { uz: "Qavat", ru: "Этаж", en: "Floor" },
  "admin.room_created": { uz: "Xona yaratildi!", ru: "Комната создана!", en: "Room created!" },
  "admin.room_updated": { uz: "Xona yangilandi!", ru: "Комната обновлена!", en: "Room updated!" },
  "admin.room_deleted": { uz: "Xona o'chirildi!", ru: "Комната удалена!", en: "Room deleted!" },
  "admin.save_changes": { uz: "Saqlash", ru: "Сохранить", en: "Save Changes" },
  "admin.create": { uz: "Yaratish", ru: "Создать", en: "Create" },
  "admin.lessons": { uz: "Darslar", ru: "Уроки", en: "Lessons" },
  "admin.total_lessons": { uz: "jami darslar", ru: "всего уроков", en: "total lessons" },
  "admin.add_lesson": { uz: "Dars qo'shish", ru: "Добавить урок", en: "Add Lesson" },
  "admin.edit_lesson": { uz: "Darsni tahrirlash", ru: "Редактировать урок", en: "Edit Lesson" },
  "admin.lesson_title": { uz: "Dars nomi", ru: "Название урока", en: "Lesson title" },
  "admin.lesson_topic": { uz: "Mavzu", ru: "Тема", en: "Topic" },
  "admin.start_time": { uz: "Boshlanish", ru: "Начало", en: "Start" },
  "admin.end_time": { uz: "Tugash", ru: "Конец", en: "End" },
  "admin.select_subject": { uz: "Fan tanlash", ru: "Выберите предмет", en: "Select subject" },
  "admin.select_teacher": { uz: "O'qituvchi tanlash", ru: "Выберите учителя", en: "Select teacher" },
  "admin.select_room": { uz: "Xona tanlash", ru: "Выберите комнату", en: "Select room" },
  "admin.fill_required": { uz: "Majburiy maydonlarni to'ldiring", ru: "Заполните обязательные поля", en: "Fill required fields" },
  "admin.lesson_created": { uz: "Dars yaratildi!", ru: "Урок создан!", en: "Lesson created!" },
  "admin.lesson_updated": { uz: "Dars yangilandi!", ru: "Урок обновлён!", en: "Lesson updated!" },
  "admin.lesson_deleted": { uz: "Dars o'chirildi!", ru: "Урок удалён!", en: "Lesson deleted!" },
  "admin.completed": { uz: "Tugallangan", ru: "Завершено", en: "Completed" },

  // Subjects CRUD
  "admin.subjects": { uz: "Fanlar", ru: "Предметы", en: "Subjects" },
  "admin.total_subjects": { uz: "jami fanlar", ru: "всего предметов", en: "total subjects" },
  "admin.add_subject": { uz: "Fan qo'shish", ru: "Добавить предмет", en: "Add Subject" },
  "admin.edit_subject": { uz: "Fanni tahrirlash", ru: "Редактировать предмет", en: "Edit Subject" },
  "admin.subject_name": { uz: "Fan nomi", ru: "Название предмета", en: "Subject name" },
  "admin.subject_code": { uz: "Kod (ixtiyoriy)", ru: "Код (опционально)", en: "Code (optional)" },
  "admin.subject_desc": { uz: "Tavsif (ixtiyoriy)", ru: "Описание (опционально)", en: "Description (optional)" },
  "admin.subject_created": { uz: "Fan yaratildi!", ru: "Предмет создан!", en: "Subject created!" },
  "admin.subject_updated": { uz: "Fan yangilandi!", ru: "Предмет обновлён!", en: "Subject updated!" },
  "admin.subject_deleted": { uz: "Fan o'chirildi!", ru: "Предмет удалён!", en: "Subject deleted!" },
  "admin.no_subjects": { uz: "Fanlar yo'q", ru: "Предметов нет", en: "No subjects yet" },

  // Groups CRUD
  "admin.groups": { uz: "Guruhlar", ru: "Группы", en: "Groups" },
  "admin.total_groups": { uz: "jami guruhlar", ru: "всего групп", en: "total groups" },
  "admin.add_group": { uz: "Guruh qo'shish", ru: "Добавить группу", en: "Add Group" },
  "admin.edit_group": { uz: "Guruhni tahrirlash", ru: "Редактировать группу", en: "Edit Group" },
  "admin.group_name": { uz: "Guruh nomi", ru: "Название группы", en: "Group name" },
  "admin.group_desc": { uz: "Tavsif", ru: "Описание", en: "Description" },
  "admin.group_created": { uz: "Guruh yaratildi!", ru: "Группа создана!", en: "Group created!" },
  "admin.group_updated": { uz: "Guruh yangilandi!", ru: "Группа обновлена!", en: "Group updated!" },
  "admin.group_deleted": { uz: "Guruh o'chirildi!", ru: "Группа удалена!", en: "Group deleted!" },
  "admin.no_groups": { uz: "Guruhlar yo'q", ru: "Групп нет", en: "No groups yet" },

  // QR Manager
  "admin.qr_manager": { uz: "QR boshqaruvi", ru: "Управление QR", en: "QR Manager" },
  "admin.qr_manager_desc": { uz: "Har xona uchun QR + check-in yoqish/o'chirish", ru: "QR для каждой комнаты + вкл/выкл регистрации", en: "Per-room QR + toggle check-in" },
  "admin.checkin_enabled": { uz: "Check-in yoqildi", ru: "Регистрация включена", en: "Check-in enabled" },
  "admin.checkin_disabled": { uz: "Check-in o'chirildi", ru: "Регистрация выключена", en: "Check-in disabled" },
  "admin.turn_on": { uz: "Yoqish", ru: "Вкл", en: "Turn on" },
  "admin.turn_off": { uz: "O'chirish", ru: "Выкл", en: "Turn off" },
  "admin.qr_zoom_desc": { uz: "Bu QR kodni xona devoriga osib qo'ying. Talabalar telefon kamerasi bilan o'qiydi.", ru: "Распечатайте и повесьте на стену комнаты. Студенты сканируют камерой телефона.", en: "Print and place on the room wall. Students scan with phone camera." },
  "admin.download_qr": { uz: "QR yuklab olish", ru: "Скачать QR", en: "Download QR" },

  // Parent
  "parent.live_mirror": { uz: "Jonli ko'zgu", ru: "Зеркало в реальном времени", en: "Live Mirror" },
  "parent.realtime_tracking": { uz: "Real-time kuzatuv", ru: "Отслеживание в реальном времени", en: "Real-time child tracking" },
  "parent.in_school": { uz: "Maktabda", ru: "В школе", en: "In School" },
  "parent.checked_out": { uz: "Chiqib ketgan", ru: "Ушёл", en: "Checked Out" },
  "parent.absent": { uz: "Kelmagan", ru: "Отсутствует", en: "Absent" },
  "parent.last_checkin": { uz: "Oxirgi kirish", ru: "Последний вход", en: "Last Check-in" },
  "parent.last_checkout": { uz: "Oxirgi chiqish", ru: "Последний выход", en: "Last Check-out" },
  "parent.still_in_school": { uz: "Hali maktabda", ru: "Ещё в школе", en: "Still in school" },
  "parent.overall_grade": { uz: "Umumiy baho", ru: "Общая оценка", en: "Overall Grade" },
  "parent.attendance_rate": { uz: "Davomat foizi", ru: "Процент посещаемости", en: "Attendance Rate" },
  "parent.academic_wellbeing": { uz: "Akademik holat", ru: "Академическое самочувствие", en: "Academic Wellbeing" },
  "parent.subject_health": { uz: "Fanlar holati", ru: "Состояние предметов", en: "Subject Health" },
  "parent.activity_feed": { uz: "Faoliyat tarixi", ru: "Лента активности", en: "Activity Feed" },
  "parent.gps_face_verified": { uz: "GPS + Face-ID tasdiqlangan", ru: "GPS + Face-ID подтверждено", en: "GPS + Face-ID verified" },
  "parent.thriving": { uz: "A'lo", ru: "Отлично", en: "Thriving" },
  "parent.doing_well": { uz: "Yaxshi", ru: "Хорошо", en: "Doing Well" },
  "parent.needs_support": { uz: "Yordam kerak", ru: "Нужна поддержка", en: "Needs Support" },

  // Evolution
  "evolution.title": { uz: "Rivojlanish xaritasi", ru: "Карта развития", en: "Evolution Map" },
  "evolution.courses": { uz: "Kurslar", ru: "Курсы", en: "Courses" },
  "evolution.progress": { uz: "Progress", ru: "Прогресс", en: "Progress" },
  "evolution.portfolio": { uz: "Portfolio", ru: "Портфолио", en: "Portfolio" },
  "evolution.on_track": { uz: "Yo'lda", ru: "На пути", en: "On Track" },
  "evolution.needs_attention": { uz: "E'tibor kerak", ru: "Требует внимания", en: "Needs Attention" },
  "evolution.at_risk": { uz: "Xavfli", ru: "В зоне риска", en: "At Risk" },
  "evolution.overall_progress": { uz: "Umumiy progress", ru: "Общий прогресс", en: "Overall Progress" },
  "evolution.course_breakdown": { uz: "Kurs tahlili", ru: "Разбивка по курсам", en: "Course Breakdown" },
  "evolution.certificates": { uz: "Sertifikatlar", ru: "Сертификаты", en: "Digital Certificates" },
  "evolution.completed": { uz: "Tugatilgan kurslar", ru: "Завершённые курсы", en: "Courses Completed" },
  "evolution.total_hours": { uz: "Jami soatlar", ru: "Всего часов", en: "Total Hours" },
  "evolution.current_streak": { uz: "Joriy seriya", ru: "Текущая серия", en: "Current Streak" },
  "evolution.lessons": { uz: "darslar", ru: "уроков", en: "lessons" },
  "evolution.traffic_light": { uz: "Svetofor ko'rinishi", ru: "Светофорный обзор", en: "Traffic Light Overview" },

  // Store
  "store.title": { uz: "Nova-Do'kon", ru: "Nova-Магазин", en: "Nova-Store" },
  "store.earn_spend": { uz: "Ishlab topish, sarflash, rivojlanish", ru: "Зарабатывай, трать, развивайся", en: "Earn, spend, evolve" },
  "store.wallet": { uz: "💰 Hamyon", ru: "💰 Кошелёк", en: "💰 Wallet" },
  "store.store": { uz: "🛍️ Do'kon", ru: "🛍️ Магазин", en: "🛍️ Store" },
  "store.history": { uz: "📜 Tarix", ru: "📜 История", en: "📜 History" },
  "store.balance": { uz: "Joriy balans", ru: "Текущий баланс", en: "Current Balance" },
  "store.total_earned": { uz: "Jami topilgan", ru: "Всего заработано", en: "Total Earned" },
  "store.total_spent": { uz: "Jami sarflangan", ru: "Всего потрачено", en: "Total Spent" },
  "store.how_to_earn": { uz: "Qanday ishlash mumkin", ru: "Как заработать", en: "How to Earn" },
  "store.buy": { uz: "Sotib olish", ru: "Купить", en: "Buy" },
  "store.not_enough": { uz: "Yetarli emas", ru: "Недостаточно", en: "Not enough" },
  "store.popular": { uz: "Mashhur", ru: "Популярный", en: "Popular" },
  "store.earning_history": { uz: "Ishlash tarixi", ru: "История заработка", en: "Earning History" },
  "store.all": { uz: "Hammasi", ru: "Все", en: "All" },
  "store.merch": { uz: "Kiyimlar", ru: "Мерч", en: "Merch" },
  "store.digital": { uz: "Raqamli", ru: "Цифровые", en: "Digital" },
  "store.rewards": { uz: "Mukofotlar", ru: "Награды", en: "Rewards" },

  // QR Checkin
  "qr.scan_title": { uz: "QR kodni skanerlang", ru: "Сканируйте QR-код", en: "Scan QR Code" },
  "qr.scan_desc": { uz: "Kamerani sinf QR kodiga yo'naltiring", ru: "Наведите камеру на QR-код класса", en: "Point your camera at the classroom QR code" },
  "qr.simulate": { uz: "Skanerlashni simulyatsiya qilish", ru: "Симулировать сканирование", en: "Simulate Scan" },
  "qr.face_title": { uz: "Yuzni tekshirish", ru: "Проверка лица", en: "Face Verification" },
  "qr.face_desc": { uz: "Shaxsingiz tasdiqlanmoqda...", ru: "Проверка вашей личности...", en: "Verifying your identity..." },
  "qr.success_title": { uz: "Ro'yxatdan o'tdingiz!", ru: "Отмечено!", en: "Checked In!" },
  "qr.success_desc": { uz: "Davomat muvaffaqiyatli qayd etildi", ru: "Посещаемость успешно записана", en: "Attendance recorded successfully" },
  "qr.done": { uz: "Tayyor", ru: "Готово", en: "Done" },
  "qr.camera_denied": { uz: "Kameraga ruxsat berilmadi", ru: "Доступ к камере запрещён", en: "Camera permission denied" },
  "qr.invalid": { uz: "QR kod noto'g'ri yoki xona topilmadi", ru: "Неверный QR или комната не найдена", en: "Invalid QR or room not found" },
  "qr.checkin_off": { uz: "Bu xonada check-in o'chirilgan", ru: "Регистрация в этой комнате отключена", en: "Check-in is disabled for this room" },
  "qr.error": { uz: "Xato", ru: "Ошибка", en: "Error" },
  "qr.retry": { uz: "Qayta urinish", ru: "Повторить", en: "Retry" },
  "qr.online": { uz: "Onlayn", ru: "Онлайн", en: "Online" },
  "qr.offline": { uz: "Oflayn", ru: "Офлайн", en: "Offline" },
  "qr.offline_msg": { uz: "Internet yo'q — davomat saqlandi va aloqa tiklanganda yuboriladi", ru: "Нет связи — посещаемость сохранена и будет отправлена при подключении", en: "Offline — attendance saved and will sync when connection returns" },
  "qr.queued_title": { uz: "Navbatda saqlandi", ru: "Сохранено в очереди", en: "Saved offline" },
  "qr.queued_desc": { uz: "Aloqa tiklanganda avtomatik yuboriladi", ru: "Будет отправлено при восстановлении связи", en: "Will sync automatically when online" },
  "qr.retry_now": { uz: "Hozir yuborish", ru: "Отправить сейчас", en: "Send now" },
  "qr.retry_queue": { uz: "Yuborish", ru: "Отправить", en: "Sync" },
  "qr.synced": { uz: "ta yozuv yuborildi", ru: "записей отправлено", en: "records synced" },

  // Theme
  "theme.dark": { uz: "Qorong'i", ru: "Тёмная", en: "Dark" },
  "theme.light": { uz: "Yorug'", ru: "Светлая", en: "Light" },

  // Profile page
  "profile.title": { uz: "Mening kabinetim", ru: "Мой кабинет", en: "My Profile" },
  "profile.no_name": { uz: "Ismsiz foydalanuvchi", ru: "Без имени", en: "Unnamed user" },
  "profile.your_stats": { uz: "Sizning statistikangiz", ru: "Ваша статистика", en: "Your Stats" },
  "profile.quick_actions": { uz: "Tezkor harakatlar", ru: "Быстрые действия", en: "Quick Actions" },
  "profile.linked_children": { uz: "Bog'langan farzandlar", ru: "Привязанные дети", en: "Linked children" },
  "profile.edit_section": { uz: "Profilni tahrirlash", ru: "Редактировать профиль", en: "Edit Profile" },
  "profile.change_password": { uz: "Parolni o'zgartirish", ru: "Сменить пароль", en: "Change Password" },
  "profile.name_updated": { uz: "Ism yangilandi!", ru: "Имя обновлено!", en: "Name updated!" },
  "profile.pwd_mismatch": { uz: "Parollar mos kelmaydi", ru: "Пароли не совпадают", en: "Passwords don't match" },

  // Teacher Homework
  "teacher.homework_mgmt": { uz: "Uy vazifalari", ru: "Домашние задания", en: "Homework Management" },
  "teacher.assigned": { uz: "berilgan", ru: "назначено", en: "assigned" },
  "teacher.add_hw": { uz: "Vazifa qo'shish", ru: "Добавить задание", en: "Add Homework" },
  "teacher.edit_hw": { uz: "Vazifani tahrirlash", ru: "Редактировать задание", en: "Edit Homework" },
  "teacher.hw_title": { uz: "Vazifa nomi", ru: "Название задания", en: "Homework title" },
  "teacher.hw_desc": { uz: "Vazifa tavsifi va talablari", ru: "Описание и требования", en: "Description & requirements" },
  "teacher.due_date": { uz: "Topshirish muddati", ru: "Срок сдачи", en: "Due date" },
  "teacher.max_score": { uz: "Maks. ball", ru: "Макс. балл", en: "Max score" },
  "teacher.select_lesson": { uz: "Darsni tanlang", ru: "Выберите урок", en: "Select lesson" },
  "teacher.no_lessons_for_hw": { uz: "Avval admin panelida darslar yarating", ru: "Сначала создайте уроки в админ-панели", en: "Create lessons in admin panel first" },
  "teacher.no_homework": { uz: "Hali vazifa berilmagan", ru: "Заданий ещё нет", en: "No homework yet" },
  "teacher.hw_created": { uz: "Vazifa yaratildi!", ru: "Задание создано!", en: "Homework created!" },
  "teacher.hw_updated": { uz: "Vazifa yangilandi!", ru: "Задание обновлено!", en: "Homework updated!" },
  "teacher.hw_deleted": { uz: "Vazifa o'chirildi!", ru: "Задание удалено!", en: "Homework deleted!" },
  "teacher.view_submissions": { uz: "Topshirilganlarni ko'rish", ru: "Посмотреть сдачи", en: "View submissions" },
  "teacher.submissions": { uz: "topshirilgan", ru: "сдач", en: "submissions" },
  "teacher.no_submissions": { uz: "Hali hech kim topshirmadi", ru: "Никто ещё не сдал", en: "No submissions yet" },
  "teacher.pending_grade": { uz: "Bahosiz", ru: "Не оценено", en: "Ungraded" },
  "teacher.feedback": { uz: "Izoh (ixtiyoriy)", ru: "Отзыв (опц.)", en: "Feedback (optional)" },
  "teacher.view_file": { uz: "Faylni ko'rish", ru: "Открыть файл", en: "View file" },
  "teacher.invalid_score": { uz: "Ball noto'g'ri", ru: "Неверный балл", en: "Invalid score" },
  "teacher.graded_success": { uz: "Baholandi!", ru: "Оценено!", en: "Graded!" },
  "teacher.homework": { uz: "Vazifalar", ru: "Задания", en: "Homework" },

  // Admin members
  "admin.group_members": { uz: "Guruh a'zolari", ru: "Участники групп", en: "Group Members" },
  "admin.assign_students": { uz: "Talabalarni guruhga biriktirish", ru: "Привязка студентов к группам", en: "Assign students to groups" },
  "admin.search_student": { uz: "Talaba ismini kiriting...", ru: "Введите имя студента...", en: "Type student name..." },
  "admin.add_member": { uz: "A'zo qo'shish", ru: "Добавить участника", en: "Add member" },
  "admin.member_added": { uz: "Talaba qo'shildi!", ru: "Студент добавлен!", en: "Student added!" },
  "admin.member_removed": { uz: "Talaba olindi!", ru: "Студент удалён!", en: "Student removed!" },
  "admin.members": { uz: "a'zo", ru: "участников", en: "members" },
  "admin.no_members": { uz: "A'zolar yo'q", ru: "Нет участников", en: "No members" },

  // Branding
  "admin.branding": { uz: "Tashkilot brendingi", ru: "Брендинг организации", en: "Organization branding" },
  "admin.branding_desc": { uz: "Markazingiz qiyofasini sozlang", ru: "Настройте облик вашего центра", en: "Customize your institution's identity" },
  "admin.logo": { uz: "Logotip", ru: "Логотип", en: "Logo" },
  "admin.upload_logo": { uz: "Logotip yuklash", ru: "Загрузить логотип", en: "Upload logo" },
  "admin.logo_uploaded": { uz: "Logotip yuklandi", ru: "Логотип загружен", en: "Logo uploaded" },
  "admin.org_name": { uz: "Tashkilot nomi", ru: "Название организации", en: "Organization name" },
  "admin.color_preset": { uz: "Rang shabloni", ru: "Цветовая схема", en: "Color preset" },
  "admin.save_branding": { uz: "Brendingni saqlash", ru: "Сохранить брендинг", en: "Save branding" },
  "admin.branding_saved": { uz: "Branding saqlandi", ru: "Брендинг сохранён", en: "Branding saved" },
  "common.uploading": { uz: "Yuklanmoqda...", ru: "Загрузка...", en: "Uploading..." },
  "common.saving": { uz: "Saqlanmoqda...", ru: "Сохранение...", en: "Saving..." },

  // Student / homework extras
  "student.no_homework": { uz: "Hozircha uy vazifalari yo'q", ru: "Пока нет домашних заданий", en: "No homework yet" },
  "student.write_answer": { uz: "Javobingizni yozing...", ru: "Напишите свой ответ...", en: "Write your answer..." },
  "student.upload_or_text": { uz: "Fayl biriktiring yoki javob yozing", ru: "Прикрепите файл или напишите ответ", en: "Attach a file or write an answer" },
  "student.awaiting_grade": { uz: "Topshirildi — bahoga kutilmoqda", ru: "Отправлено — ожидает оценки", en: "Submitted — awaiting grade" },

  // Presentation
  "teacher.pres_img_loading": { uz: "Rasm yaratilmoqda...", ru: "Создание изображения...", en: "Generating image..." },
  "teacher.pres_img_generate": { uz: "Rasm yaratish", ru: "Создать изображение", en: "Generate image" },

  // Common
  "common.loading": { uz: "Yuklanmoqda...", ru: "Загрузка...", en: "Loading..." },
  "common.access_denied": { uz: "Kirish taqiqlangan", ru: "Доступ запрещён", en: "Access Denied" },
  "common.access_denied_desc": { uz: "Bu sahifaga kirish uchun", ru: "Для доступа к этой странице нужна роль", en: "You need the" },
  "common.role_required": { uz: "roli kerak", ru: "", en: "role to access this page" },
  "common.mirror": { uz: "Ko'zgu", ru: "Зеркало", en: "Mirror" },
  "admin.accountant": { uz: "Buxgalteriya", ru: "Бухгалтерия", en: "Accounting" },
  "admin.accountant_desc": { uz: "Hisob-kitob va maoshlar", ru: "Счета и зарплаты", en: "Invoices and payroll" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("unipath-lang");
    return (saved as Language) || "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("unipath-lang", lang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    const entry = translations[key as TranslationKey];
    if (!entry) return key;
    let result = entry[language] || entry.en || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v);
      });
    }
    return result;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
