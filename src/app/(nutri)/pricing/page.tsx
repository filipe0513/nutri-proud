"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Crown, Star } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store/store";

export default function PricingPage() {
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'START' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(true);
  const userProfile = useAppStore((state) => state.user_profile);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/plans/usage');
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.plan);
        }
      } catch (error) {
        console.error("Failed to fetch plan", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contato@orgulhodanutri.com";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-6 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-full flex items-center justify-between lg:justify-start lg:gap-8 mb-4">
          <Link
            href="/dashboard/settings"
            className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-neutral-500 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-title-1 font-bold text-neutral-700">Planos & Assinaturas</h1>
          <div className="w-10 lg:hidden" />
        </div>
        <p className="text-body-1 text-neutral-500 max-w-xl">
          Evolua sua prática clínica e ofereça a melhor experiência gamificada para seus pacientes.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FREE PLAN */}
        <Card className={`relative bg-white shadow-sm rounded-3xl overflow-hidden border-2 ${currentPlan === 'FREE' ? 'border-brand-300' : 'border-slate-100'}`}>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-title-2 font-bold text-neutral-700">Nutri Free</CardTitle>
            <p className="text-title-1 font-bold text-neutral-700 mt-2">
              R$ 0<span className="text-body-2 font-normal text-neutral-400">/mês</span>
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <ul className="space-y-3 text-body-2 text-neutral-600">
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-brand-500" /> 1 Grupo (Team)</li>
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-brand-500" /> Até 5 Pacientes</li>
              <li className="flex items-center gap-2 text-neutral-400"><Check className="h-5 w-5 text-neutral-300" /> Histórico Limitado</li>
            </ul>
            <Button 
              className="w-full h-12 rounded-2xl font-bold text-button-1"
              variant={currentPlan === 'FREE' ? "outline" : "default"}
              disabled={currentPlan === 'FREE'}
            >
              {currentPlan === 'FREE' ? "Seu Plano Atual" : "Downgrade (Fale Conosco)"}
            </Button>
          </CardContent>
        </Card>

        {/* START PLAN */}
        <Card className={`relative bg-glass-light-1 backdrop-blur-md shadow-lg rounded-3xl overflow-hidden border-2 ${currentPlan === 'START' ? 'border-brand-500' : 'border-brand-100'}`}>
          {currentPlan === 'START' && (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-500"></div>
          )}
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-brand-500" />
              <CardTitle className="text-title-2 font-bold text-neutral-700">Nutri Start</CardTitle>
            </div>
            <p className="text-title-1 font-bold text-neutral-700 mt-2">
              R$ 14,90<span className="text-body-2 font-normal text-neutral-400">/mês</span>
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <ul className="space-y-3 text-body-2 text-neutral-600">
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-brand-500" /> 5 Grupos (Teams)</li>
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-brand-500" /> Até 15 Pacientes</li>
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-brand-500" /> Histórico Completo</li>
            </ul>
            {currentPlan === 'START' ? (
              <Button className="w-full h-12 rounded-2xl font-bold text-button-1" variant="outline" disabled>
                Seu Plano Atual
              </Button>
            ) : (
              <Button asChild className="w-full h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-button-1 shadow-md">
                <a href={`mailto:${contactEmail}?subject=Quero fazer o Upgrade para o plano START&body=Olá! Meu nome é ${userProfile?.name || ''}, gostaria de migrar para o plano START.`}>
                  Fazer Upgrade
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PRO PLAN */}
        <Card className={`relative bg-neutral-900 shadow-xl rounded-3xl overflow-hidden border-2 ${currentPlan === 'PRO' ? 'border-amber-400' : 'border-neutral-800'}`}>
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Crown className="h-5 w-5" />
              <CardTitle className="text-title-2 font-bold text-white">Nutri Pro</CardTitle>
            </div>
            <p className="text-title-1 font-bold text-white mt-2">
              R$ 19,90<span className="text-body-2 font-normal text-neutral-400">/mês</span>
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <ul className="space-y-3 text-body-2 text-neutral-300">
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-amber-400" /> Grupos Ilimitados</li>
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-amber-400" /> Pacientes Ilimitados</li>
              <li className="flex items-center gap-2"><Check className="h-5 w-5 text-amber-400" /> Suporte Prioritário</li>
            </ul>
            {currentPlan === 'PRO' ? (
              <Button className="w-full h-12 rounded-2xl font-bold text-button-1 border-neutral-700 bg-neutral-800 text-white" disabled>
                Seu Plano Atual
              </Button>
            ) : (
              <Button asChild className="w-full h-12 rounded-2xl bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold text-button-1 shadow-md">
                <a href={`mailto:${contactEmail}?subject=Quero fazer o Upgrade para o plano PRO&body=Olá! Meu nome é ${userProfile?.name || ''}, gostaria de migrar para o plano PRO.`}>
                  Fazer Upgrade
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
