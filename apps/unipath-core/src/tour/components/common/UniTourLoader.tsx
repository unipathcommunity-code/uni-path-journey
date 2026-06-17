import { motion } from "framer-motion";
import { Plane } from "lucide-react";

interface UniTourLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

const UniTourLoader = ({ text = "Yuklanmoqda...", size = "md" }: UniTourLoaderProps) => {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };
  const containerSizes = { sm: "py-8", md: "py-16", lg: "min-h-[400px]" };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[size]}`}>
      <motion.div
        animate={{
          x: [0, 40, 0],
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-primary"
      >
        <Plane className={sizes[size]} />
      </motion.div>
      <motion.div
        className="flex gap-1 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
      {text && (
        <motion.p
          className="text-sm text-muted-foreground mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default UniTourLoader;
