import React from 'react';
import { motion } from 'motion/react';

interface FloatingTextProps {
  x: number;
  y: number;
  text: string;
  onComplete: () => void;
}

export const FloatingText: React.FC<FloatingTextProps> = ({ x, y, text, onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: y, x: x - 20 }}
      animate={{ opacity: 0, y: y - 100 }}
      transition={{ duration: 1, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none text-indigo-400 font-bold text-xl z-[100] drop-shadow-lg"
    >
      {text}
    </motion.div>
  );
};
