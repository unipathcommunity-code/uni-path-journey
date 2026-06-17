import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import {
  UserPlus, FolderUp, Coins, GraduationCap, Award, Plane, Home, CheckCircle2, Circle,
} from 'lucide-react';

interface RoadmapStep {
  key: string;
  icon: typeof UserPlus;
  completed: boolean;
  active: boolean;
}

interface InteractiveRoadmapProps {
  currentStep: number;
}

const STEPS = [
  { key: 'onboarding', icon: UserPlus },
  { key: 'documents', icon: FolderUp },
  { key: 'credits', icon: Coins },
  { key: 'apply', icon: GraduationCap },
  { key: 'admission', icon: Award },
  { key: 'visa', icon: Plane },
  { key: 'housing', icon: Home },
];

const LABELS: Record<string, Record<string, string>> = {
  en: { onboarding: 'Onboarding', documents: 'Documents', credits: 'UniCoin', apply: 'Apply', admission: 'Admission', visa: 'Visa', housing: 'Housing' },
  uz: { onboarding: "Ro'yxatdan", documents: 'Hujjatlar', credits: 'UniCoin', apply: 'Ariza', admission: 'Qabul', visa: 'Viza', housing: 'Turar joy' },
  ru: { onboarding: 'Регистрация', documents: 'Документы', credits: 'UniCoin', apply: 'Заявка', admission: 'Зачисление', visa: 'Виза', housing: 'Жильё' },
};

export function InteractiveRoadmap({ currentStep }: InteractiveRoadmapProps) {
  const { language } = useApp();
  const labels = LABELS[language] || LABELS.en;

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-foreground mb-4">
        {language === 'uz' ? 'Sizning sayohatingiz' : language === 'ru' ? 'Ваш путь' : 'Your Journey'}
      </h3>
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-700"
          style={{ width: `${Math.min((currentStep / (STEPS.length - 1)) * 100, 100)}%` }}
        />

        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : isActive
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight ${
                  isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {labels[step.key]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
