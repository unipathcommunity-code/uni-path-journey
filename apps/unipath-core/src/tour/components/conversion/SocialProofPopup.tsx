import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Users } from "lucide-react";
import { useFeatureToggles } from "@/hooks/useFeatureToggles";

const mockBookings = [
  { name: "Aziz", city: "Toshkent", tour: "Istanbul Sayohati", time: "2 daqiqa oldin" },
  { name: "Nilufar", city: "Samarqand", tour: "Dubay Turi", time: "5 daqiqa oldin" },
  { name: "Jasur", city: "Buxoro", tour: "Koreya Sayohati", time: "8 daqiqa oldin" },
  { name: "Malika", city: "Toshkent", tour: "Tailand Turi", time: "12 daqiqa oldin" },
  { name: "Sardor", city: "Namangan", tour: "Umra Ziyorati", time: "15 daqiqa oldin" },
  { name: "Dildora", city: "Farg'ona", tour: "Misr Piramidalar", time: "20 daqiqa oldin" },
];

const SocialProofPopup = () => {
  const { isFeatureEnabled } = useFeatureToggles();
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("social_proof_dismissed") === "true";
  });

  const featureOff = !isFeatureEnabled("social_proof");

  useEffect(() => {
    if (dismissed || featureOff) return;
    const showTimer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(showTimer);
  }, [dismissed, featureOff]);

  useEffect(() => {
    if (dismissed || featureOff || !visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % mockBookings.length);
        setVisible(true);
      }, 3000);
    }, 4000);
    return () => clearTimeout(hideTimer);
  }, [visible, current, dismissed, featureOff]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("social_proof_dismissed", "true");
  };

  if (dismissed || featureOff) return null;

  const booking = mockBookings[current];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 z-50 bg-card border border-border rounded-xl shadow-xl p-4 max-w-xs"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                <span className="text-primary">{booking.name}</span> ({booking.city})
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">{booking.tour}</span>ni band qildi
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {booking.time}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialProofPopup;
