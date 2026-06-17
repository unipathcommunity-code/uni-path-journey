import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
  hover?: boolean;
}

const AnimatedCard = ({ children, index = 0, className, hover = true }: AnimatedCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
    className={className}
  >
    {children}
  </motion.div>
);

export default AnimatedCard;
