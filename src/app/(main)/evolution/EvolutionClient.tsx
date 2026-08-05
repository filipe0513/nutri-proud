'use client';

import { useState } from 'react';
import { Camera, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TopHeader } from '@/components/shared/TopHeader';
import { EvolutionDrawer } from '@/components/shared/EvolutionDrawer';
import { Card, CardContent } from '@/components/ui/card';

interface EvolutionLog {
  id: string;
  event_time: string;
  details: {
    photo_url: string;
    weight_kg: number;
  };
}

interface EvolutionClientProps {
  initialWeight: number;
  historyLogs: EvolutionLog[];
}

export function EvolutionClient({ initialWeight, historyLogs }: EvolutionClientProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showRules, setShowRules] = useState(true);

  return (
    <div className="pb-32 pt-24 px-6 max-w-lg mx-auto space-y-6">
      <TopHeader leftAction="back" title="Evolução" rightAction="none" />

      {/* Hero Educativo */}
      {showRules && (
        <Card className="bg-notify-info-glass backdrop-blur-md border border-notify-info/40 shadow-sm rounded-3xl relative overflow-hidden">
          <button 
            onClick={() => setShowRules(false)}
            className="absolute top-4 right-4 text-notify-info hover:bg-notify-info/10 rounded-full p-1 transition-colors"
            aria-label="Esconder dicas"
          >
            &times;
          </button>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-notify-info">
              <Info className="h-5 w-5" />
              <h3 className="text-body-1 font-bold">Dicas para a foto perfeita</h3>
            </div>
            <ul className="text-body-2 text-notify-info/90 space-y-2 list-disc pl-5">
              <li>Tire a foto no <strong>mesmo horário</strong> (ideal: jejum pela manhã).</li>
              <li>Sempre <strong>após ir ao banheiro</strong>.</li>
              <li>Use <strong>luz natural</strong> e o mesmo fundo.</li>
              <li>Use a <strong>mesma roupa</strong> ou peças semelhantes.</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {!showRules && (
        <button 
          onClick={() => setShowRules(true)}
          className="flex items-center gap-2 text-caption-1 font-medium text-brand-500 hover:text-brand-600 transition-colors mx-auto"
        >
          <Info className="h-4 w-4" />
          Ver dicas de fotos
        </button>
      )}

      {/* Main Action */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-tr from-brand-500 to-brand-400 text-white rounded-3xl p-4 text-body-1 font-bold shadow-lg shadow-brand-500/30 hover:scale-[1.02] active:scale-95 transition-all"
      >
        <Camera className="h-5 w-5" />
        Registrar Check-in
      </button>

      {/* Feed de Evolução */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 font-bold text-neutral-600">Histórico</h2>
          <span className="text-caption-2 text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full">
            {historyLogs.length} {historyLogs.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {historyLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-70">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
              <Camera className="h-8 w-8 text-neutral-400" />
            </div>
            <p className="text-body-2 font-medium text-neutral-500 max-w-[200px]">
              Seu primeiro passo rumo à melhor versão de si mesmo começa aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {historyLogs.map((log) => (
              <div 
                key={log.id} 
                className="bg-glass-light-1 backdrop-blur-sm border border-white/40 shadow-sm rounded-2xl overflow-hidden flex flex-col group hover:shadow-md transition-all cursor-pointer"
              >
                <div className="relative aspect-[3/4] bg-neutral-200">
                  {/* Imagem do Cloudinary */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={log.details.photo_url} 
                    alt="Check-in de evolução" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Fade gradient bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Info sobre a foto */}
                  <div className="absolute bottom-2 left-2 right-2 text-white flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-title-3 font-bold leading-none">
                        {log.details.weight_kg}
                        <span className="text-caption-2 ml-0.5 opacity-80">kg</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Data */}
                <div className="p-3 bg-white/50 flex items-center gap-1.5 text-neutral-500">
                  <Calendar className="h-3.5 w-3.5 opacity-70" />
                  <span className="text-caption-2 font-medium">
                    {format(new Date(log.event_time), "d MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <EvolutionDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen} 
        initialWeight={initialWeight} 
      />
    </div>
  );
}
