import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, CheckCircle2, FileText, User, Calendar, Globe } from 'lucide-react';

interface DocumentScannerProps {
  isScanning: boolean;
  documentType: string;
  onComplete: () => void;
}

const SCAN_STEPS = [
  { icon: FileText, label: 'Reading document...', labelUz: 'Hujjat o\'qilmoqda...', labelRu: 'Чтение документа...' },
  { icon: Scan, label: 'Extracting text...', labelUz: 'Matn ajratilmoqda...', labelRu: 'Извлечение текста...' },
  { icon: User, label: 'Identifying data...', labelUz: "Ma'lumotlar aniqlanmoqda...", labelRu: 'Идентификация данных...' },
  { icon: Globe, label: 'Validating format...', labelUz: 'Format tekshirilmoqda...', labelRu: 'Проверка формата...' },
  { icon: Calendar, label: 'Checking expiry...', labelUz: 'Muddat tekshirilmoqda...', labelRu: 'Проверка срока...' },
  { icon: CheckCircle2, label: 'Scan complete!', labelUz: 'Skanerlash tugadi!', labelRu: 'Сканирование завершено!' },
];

export function DocumentScanner({ isScanning, documentType, onComplete }: DocumentScannerProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isScanning) {
      setStep(0);
      setProgress(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setStep(s => {
        if (s >= SCAN_STEPS.length - 1) {
          clearInterval(stepInterval);
          setTimeout(onComplete, 800);
          return s;
        }
        return s + 1;
      });
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 100));
    }, 30);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isScanning, onComplete]);

  if (!isScanning) return null;

  const currentStep = SCAN_STEPS[step];
  const Icon = currentStep.icon;
  const isComplete = step === SCAN_STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm"
      >
        <motion.div
          className="bg-card rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-border"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          {/* Scanner animation */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
            />
            {/* Scanning line */}
            {!isComplete && (
              <motion.div
                animate={{ y: [0, 100, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                style={{ top: '20%' }}
              />
            )}
            {/* Center icon */}
            <div className={`absolute inset-0 flex items-center justify-center rounded-full ${
              isComplete ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <motion.div
                key={step}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Icon className={`w-12 h-12 ${isComplete ? 'text-primary' : 'text-primary/60'}`} />
              </motion.div>
            </div>
          </div>

          {/* Status text */}
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center font-semibold text-foreground mb-2"
          >
            {currentStep.label}
          </motion.p>
          <p className="text-center text-sm text-muted-foreground mb-4 capitalize">
            {documentType.replace(/_/g, ' ')}
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
