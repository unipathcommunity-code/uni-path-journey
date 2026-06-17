import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy, CheckCircle2, Users, Share2, MessageCircle, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function ReferralWidget() {
  const { user } = useAuth();
  const { language } = useApp();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('referrals')
        .select('referral_code, status')
        .eq('referrer_id', user.id);

      if (data && data.length > 0) {
        setReferralCode(data[0].referral_code);
        setReferralCount(data.filter(r => r.status === 'completed').length);
      } else {
        const code = `UNI${user.id.slice(0, 6).toUpperCase()}`;
        await supabase.from('referrals').insert({
          referrer_id: user.id,
          referral_code: code,
        });
        setReferralCode(code);
      }
    })();
  }, [user]);

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const shareMessage = language === 'uz'
    ? `UniPath orqali jahon universitetlariga ariza bering! Mening havolam orqali ro'yxatdan o'ting va 3 UniCoin bonus oling: ${referralLink}`
    : language === 'ru'
    ? `Присоединяйтесь к UniPath! Зарегистрируйтесь по моей ссылке и получите 3 бонусных UniCoin: ${referralLink}`
    : `Join me on UniPath! Sign up with my link and get 3 bonus UniCoin: ${referralLink}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(language === 'uz' ? 'Nusxalandi!' : language === 'ru' ? 'Скопировано!' : 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'UniPath', text: shareMessage, url: referralLink });
      } catch {}
    } else {
      setShareOpen(!shareOpen);
    }
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareToInstagram = () => {
    // Instagram DM doesn't have a direct share URL, copy link and open Instagram
    navigator.clipboard.writeText(shareMessage);
    toast.success(language === 'uz' ? 'Xabar nusxalandi! Instagram DM ga joylashtiring' : language === 'ru' ? 'Скопировано! Вставьте в Instagram DM' : 'Copied! Paste in Instagram DM');
    window.open('https://instagram.com/direct/new/', '_blank');
  };

  const labels = {
    en: { title: 'Invite & Earn', desc: 'Invite a friend, both get 3 UniCoin', friends: 'Friends joined', quickShare: 'Quick Share' },
    uz: { title: "Taklif qiling — bonus oling", desc: "Do'st taklif qiling, ikkalangiz 3 UniCoin oling", friends: "Qo'shilgan do'stlar", quickShare: 'Tez ulashish' },
    ru: { title: 'Пригласите — получите бонус', desc: 'Пригласите друга, оба получите 3 UniCoin', friends: 'Друзей присоединилось', quickShare: 'Быстро поделиться' },
  };
  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{l.title}</h3>
          <p className="text-xs text-muted-foreground">{l.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{l.friends}:</span>
        <span className="font-semibold text-foreground">{referralCount}</span>
      </div>

      {/* Referral link input */}
      <div className="flex gap-2 mb-4">
        <Input readOnly value={referralLink} className="text-xs" />
        <Button size="icon" variant="outline" onClick={copyLink} className="flex-shrink-0">
          {copied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Quick Share row - always visible */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">{l.quickShare}</p>
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-col gap-1 h-auto py-2.5 text-xs hover:bg-primary/5 hover:border-primary/30"
            onClick={shareToTelegram}
          >
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <span className="text-[10px]">Telegram</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col gap-1 h-auto py-2.5 text-xs hover:bg-primary/5 hover:border-primary/30"
            onClick={shareToWhatsApp}
          >
            <MessageCircle className="w-4 h-4 text-green-500" />
            <span className="text-[10px]">WhatsApp</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col gap-1 h-auto py-2.5 text-xs hover:bg-primary/5 hover:border-primary/30"
            onClick={shareToInstagram}
          >
            <ExternalLink className="w-4 h-4 text-pink-500" />
            <span className="text-[10px]">Instagram</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col gap-1 h-auto py-2.5 text-xs hover:bg-primary/5 hover:border-primary/30"
            onClick={handleNativeShare}
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span className="text-[10px]">↗️</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
