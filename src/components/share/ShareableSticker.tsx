import { forwardRef } from 'react';
import { Flame, Droplets, Utensils, Moon, Activity, Trophy, Link2, Scale } from 'lucide-react';
import type { InfographicPillar } from './ShareableInfographic';

export type StickerType = 'GLOBAL' | InfographicPillar | 'WEIGHT';
export type StickerTheme = 'dark' | 'light' | 'gradient';

export interface ShareableStickerProps {
  type: StickerType;
  score: number;
  metadata?: string;
  pillarScores?: Partial<Record<InfographicPillar, number>>;
  theme?: StickerTheme;
}

const ICONS: Record<StickerType, React.ElementType> = {
  GLOBAL: Trophy,
  WATER: Droplets,
  FOOD: Utensils,
  TRAINING: Flame,
  SLEEP: Moon,
  GUT: Activity,
  WEIGHT: Scale,
};

const LABELS: Record<StickerType, string> = {
  GLOBAL: 'Score do Dia',
  WATER: 'Hidratação',
  FOOD: 'Alimentação',
  TRAINING: 'Treino',
  SLEEP: 'Sono',
  GUT: 'Intestino',
  WEIGHT: 'Evolução',
};

interface ThemeStyle {
  containerStyle: React.CSSProperties;
  textColor: string;
  subTextColor: string;
  barBgClass: string;
  barFillClass: string;
}

const THEME_STYLES: Record<StickerTheme, ThemeStyle> = {
  dark: {
    containerStyle: {
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
    textColor: '#ffffff',
    subTextColor: 'rgba(255,255,255,0.9)',
    barBgClass: 'bg-white/20',
    barFillClass: 'bg-white',
  },
  light: {
    containerStyle: {
      background: 'rgba(255,255,255,0.85)',
      border: '1px solid rgba(0,0,0,0.1)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    },
    textColor: '#404040',
    subTextColor: '#525252',
    barBgClass: 'bg-neutral-200',
    barFillClass: 'bg-neutral-600',
  },
  gradient: {
    containerStyle: {
      background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
    },
    textColor: '#ffffff',
    subTextColor: 'rgba(255,255,255,0.9)',
    barBgClass: 'bg-white/20',
    barFillClass: 'bg-white',
  },
};

export const ShareableSticker = forwardRef<HTMLDivElement, ShareableStickerProps>(
  ({ type, score, metadata, pillarScores, theme = 'dark' }, ref) => {
    const Icon = ICONS[type];
    const t = THEME_STYLES[theme];

    return (
      <div
        ref={ref}
        style={{
          width: '220px',
          background: 'transparent',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          className="rounded-[24px] p-5 shadow-2xl drop-shadow-2xl flex flex-col items-center"
          style={t.containerStyle}
        >
          <div className="flex items-center gap-2 mb-3 drop-shadow-md" style={{ color: t.textColor }}>
            <Icon className="h-5 w-5" />
            <span className="font-semibold text-base">{LABELS[type]}</span>
          </div>

          <div
            className="text-5xl font-black tracking-tighter drop-shadow-md mb-2"
            style={{ color: t.textColor }}
          >
            {type === 'WEIGHT' ? (
              <>
                {score}
                <span className="text-xl font-medium ml-1">kg</span>
              </>
            ) : (
              score
            )}
          </div>

          {metadata && (
            <div
              className="text-sm font-medium drop-shadow-md text-center mb-3"
              style={{ color: t.subTextColor }}
            >
              {metadata}
            </div>
          )}

          {type === 'GLOBAL' && pillarScores && Object.keys(pillarScores).length > 0 && (
            <div className="w-full flex justify-between gap-1.5 mt-2 mb-3">
              {(Object.keys(pillarScores) as InfographicPillar[]).map((p) => {
                const PillarIcon = ICONS[p as StickerType];
                return (
                  <div key={p} className="flex-1 flex flex-col items-center gap-1.5">
                    <PillarIcon className="w-3.5 h-3.5 drop-shadow-md" style={{ color: t.subTextColor }} />
                    <div className={`h-2 w-full rounded-full overflow-hidden ${t.barBgClass}`}>
                      <div
                        className={`h-full rounded-full ${t.barFillClass}`}
                        style={{ width: `${pillarScores[p] ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="mt-1 text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5 drop-shadow-md"
            style={{ color: t.subTextColor }}
          >
            <Link2 className="w-3 h-3" /> orgulhodanutri.com
          </div>
        </div>
      </div>
    );
  }
);
ShareableSticker.displayName = 'ShareableSticker';
