import { useState } from 'react';
import { Lock, ArrowUpCircle, Check, Send, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface UpgradeGateProps {
  requiredPlan: 'Pro' | 'Enterprise';
  featureName: string;
}

export function UpgradeGate({ requiredPlan, featureName }: UpgradeGateProps) {
  const { language } = useApp();
  const { plan } = usePlanLimits();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isUz = language === 'uz';
  const isRu = language === 'ru';

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success(
      isUz ? "So'rov yuborildi! Tez orada bog'lanamiz." :
      isRu ? 'Запрос отправлен! Мы скоро свяжемся с вами.' :
             'Request sent! We will contact you shortly.'
    );
    setLoading(false);
    setSubmitted(true);
  };

  const getPlanPrice = (p: string) => {
    if (p === 'Starter') return '$29';
    if (p === 'Pro') return '$79';
    return '$199';
  };

  const uzFeatures: Record<string, string[]> = {
    Starter: ['3 ta xodim', 'CRM Pipeline', 'Hujjat saqlash (5 GB)'],
    Pro: ['25 xodim, 5 filial', 'Buxgalteriya & Invoyslar', 'AI Kamera nazorati', 'Telegram Bot'],
    Enterprise: ['Cheksiz filial & xodim', 'Custom domen ulanish', 'SLA kafolati & 24/7 VIP qo\'llab-quvvatlash', 'Ma\'lumotlar izolyatsiyasi'],
  };

  const ruFeatures: Record<string, string[]> = {
    Starter: ['До 3 сотрудников', 'CRM Pipeline', 'Хранилище файлов (5 GB)'],
    Pro: ['25 сотрудников, 5 филиалов', 'Бухгалтерия и инвойсы', 'AI-камера наблюдения', 'Telegram Bot'],
    Enterprise: ['Неограниченно всё', 'Подключение своего домена', 'SLA + 24/7 VIP поддержка', 'Изоляция данных'],
  };

  const enFeatures: Record<string, string[]> = {
    Starter: ['Up to 3 staff', 'CRM Pipeline', 'File storage (5 GB)'],
    Pro: ['25 staff, 5 branches', 'Accounting & Invoices', 'AI Camera control', 'Telegram Bot'],
    Enterprise: ['Unlimited everything', 'Custom domain connection', 'SLA + 24/7 VIP support', 'Data isolation'],
  };

  const features = isUz ? uzFeatures : isRu ? ruFeatures : enFeatures;

  const headingText =
    isUz ? `Bu funksiya ${requiredPlan} tarifini talab qiladi` :
    isRu ? `Эта функция требует тариф ${requiredPlan}` :
           `This feature requires ${requiredPlan} plan`;

  const descText =
    isUz ? `"${featureName}" bo'limiga kirish uchun tarifingizni yangilang.` :
    isRu ? `Обновите тариф, чтобы получить доступ к разделу "${featureName}".` :
           `Upgrade your plan to unlock "${featureName}".`;

  const currentPlanText =
    isUz ? `Joriy tarif: ${plan}` :
    isRu ? `Текущий тариф: ${plan}` :
           `Current plan: ${plan}`;

  const upgradeTitle =
    isUz ? 'Tarifingizni yangilamoqchimisiz?' :
    isRu ? 'Хотите обновить тариф?' :
           'Ready to upgrade?';

  const upgradeDesc =
    isUz ? "So'rovingizni yozib qoldiring — tez orada bog'lanamiz." :
    isRu ? 'Напишите сообщение — мы свяжемся с вами.' :
           'Submit an inquiry and our team will reach out.';

  const placeholderText =
    isUz ? `${requiredPlan} tarifiga o'tib, "${featureName}"ga kirmoqchimiz.` :
    isRu ? `Хотим перейти на ${requiredPlan} для доступа к "${featureName}".` :
           `We'd like to upgrade to ${requiredPlan} to access "${featureName}".`;

  const btnText =
    isUz ? "So'rov yuborish" :
    isRu ? 'Отправить запрос' :
           'Send Request';

  const successText =
    isUz ? "Rahmat! So'rovingiz qabul qilindi." :
    isRu ? 'Спасибо! Ваш запрос принят.' :
           'Thank you! Your request has been received.';

  return (
    <div className="w-full min-h-[75vh] py-8 px-4 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full text-center space-y-6">
        {/* Glow Lock Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-lg border border-primary/20">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1.5 border-2 border-background">
            <ArrowUpCircle className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            {headingText}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            {descText}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-sm font-medium mt-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{currentPlanText}</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          {(['Starter', 'Pro', 'Enterprise'] as const).map((p) => {
            const isCurrent = plan === p;
            const isTarget = requiredPlan === p;
            const isHigher =
              (requiredPlan === 'Pro' && (p === 'Pro' || p === 'Enterprise')) ||
              (requiredPlan === 'Enterprise' && p === 'Enterprise');

            return (
              <Card
                key={p}
                className={`relative overflow-hidden transition-all duration-300 border backdrop-blur-md ${
                  isCurrent
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                    : isTarget
                    ? 'border-violet-500/50 bg-violet-500/5 shadow-md shadow-violet-500/10 scale-[1.02]'
                    : 'border-border bg-card/40'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2.5 py-1 rounded-bl-lg font-semibold">
                    {isUz ? 'Joriy' : isRu ? 'Текущий' : 'Current'}
                  </div>
                )}
                {isTarget && !isCurrent && (
                  <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] px-2.5 py-1 rounded-bl-lg font-semibold">
                    {isUz ? 'Kerakli' : isRu ? 'Нужный' : 'Required'}
                  </div>
                )}

                <CardContent className="p-5 text-left flex flex-col space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{p}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-extrabold text-foreground">{getPlanPrice(p)}</span>
                      <span className="text-muted-foreground text-sm">/mo</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {features[p].map((f, i) => (
                      <li key={i} className="flex items-start text-sm text-muted-foreground gap-2">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isHigher ? 'text-primary' : 'text-muted-foreground/40'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upgrade Request */}
        <div className="max-w-md mx-auto pt-8 border-t border-border mt-6">
          <h4 className="text-base font-semibold mb-1.5">{upgradeTitle}</h4>
          <p className="text-sm text-muted-foreground mb-4">{upgradeDesc}</p>

          {!submitted ? (
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholderText}
                className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                required
              />
              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{btnText}</span>
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-sm font-medium">
              {successText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
