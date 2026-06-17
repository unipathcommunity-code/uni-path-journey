import { Shield, RefreshCcw, Phone, MessageCircle, Clock, Award } from "lucide-react";

const TrustSection = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        Nima uchun biz bilan xavfsiz?
      </h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
          <RefreshCcw className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">24 soat ichida qaytarish kafolati</p>
            <p className="text-xs text-muted-foreground">Deposit 24 soat ichida to'liq qaytariladi</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">10 daqiqada aloqa</p>
            <p className="text-xs text-muted-foreground">Band qilganingizdan so'ng manager siz bilan 10 daqiqada bog'lanadi</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
          <Award className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">Litsenziyalangan operator</p>
            <p className="text-xs text-muted-foreground">Rasmiy turizm litsenziyasi bilan ishlaymiz</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
          <MessageCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">24/7 qo'llab-quvvatlash</p>
            <p className="text-xs text-muted-foreground">Telegram va telefon orqali doim aloqadamiz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSection;
