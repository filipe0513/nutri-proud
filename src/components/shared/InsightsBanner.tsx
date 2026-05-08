'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function InsightsBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
    >
      <Link href="/insights" className="block">
        <div className="bg-gradient-insights rounded-2xl px-5 py-4 flex items-center space-x-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-title-3 text-white font-semibold">Ver Insights</p>
            <p className="text-body-2 text-white/80">
              Confira suas estatísticas da semana
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
