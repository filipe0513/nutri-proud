'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 text-neutral-500">
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-sm text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-48 h-48"
        >
          <Image
            src="/hero.png"
            alt="Nutri Proud Logo"
            fill
            className="object-contain"
            priority
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-4"
        >
          <h1 className="text-title-1 text-neutral-500">
            Nutri Proud
          </h1>
          <p className="text-body-1 text-neutral-500/80 font-medium">
            Sua jornada para uma vida extraordinária começa com um clique.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="w-full max-w-sm pb-10"
      >
        <Button 
          asChild 
          className="w-full h-14 bg-brand-500 hover:bg-brand-400 text-white text-button-1 rounded-2xl shadow-xl transition-all active:scale-95"
        >
          <Link href="/onboarding">
            Começar minha jornada
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
