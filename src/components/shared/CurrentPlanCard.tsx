"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight, Crown, Star } from "lucide-react";

type PlanUsage = {
  plan: 'FREE' | 'START' | 'PRO';
  groups: { current: number; limit: number };
  patients: { current: number; limit: number };
};

export function CurrentPlanCard() {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/plans/usage');
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch plan usage", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm rounded-3xl overflow-hidden animate-pulse">
        <CardContent className="p-6 h-32" />
      </Card>
    );
  }

  if (!usage) return null;

  const { plan, patients } = usage;
  const isPro = plan === 'PRO';
  const progressPercent = isPro ? 100 : Math.min((patients.current / patients.limit) * 100, 100);

  return (
    <Card className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm rounded-3xl overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isPro ? 'bg-amber-100 text-amber-600' : 'bg-brand-100 text-brand-600'}`}>
              {isPro ? <Crown className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-caption-2 text-neutral-500 font-medium uppercase tracking-wider">Seu Plano</p>
              <p className="text-title-3 font-bold text-neutral-700">
                {plan === 'FREE' && "Nutri Free"}
                {plan === 'START' && "Nutri Start"}
                {plan === 'PRO' && "Nutri Pro"}
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-1 text-button-1 font-bold text-brand-500 hover:text-brand-600 transition-colors"
          >
            Upgrade
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {!isPro && (
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            <div className="flex justify-between items-center text-caption-1">
              <span className="text-neutral-500">Pacientes Convidados</span>
              <span className="font-semibold text-neutral-600">
                {patients.current} / {patients.limit}
              </span>
            </div>
            <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-brand-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {isPro && (
          <div className="pt-2 border-t border-slate-200/60">
            <p className="text-caption-1 text-neutral-500 font-medium">Tudo ilimitado. Aproveite!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
