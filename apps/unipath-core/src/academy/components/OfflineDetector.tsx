import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

const OfflineDetector = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 2500);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] bg-destructive text-destructive-foreground px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium"
        >
          <WifiOff className="w-3.5 h-3.5" />
          Internet aloqasi yo'q
        </motion.div>
      )}
      {showRestored && isOnline && (
        <motion.div
          key="restored"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] bg-success text-success-foreground px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-medium"
        >
          <Wifi className="w-3.5 h-3.5" />
          Aloqa tiklandi
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineDetector;
