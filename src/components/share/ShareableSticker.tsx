import { forwardRef } from 'react';
import { Flame, Droplets, Utensils, Moon, Activity, Trophy, Link2 } from 'lucide-react';
import type { InfographicPillar } from './ShareableInfographic';

export type StickerType = 'GLOBAL' | InfographicPillar;

export interface ShareableStickerProps {
  type: StickerType;
  score: number;
  metadata?: string;
  pillarScores?: Record<InfographicPillar, number>; // Used for GLOBAL
}

const ICONS: Record<StickerType, React.ElementType> = {
  GLOBAL: Trophy,
  WATER: Droplets,
  FOOD: Utensils,
  TRAINING: Flame,
  SLEEP: Moon,
  GUT: Activity,
};

const LABELS: Record<StickerType, string> = {
  GLOBAL: 'Score do Dia',
  WATER: 'Hidratação',
  FOOD: 'Alimentação',
  TRAINING: 'Treino',
  SLEEP: 'Sono',
  GUT: 'Intestino',
};

export const ShareableSticker = forwardRef<HTMLDivElement, ShareableStickerProps>(
  ({ type, score, metadata, pillarScores }, ref) => {
    const Icon = ICONS[type];

    return (
      <div
        ref={ref}
        style={{
          width: '260px',
          padding: '24px',
          background: 'transparent',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          className="bg-black/60 rounded-[32px] p-6 border border-white/20 shadow-2xl drop-shadow-2xl flex flex-col items-center text-white"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-2 mb-3 drop-shadow-md">
            <Icon className="h-6 w-6 text-white" />
            <span className="font-semibold text-lg">{LABELS[type]}</span>
          </div>

          <div className="text-6xl font-black tracking-tighter drop-shadow-md mb-2">
            {score}
          </div>

          {metadata && (
            <div className="text-sm font-medium text-white/90 drop-shadow-md text-center mb-4">
              {metadata}
            </div>
          )}

          {type === 'GLOBAL' && pillarScores && (
            <div className="w-full flex justify-between gap-1.5 mt-2 mb-4">
               {(Object.keys(pillarScores) as InfographicPillar[]).map(p => {
                 const PillarIcon = ICONS[p as StickerType];
                 return (
                   <div key={p} className="flex-1 flex flex-col items-center gap-1.5">
                     <PillarIcon className="w-4 h-4 text-white/90 drop-shadow-md" />
                     <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: `${pillarScores[p]}%` }} />
                     </div>
                   </div>
                 );
               })}
            </div>
          )}

          <div className="mt-2 opacity-90 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> orgulhodanutri.com
          </div>
        </div>
      </div>
    );
  }
);
ShareableSticker.displayName = 'ShareableSticker';
