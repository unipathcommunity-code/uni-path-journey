import { useState, useEffect } from "react";
import { Clock, Flame, Users } from "lucide-react";
import { motion } from "framer-motion";

interface UrgencyBadgeProps {
  seatsLeft?: number;
  maxPeople?: number;
  showCountdown?: boolean;
  tourPrice?: number;
}

const UrgencyBadge = ({ seatsLeft = 5, maxPeople = 20, showCountdown = true, tourPrice }: UrgencyBadgeProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 30 });

  useEffect(() => {
    if (!showCountdown) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showCountdown]);

  const seatPercent = ((maxPeople - seatsLeft) / maxPeople) * 100;

  return (
    <div className="space-y-3">
      {/* Seats left */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-lg"
      >
        <Flame className="h-4 w-4 animate-pulse" />
        <span className="text-sm font-semibold">Faqat {seatsLeft} ta joy qoldi!</span>
      </motion.div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{maxPeople - seatsLeft} kishi band qilgan</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{maxPeople} joydan</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${seatPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-destructive rounded-full"
          />
        </div>
      </div>

      {/* Countdown */}
      {showCountdown && (
        <div className="flex items-center gap-2 bg-accent/10 px-3 py-2 rounded-lg">
          <Clock className="h-4 w-4 text-accent-foreground" />
          <span className="text-xs text-muted-foreground">Bu narxda qolgan vaqt:</span>
          <span className="text-sm font-bold font-mono text-primary">
            {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
};

export default UrgencyBadge;
