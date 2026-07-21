/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useAppStore } from '@/store/store';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Droplet, Moon, Utensils, Dumbbell, Smile } from 'lucide-react';
import { useEffect, useState } from 'react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  water: Droplet,
  sleep: Moon,
  food: Utensils,
  workout: Dumbbell,
  poop: Smile,
};

const CATEGORY_COLORS: Record<string, string> = {
  water: 'from-blue-400 to-blue-600',
  sleep: 'from-indigo-400 to-indigo-600',
  food: 'from-green-400 to-green-600',
  workout: 'from-red-400 to-red-600',
  poop: 'from-amber-500 to-amber-700',
  default: 'from-brand-400 to-brand-600',
};

export function SuccessOverlay() {
  const successOverlay = useAppStore(state => state.successOverlay);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const isOpen = successOverlay?.isOpen;
  const message = successOverlay?.message || '';
  const submessage = successOverlay?.submessage || '';
  const category = successOverlay?.category || 'default';

  const Icon = category && CATEGORY_ICONS[category] ? CATEGORY_ICONS[category] : CheckCircle2;
  const gradient = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
            className={`w-full max-w-sm rounded-[40px] p-8 shadow-2xl flex flex-col items-center text-center text-white bg-gradient-to-b ${gradient}`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ 
                delay: 0.2,
                scale: { type: 'spring', stiffness: 200, damping: 10 },
                rotate: { duration: 0.5, ease: 'easeInOut' }
              }}
              className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur-sm"
            >
              <Icon size={64} className="text-white drop-shadow-md" strokeWidth={2.5} />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-title-2 font-bold mb-2 tracking-tight"
            >
              {message}
            </motion.h2>
            
            {submessage && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-body-1 text-white/90 font-medium"
              >
                {submessage}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
