export const TELEGRAM_TEMPLATES = {
  nova: {
    attendance: (studentName: string, date: string) =>
      `✅ <b>${studentName}</b> bugun darsga keldi\n📅 ${date}`,

    payment_reminder: (studentName: string, amount: string) =>
      `💳 <b>${studentName}</b>, to'lov eslatmasi\n💰 Summa: ${amount} so'm`,

    payment_confirmed: (studentName: string, amount: string) =>
      `✅ To'lov qabul qilindi!\n👤 ${studentName}\n💰 ${amount} so'm`,

    streak: (studentName: string, days: number) =>
      `🔥 <b>${studentName}</b> ${days} kun ketma-ket darsga keldi!`,
  },

  unitour: {
    booking_confirmed: (clientName: string, tourName: string, date: string) =>
      `🎉 Bron tasdiqlandi!\n👤 ${clientName}\n✈️ ${tourName}\n📅 ${date}`,

    visa_approved: (clientName: string, country: string) =>
      `🎊 Viza tasdiqlandi!\n👤 ${clientName}\n🌍 ${country}`,

    visa_rejected: (clientName: string, country: string) =>
      `❌ Viza rad etildi\n👤 ${clientName}\n🌍 ${country}\nBatafsil ma'lumot uchun bog'laning.`,

    departure_reminder: (clientName: string, tourName: string, hours: number) =>
      `⏰ Eslatma: ${hours} soatdan so'ng jo'nash\n👤 ${clientName}\n✈️ ${tourName}`,
  },

  consulting: {
    application_submitted: (studentName: string, university: string) =>
      `📝 Ariza topshirildi!\n👤 ${studentName}\n🏫 ${university}`,

    document_approved: (studentName: string, docName: string) =>
      `✅ Hujjat tasdiqlandi\n👤 ${studentName}\n📄 ${docName}`,
  },
}
