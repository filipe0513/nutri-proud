/* eslint-disable react-hooks/set-state-in-effect */
"use client";


import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MOTIVATIONAL_PHRASES } from "@/constants/motivations";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [phrase, setPhrase] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length);
    setPhrase(MOTIVATIONAL_PHRASES[randomIndex]);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Avoid hydration mismatch by not rendering anything on the server
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-600 to-brand-500"
        >
          <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-sm w-full space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-48 h-auto"
            >
              <Image
                src="/logo-white.webp"
                alt="Logo Orgulho da Nutri"
                width={300}
                height={100}
                className="w-full h-auto drop-shadow-md"
                priority
              />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              className="text-title-3 text-white font-medium px-4 leading-relaxed tracking-wide drop-shadow-sm"
            >
              {phrase}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
