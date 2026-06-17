import Layout from "@/components/layout/Layout";

const PrivacyPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold">Maxfiylik siyosati</h1>
          <p className="text-primary-foreground/80 mt-2">Oxirgi yangilanish: 2026-yil yanvar</p>
        </div>
      </div>

      <div className="container-custom py-12 md:py-16">
        <div className="max-w-3xl mx-auto prose prose-lg">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Kirish</h2>
            <p className="text-muted-foreground leading-relaxed">
              UniTour ("biz", "bizning") sizning maxfiyligingizni hurmat qiladi. Ushbu Maxfiylik siyosati 
              bizning veb-saytimiz va xizmatlarimizdan foydalanganingizda qanday ma'lumotlarni yig'ishimiz, 
              ishlatishimiz va himoya qilishimizni tushuntiradi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Yig'iladigan ma'lumotlar</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Biz quyidagi turdagi ma'lumotlarni yig'amiz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Shaxsiy ma'lumotlar (ism, email, telefon raqam)</li>
              <li>Hisob ma'lumotlari (login, parol)</li>
              <li>Bron qilish ma'lumotlari (sayohat sanalari, yo'nalishlar)</li>
              <li>To'lov ma'lumotlari (xavfsiz to'lov tizimi orqali)</li>
              <li>Qurilma va brauzer ma'lumotlari</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Ma'lumotlardan foydalanish</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Yig'ilgan ma'lumotlardan quyidagi maqsadlarda foydalanamiz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Xizmatlarimizni taqdim etish va yaxshilash</li>
              <li>Bron qilish va to'lovlarni qayta ishlash</li>
              <li>Mijozlar bilan bog'lanish va qo'llab-quvvatlash</li>
              <li>Yangiliklar va maxsus takliflar haqida xabar berish</li>
              <li>Xavfsizlik va firibgarlikni oldini olish</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Ma'lumotlarni himoya qilish</h2>
            <p className="text-muted-foreground leading-relaxed">
              Biz sizning ma'lumotlaringizni himoya qilish uchun sanoat standartlariga mos keladigan 
              xavfsizlik choralarini qo'llaymiz. Barcha ma'lumotlar shifrlangan holda saqlanadi va 
              faqat vakolatli xodimlar kirishi mumkin.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Uchinchi tomonlar</h2>
            <p className="text-muted-foreground leading-relaxed">
              Biz sizning ma'lumotlaringizni uchinchi tomonlarga faqat xizmatlarimizni taqdim etish 
              uchun zarur bo'lganda (masalan, mehmonxonalar, tur operatorlari) yoki qonun talabiga 
              binoan ulashamiz.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Cookie fayllar</h2>
            <p className="text-muted-foreground leading-relaxed">
              Veb-saytimiz tajribangizni yaxshilash uchun cookie fayllardan foydalanadi. Siz brauzer 
              sozlamalaringiz orqali cookie fayllarni boshqarishingiz mumkin.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Sizning huquqlaringiz</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Sizda quyidagi huquqlar mavjud:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Ma'lumotlaringizga kirish va nusxa olish</li>
              <li>Ma'lumotlarni tuzatish yoki yangilash</li>
              <li>Ma'lumotlarni o'chirish (qonuniy asoslarda)</li>
              <li>Marketing xabarlaridan voz kechish</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Bog'lanish</h2>
            <p className="text-muted-foreground leading-relaxed">
              Maxfiylik siyosati bo'yicha savollaringiz bo'lsa, biz bilan bog'laning:
            </p>
            <ul className="list-none mt-4 text-muted-foreground space-y-2">
              <li><strong>Telefon:</strong> +998 50 554 06 05</li>
              <li><strong>Email:</strong> info@unitour.uz</li>
              <li><strong>Manzil:</strong> Toshkent, O'zbekiston</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
