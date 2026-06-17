import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AcceptanceCelebration } from '@/components/AcceptanceCelebration';
import { Download, PartyPopper, MapPin, GraduationCap, ExternalLink } from 'lucide-react';

interface AcceptanceCardProps {
  application: {
    id: string;
    program: string | null;
    acceptance_letter_url: string | null;
    university: {
      name: string;
      country: string;
      city?: string | null;
    } | null;
  };
  language: string;
}

const labels = {
  uz: {
    congratulations: 'Tabriklaymiz! 🎉',
    accepted: 'Siz qabul qilindingiz!',
    download: 'Qabul xatini yuklab olish',
    celebrate: 'Nishonlash',
    viewDetails: "Batafsil ko'rish",
  },
  ru: {
    congratulations: 'Поздравляем! 🎉',
    accepted: 'Вы приняты!',
    download: 'Скачать письмо',
    celebrate: 'Отпраздновать',
    viewDetails: 'Подробнее',
  },
  en: {
    congratulations: 'Congratulations! 🎉',
    accepted: 'You have been accepted!',
    download: 'Download Letter',
    celebrate: 'Celebrate',
    viewDetails: 'View Details',
  },
};

const getCountryFlag = (country: string) => {
  const flags: Record<string, string> = {
    'South Korea': '🇰🇷', 'China': '🇨🇳', 'Japan': '🇯🇵', 'USA': '🇺🇸',
    'Germany': '🇩🇪', 'Poland': '🇵🇱', 'Turkey': '🇹🇷', 'Czech Republic': '🇨🇿',
    'Malaysia': '🇲🇾', 'UAE': '🇦🇪', 'Georgia': '🇬🇪', 'Hungary': '🇭🇺',
    'Russia': '🇷🇺', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
  };
  return flags[country] || '🌍';
};

export function AcceptanceCard({ application, language }: AcceptanceCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [letterUrl, setLetterUrl] = useState<string | null>(null);
  const l = labels[language as keyof typeof labels] || labels.en;

  const handleCelebrate = async () => {
    if (application.acceptance_letter_url) {
      const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(application.acceptance_letter_url, 3600);
      setLetterUrl(data?.signedUrl || null);
    }
    setShowCelebration(true);
  };

  const handleDownload = async () => {
    if (!application.acceptance_letter_url) return;
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(application.acceptance_letter_url, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative overflow-hidden rounded-2xl border border-success/30"
      >
        {/* Animated gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--success)) 0%, hsl(142 71% 35%) 50%, hsl(160 60% 40%) 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 6s ease infinite',
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${12 + i * 6}px`,
                height: `${12 + i * 6}px`,
                left: `${5 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [-8, 8, -8],
                opacity: [0.15, 0.3, 0.15],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 3 + i * 0.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Left: Info */}
            <div className="flex items-start gap-4 flex-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shrink-0 ring-2 ring-white/20"
              >
                {getCountryFlag(application.university?.country || '')}
              </motion.div>
              <div className="min-w-0">
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-medium text-white/80"
                >
                  {l.congratulations}
                </motion.p>
                <motion.h3
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-lg md:text-xl font-bold text-white truncate"
                >
                  {application.university?.name}
                </motion.h3>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center gap-3 mt-1 text-sm text-white/70"
                >
                  {application.university?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {application.university.city}, {application.university.country}
                    </span>
                  )}
                  {application.program && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {application.program}
                    </span>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Right: Actions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 shrink-0"
            >
              {application.acceptance_letter_url && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4" />
                  {l.download}
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 bg-white text-foreground hover:bg-white/90 shadow-lg"
                onClick={handleCelebrate}
              >
                <PartyPopper className="w-4 h-4" />
                {l.celebrate}
              </Button>
            </motion.div>
          </div>
        </div>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </motion.div>

      <AcceptanceCelebration
        open={showCelebration}
        onOpenChange={setShowCelebration}
        universityName={application.university?.name || ''}
        letterUrl={letterUrl}
        language={language}
      />
    </>
  );
}
