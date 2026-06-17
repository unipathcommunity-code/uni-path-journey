import Layout from "@/components/layout/Layout";

const TermsPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold">Foydalanish shartlari</h1>
          <p className="text-primary-foreground/80 mt-2">Oxirgi yangilanish: 2026-yil yanvar</p>
        </div>
      </div>

      <div className="container-custom py-12 md:py-16">
        <div className="max-w-3xl mx-auto prose prose-lg">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Umumiy qoidalar</h2>
            <p className="text-muted-foreground leading-relaxed">
              UniTour platformasidan foydalanish orqali siz ushbu Foydalanish shartlarini qabul qilasiz. 
              Agar siz ushbu shartlarni qabul qilmasangiz, iltimos, platformadan foydalanmang.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Xizmatlar tavsifi</h2>
            <p className="text-muted-foreground leading-relaxed">
              UniTour - bu O'zbekiston va xorijdagi tur paketlarini solishtirish va bron qilish 
              imkoniyatini beruvchi onlayn platforma. Biz foydalanuvchilarni tekshirilgan tur 
              operatorlari bilan bog'laymiz.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. Foydalanuvchi majburiyatlari</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Platformadan foydalanayotganda siz quyidagilarga rozilik bildirasiz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To'g'ri va to'liq ma'lumotlar berish</li>
              <li>Hisob ma'lumotlarini xavfsiz saqlash</li>
              <li>Platformadan qonuniy maqsadlarda foydalanish</li>
              <li>Boshqa foydalanuvchilar huquqlarini hurmat qilish</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Bron qilish va to'lov</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bron qilish shartlari:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Barcha narxlar O'zbekiston so'mida ko'rsatilgan</li>
              <li>Bron qilish faqat to'lov tasdiqlangandan keyin kuchga kiradi</li>
              <li>Bekor qilish shartlari har bir tur uchun alohida belgilanadi</li>
              <li>Qaytarib berish siyosati tur operatori shartlariga bog'liq</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Bekor qilish siyosati</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Bronni bekor qilish quyidagi tartibda amalga oshiriladi:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>14 kun oldin - to'liq qaytarish</li>
              <li>7-14 kun oldin - 50% qaytarish</li>
              <li>7 kundan kam - qaytarish yo'q</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Ba'zi turlar uchun maxsus bekor qilish shartlari amal qilishi mumkin.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Javobgarlikni cheklash</h2>
            <p className="text-muted-foreground leading-relaxed">
              UniTour tur operatorlari tomonidan ko'rsatiladigan xizmatlar sifati uchun to'g'ridan-to'g'ri 
              javobgar emas. Biz faqat platforma sifatida faoliyat ko'rsatamiz va operatorlarni 
              tekshirishga harakat qilamiz.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Intellektual mulk</h2>
            <p className="text-muted-foreground leading-relaxed">
              UniTour platformasidagi barcha kontent, dizayn va materiallar bizning intellektual 
              mulkimiz hisoblanadi va mualliflik huquqi bilan himoyalangan.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. O'zgarishlar</h2>
            <p className="text-muted-foreground leading-relaxed">
              Biz ushbu shartlarni istalgan vaqtda o'zgartirish huquqini saqlab qolamiz. O'zgarishlar 
              platformada e'lon qilingan paytdan boshlab kuchga kiradi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Bog'lanish</h2>
            <p className="text-muted-foreground leading-relaxed">
              Foydalanish shartlari bo'yicha savollaringiz bo'lsa, biz bilan bog'laning:
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

export default TermsPage;
