import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Download, PartyPopper } from 'lucide-react';
import { playCelebrationJingle } from '@/lib/sounds';

interface AcceptanceCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universityName: string;
  letterUrl?: string | null;
  language: string;
}

export function AcceptanceCelebration({ open, onOpenChange, universityName, letterUrl, language }: AcceptanceCelebrationProps) {
  const [showContent, setShowContent] = useState(false);
  const [showIcon, setShowIcon] = useState(false);

  useEffect(() => {
    if (open) {
      setShowContent(false);
      setShowIcon(false);

      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      setTimeout(() => setShowIcon(true), 200);

      // Play celebration jingle
      playCelebrationJingle();

      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
        });
        setShowContent(true);
      }, 600);
    }
  }, [open]);

  const labels = {
    uz: {
      congratulations: 'Tabriklaymiz! 🎉',
      accepted: 'Siz qabul qilindingiz!',
      university: 'universitetiga qabul qilindingiz',
      downloadLetter: 'Qabul xatini yuklab olish',
      letterLocked: 'Qabul xati hali yuklanmagan',
      letterLockedDesc: 'Administratsiya tez orada qabul xatingizni yuklaydi',
      close: 'Yopish',
    },
    ru: {
      congratulations: 'Поздравляем! 🎉',
      accepted: 'Вы приняты!',
      university: 'Вы приняты в университет',
      downloadLetter: 'Скачать письмо о зачислении',
      letterLocked: 'Письмо ещё не загружено',
      letterLockedDesc: 'Администрация скоро загрузит ваше письмо о зачислении',
      close: 'Закрыть',
    },
    en: {
      congratulations: 'Congratulations! 🎉',
      accepted: 'You have been accepted!',
      university: 'You have been accepted to',
      downloadLetter: 'Download Acceptance Letter',
      letterLocked: 'Letter not yet uploaded',
      letterLockedDesc: 'The administration will upload your acceptance letter soon',
      close: 'Close',
    },
  };

  const l = labels[language as keyof typeof labels] || labels.en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 rounded-2xl shadow-2xl">
        {/* Animated gradient header */}
        <div className="relative p-10 text-center text-white overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 40%, #ec4899 70%, #8b5cf6 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradientShift 4s ease infinite',
          }}
        >
          {/* Floating circles background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-20"
                style={{
                  width: `${40 + i * 20}px`,
                  height: `${40 + i * 20}px`,
                  left: `${10 + i * 15}%`,
                  top: `${10 + (i % 3) * 30}%`,
                  background: 'white',
                  animation: `floatBubble ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div
              className={`transition-all duration-700 ${showIcon ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-white/30">
                <PartyPopper className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>
            <h2
              className={`text-3xl font-extrabold mb-2 tracking-tight transition-all duration-500 delay-200 ${showIcon ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {l.congratulations}
            </h2>
            <p
              className={`text-lg font-medium opacity-90 transition-all duration-500 delay-300 ${showIcon ? 'opacity-90 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              {l.accepted}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className={`p-6 text-center transition-all duration-600 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">{l.university}</p>
          <h3 className="text-xl font-bold text-foreground mb-6">{universityName}</h3>

          {letterUrl ? (
            <a href={letterUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Button size="lg" className="w-full gap-2 h-14 text-base shadow-lg hover:shadow-xl transition-shadow">
                <Download className="w-5 h-5" />
                {l.downloadLetter}
              </Button>
            </a>
          ) : (
            <div className="bg-muted/50 rounded-2xl p-5 mb-2 border border-border/50">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="font-semibold text-foreground text-sm">{l.letterLocked}</p>
              <p className="text-xs text-muted-foreground mt-1">{l.letterLockedDesc}</p>
            </div>
          )}

          <Button variant="ghost" onClick={() => onOpenChange(false)} className="mt-3 text-muted-foreground">
            {l.close}
          </Button>
        </div>
      </DialogContent>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatBubble {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.1); }
        }
      `}</style>
    </Dialog>
  );
}
