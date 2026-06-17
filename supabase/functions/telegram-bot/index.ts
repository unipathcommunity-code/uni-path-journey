import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRANSLATIONS = {
  uz: {
    welcome: (name: string) => `Assalomu alaykum, ${name}! UniPath platformasiga xush kelibsiz.`,
    need_login: "Tizimga kirish uchun iltimos pastdagi \"📞 Telefon raqamni yuborish\" tugmasini bosing yoki profil telegram foydalanuvchi nomingiz (username) to'g'ri sozlanganligini tekshiring.",
    btn_send_phone: "📞 Telefon raqamni yuborish",
    btn_my_applications: "📄 Arizalarim holati",
    btn_my_profile: "👤 Profil ma'lumotlari",
    btn_change_language: "🌐 Tilni o'zgartirish",
    btn_contact: "📞 Aloqa bog'lanish",
    select_lang: "Iltimos, tilni tanlang:",
    lang_changed: "Til muvaffaqiyatli o'zgartirildi!",
    auth_success: (name: string) => `Siz muvaffaqiyatli tizimga kirdingiz! Salom, ${name}.`,
    no_applications: "Sizda hozircha faol arizalar mavjud emas.",
    app_list_title: "Sizning arizalaringiz ro'yxati:",
    app_item: (uni: string, prog: string, status: string, intake: string) => 
      `🎓 *Universitet:* ${uni}\n📚 *Yo'nalish:* ${prog}\n📅 *Intake:* ${intake}\nℹ️ *Holat:* ${status}\n\n`,
    profile_info: (name: string, phone: string, tenant: string) => 
      `👤 *Foydalanuvchi:* ${name}\n📞 *Telefon:* ${phone}\n🏢 *Konsalting:* ${tenant}`,
    error_occurred: "Tizimda xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring.",
  },
  ru: {
    welcome: (name: string) => `Здравствуйте, ${name}! Добро пожаловать на платформу UniPath.`,
    need_login: "Пожалуйста, отправьте свой номер телефона с помощью кнопки ниже \"📞 Отправить номер телефона\" или убедитесь, что имя пользователя Telegram указано в профиле.",
    btn_send_phone: "📞 Отправить номер телефона",
    btn_my_applications: "📄 Мои заявки",
    btn_my_profile: "👤 Мой профиль",
    btn_change_language: "🌐 Изменить язык",
    btn_contact: "📞 Контакты",
    select_lang: "Пожалуйста, выберите язык:",
    lang_changed: "Язык успешно изменен!",
    auth_success: (name: string) => `Вы успешно вошли в систему! Привет, ${name}.`,
    no_applications: "У вас пока нет активных заявок.",
    app_list_title: "Список ваших заявок:",
    app_item: (uni: string, prog: string, status: string, intake: string) => 
      `🎓 *Университет:* ${uni}\n📚 *Направление:* ${prog}\n📅 *Семестр:* ${intake}\nℹ️ *Статус:* ${status}\n\n`,
    profile_info: (name: string, phone: string, tenant: string) => 
      `👤 *Пользователь:* ${name}\n📞 *Телефон:* ${phone}\n🏢 *Консалтинг:* ${tenant}`,
    error_occurred: "Произошла ошибка. Пожалуйста, попробуйте позже.",
  },
  en: {
    welcome: (name: string) => `Hello, ${name}! Welcome to UniPath.`,
    need_login: "Please send your phone number using the button below \"📞 Send Phone Number\" or make sure your Telegram username is registered in your profile to sign in.",
    btn_send_phone: "📞 Send Phone Number",
    btn_my_applications: "📄 My Applications",
    btn_my_profile: "👤 My Profile",
    btn_change_language: "🌐 Change Language",
    btn_contact: "📞 Contact Us",
    select_lang: "Please select a language:",
    lang_changed: "Language successfully updated!",
    auth_success: (name: string) => `You have successfully logged in! Hello, ${name}.`,
    no_applications: "You don't have any active applications yet.",
    app_list_title: "List of your applications:",
    app_item: (uni: string, prog: string, status: string, intake: string) => 
      `🎓 *University:* ${uni}\n📚 *Program:* ${prog}\n📅 *Intake:* ${intake}\nℹ️ *Status:* ${status}\n\n`,
    profile_info: (name: string, phone: string, tenant: string) => 
      `👤 *User:* ${name}\n📞 *Phone:* ${phone}\n🏢 *Consulting:* ${tenant}`,
    error_occurred: "An error occurred. Please try again later.",
  }
};

const STATUS_MAP = {
  uz: {
    draft: "Loyiha (Draft)",
    submitted: "Yuborilgan",
    under_review: "Ko'rib chiqilmoqda",
    accepted: "Qabul qilindi ✅",
    rejected: "Rad etildi ❌",
    cancelled: "Bekor qilindi",
  },
  ru: {
    draft: "Черновик",
    submitted: "Отправлено",
    under_review: "На рассмотрении",
    accepted: "Принято ✅",
    rejected: "Отклонено ❌",
    cancelled: "Отменено",
  },
  en: {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    accepted: "Accepted ✅",
    rejected: "Rejected ❌",
    cancelled: "Cancelled",
  }
};

function translateStatus(status: string | null, lang: 'uz' | 'ru' | 'en'): string {
  if (!status) return status || "";
  const langMap = STATUS_MAP[lang] || STATUS_MAP.uz;
  return langMap[status as keyof typeof langMap] || status;
}

async function sendTelegramMessage(botToken: string, chatId: number | string, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: replyMarkup
    })
  });
  if (!response.ok) {
    console.error("Error calling Telegram sendMessage API:", await response.text());
  }
}

const getMainMenuKeyboard = (lang: 'uz' | 'ru' | 'en') => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  return {
    keyboard: [
      [
        { text: t.btn_my_applications },
        { text: t.btn_my_profile }
      ],
      [
        { text: t.btn_change_language },
        { text: t.btn_contact }
      ]
    ],
    resize_keyboard: true
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "healthy", message: "Telegram bot webhook is running." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenant_id");

    if (!tenantId) {
      console.error("No tenant_id specified in webhook URL query parameters.");
      return new Response(JSON.stringify({ error: "Missing tenant_id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch tenant details
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError || !tenant) {
      console.error(`Tenant not found for ID: ${tenantId}`, tenantError);
      return new Response(JSON.stringify({ error: "Tenant not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botToken = tenant.config?.branding?.telegram_bot_token;
    if (!botToken) {
      console.error(`Telegram bot token not configured for tenant: ${tenant.name}`);
      return new Response(JSON.stringify({ error: "Bot token not configured for this tenant" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const update = await req.json();
    console.log("Received update from Telegram:", JSON.stringify(update));

    const message = update.message;
    const callbackQuery = update.callback_query;

    if (callbackQuery) {
      const chatId = callbackQuery.message.chat.id;
      const callbackData = callbackQuery.data;
      const callbackQueryId = callbackQuery.id;

      // Find profile by chat_id
      const { data: linkedProfiles } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("telegram_chat_id", String(chatId))
        .eq("tenant_id", tenantId);

      let profile = linkedProfiles && linkedProfiles.length > 0 ? linkedProfiles[0] : null;
      let currentLang: 'uz' | 'ru' | 'en' = (profile?.preferred_language as 'uz' | 'ru' | 'en') || 'uz';

      if (callbackData.startsWith("set_lang_")) {
        const newLang = callbackData.replace("set_lang_", "") as 'uz' | 'ru' | 'en';
        
        if (profile) {
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ preferred_language: newLang })
            .eq("id", profile.id);
          
          if (updateError) {
            console.error("Error updating language preference:", updateError);
          }
        }

        // Answer callback query
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: TRANSLATIONS[newLang].lang_changed
          })
        });

        // Send confirmation and menu
        await sendTelegramMessage(
          botToken, 
          chatId, 
          TRANSLATIONS[newLang].lang_changed, 
          getMainMenuKeyboard(newLang)
        );
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id;
    const senderName = message.from.first_name || message.from.username || "User";
    const username = message.from.username;
    const text = message.text?.trim() || "";

    // 1. Try to find the profile
    let profile = null;
    const { data: linkedProfiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("telegram_chat_id", String(chatId))
      .eq("tenant_id", tenantId);

    if (linkedProfiles && linkedProfiles.length > 0) {
      profile = linkedProfiles[0];
    }

    // 2. If not found by chat_id, check if telegram username matches
    if (!profile && username) {
      const cleanUsername = username.replace(/^@/, "");
      const { data: userProfiles } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenantId)
        .or(`telegram_username.ilike.${cleanUsername},telegram_username.ilike.@${cleanUsername}`);

      if (userProfiles && userProfiles.length > 0) {
        profile = userProfiles[0];
        // Link chat_id
        await supabaseAdmin
          .from("profiles")
          .update({ telegram_chat_id: String(chatId) })
          .eq("id", profile.id);
      }
    }

    // 3. Handle Shared Contact (Phone Number)
    if (!profile && message.contact?.phone_number) {
      const sharedPhone = message.contact.phone_number.replace(/\D/g, "");
      const { data: tenantProfiles } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("tenant_id", tenantId);

      if (tenantProfiles) {
        profile = tenantProfiles.find((p) => {
          if (!p.phone) return false;
          const cleanP = p.phone.replace(/\D/g, "");
          return cleanP.slice(-9) === sharedPhone.slice(-9); // match last 9 digits
        });

        if (profile) {
          // Link chat_id
          await supabaseAdmin
            .from("profiles")
            .update({ telegram_chat_id: String(chatId) })
            .eq("id", profile.id);
          
          const defaultLang = (profile.preferred_language as 'uz' | 'ru' | 'en') || 'uz';
          await sendTelegramMessage(
            botToken,
            chatId,
            TRANSLATIONS[defaultLang].auth_success(profile.full_name || senderName),
            getMainMenuKeyboard(defaultLang)
          );
          return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // If profile is still not found, ask them to authorize
    if (!profile) {
      const defaultLang = 'uz'; // Uzbek fallback for greetings
      const t = TRANSLATIONS[defaultLang];
      
      const replyMarkup = {
        keyboard: [
          [
            {
              text: t.btn_send_phone,
              request_contact: true,
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      };

      await sendTelegramMessage(
        botToken,
        chatId,
        t.welcome(senderName) + "\n\n" + t.need_login,
        replyMarkup
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Now we have the profile and can handle commands
    const lang = (profile.preferred_language as 'uz' | 'ru' | 'en') || 'uz';
    const t = TRANSLATIONS[lang] || TRANSLATIONS.uz;

    // Check menu selection
    if (text === t.btn_my_applications) {
      // Fetch applications
      const { data: apps, error: appsError } = await supabaseAdmin
        .from("applications")
        .select(`
          id,
          program,
          intake,
          status,
          universities (
            name,
            name_uz,
            name_ru
          )
        `)
        .eq("user_id", profile.user_id)
        .eq("tenant_id", tenantId);

      if (appsError) {
        console.error("Error fetching applications:", appsError);
        await sendTelegramMessage(botToken, chatId, t.error_occurred, getMainMenuKeyboard(lang));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!apps || apps.length === 0) {
        await sendTelegramMessage(botToken, chatId, t.no_applications, getMainMenuKeyboard(lang));
      } else {
        let appMessage = `*${t.app_list_title}*\n\n`;
        apps.forEach((app: any) => {
          const uni = app.universities;
          const uniName = (lang === 'uz' ? uni?.name_uz : lang === 'ru' ? uni?.name_ru : uni?.name) || uni?.name || "Unknown University";
          appMessage += t.app_item(
            uniName,
            app.program || "N/A",
            translateStatus(app.status, lang),
            app.intake || "N/A"
          );
        });
        await sendTelegramMessage(botToken, chatId, appMessage, getMainMenuKeyboard(lang));
      }
    } else if (text === t.btn_my_profile) {
      const profileText = t.profile_info(
        profile.full_name || "N/A",
        profile.phone || "N/A",
        tenant.name
      );
      await sendTelegramMessage(botToken, chatId, profileText, getMainMenuKeyboard(lang));
    } else if (text === t.btn_change_language) {
      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: "🇺🇿 O'zbekcha", callback_data: "set_lang_uz" },
            { text: "🇷🇺 Русский", callback_data: "set_lang_ru" },
            { text: "🇬🇧 English", callback_data: "set_lang_en" }
          ]
        ]
      };
      await sendTelegramMessage(botToken, chatId, t.select_lang, inlineKeyboard);
    } else if (text === t.btn_contact) {
      const contactInfo = `🏢 *${tenant.name}*\n\n` + 
        `👤 *Mas'ul:* ${tenant.owner_name || "N/A"}\n` + 
        `📞 *Telefon:* ${tenant.owner_phone || "N/A"}\n` + 
        `✉️ *Email:* ${tenant.owner_email || "N/A"}\n\n` + 
        (lang === 'uz' ? "Savollaringiz bo'lsa, biz bilan bog'laning!" : lang === 'ru' ? "Если у вас есть вопросы, свяжитесь с нами!" : "Contact us if you have any questions!");
      await sendTelegramMessage(botToken, chatId, contactInfo, getMainMenuKeyboard(lang));
    } else {
      // Default fallback
      await sendTelegramMessage(
        botToken,
        chatId,
        lang === 'uz' 
          ? "Iltimos, quyidagi menyudan foydalaning:" 
          : lang === 'ru' 
            ? "Пожалуйста, используйте меню ниже:" 
            : "Please use the menu below:",
        getMainMenuKeyboard(lang)
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Critical error in Telegram Bot webhook handler:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
