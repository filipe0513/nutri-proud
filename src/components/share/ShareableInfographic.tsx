'use client';

import React from 'react';

export type InfographicPillar = 'WATER' | 'FOOD' | 'TRAINING' | 'SLEEP' | 'GUT';

export interface PillarScores {
  WATER: number;
  FOOD: number;
  TRAINING: number;
  SLEEP: number;
  GUT: number;
}

export interface ShareableInfographicProps {
  periodName: string;
  scores: PillarScores;
  globalScore: number;
  bestPillars: InfographicPillar[];
}

const PILLAR_BG_MAP: Record<InfographicPillar, string> = {
  WATER: '/share/share-water.webp',
  FOOD: '/share/share-food.webp',
  TRAINING: '/share/share-training.webp',
  SLEEP: '/share/share-sleep.webp',
  GUT: '/share/share-gut.webp',
};

const PILLAR_META: Record<InfographicPillar, { label: string; emoji: string; color: string }> = {
  WATER: { label: 'Água', emoji: '💧', color: '#38bdf8' },
  FOOD: { label: 'Alimentação', emoji: '🥗', color: '#4ade80' },
  TRAINING: { label: 'Treino', emoji: '🏋️', color: '#fb923c' },
  SLEEP: { label: 'Sono', emoji: '🌙', color: '#a78bfa' },
  GUT: { label: 'Intestino', emoji: '💩', color: '#fbbf24' },
};

const PILLAR_ORDER: InfographicPillar[] = ['WATER', 'FOOD', 'TRAINING', 'SLEEP', 'GUT'];

function getScoreGradient(score: number): string {
  if (score <= 50) return 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)';
  if (score <= 60) return 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)';
  if (score <= 70) return 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)';
  if (score <= 80) return 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)';
  if (score <= 90) return 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)';
  return 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excelente! 🔥';
  if (score >= 80) return 'Muito Bom! 💪';
  if (score >= 70) return 'Bom Desempenho';
  if (score >= 60) return 'Dá para melhorar';
  if (score >= 50) return 'Em Progresso';
  return 'Foco total agora!';
}

/**
 * A fixed-size (375×667) Stories-format infographic designed to be
 * captured by html-to-image. It uses ONLY inline styles to ensure
 * cross-browser fidelity during canvas rendering.
 *
 * IMPORTANT: Do NOT use next/image <Image /> here — the html-to-image
 * library requires native <img> tags or CSS background-image.
 */
export const ShareableInfographic = React.forwardRef<
  HTMLDivElement,
  ShareableInfographicProps
>(({ periodName, scores, globalScore, bestPillars }, ref) => {
  const primaryBestPillar = bestPillars[0] || 'WATER';
  const bgImage = PILLAR_BG_MAP[primaryBestPillar];
  const scoreGradient = getScoreGradient(globalScore);
  const scoreLabel = getScoreLabel(globalScore);

  return (
    <div
      ref={ref}
      style={{
        width: '375px',
        height: '667px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Dark overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.70) 100%)',
          zIndex: 1,
        }}
      />

      {/* Decorative accent blur */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PILLAR_META[primaryBestPillar].color}44 0%, transparent 70%)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ===== HEADER ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '28px 24px 0',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {/* Vertical Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-white.webp"
          alt="Orgulho da Nutri"
          style={{ width: '80px', height: 'auto', objectFit: 'contain' }}
        />

        {/* Score Ring */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: scoreGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4)`,
            border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-1px',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {Math.min(100, Math.round(globalScore))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CENTER SCORE LABEL ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          paddingTop: '20px',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}
        >
          {scoreLabel}
        </div>

        {/* Best pillar(s) badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '14px',
            paddingRight: '14px',
            paddingTop: '8px',
            paddingBottom: '8px',
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            {bestPillars.length > 1 ? 'Melhores pilares:' : 'Melhor pilar:'}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {bestPillars.map((p) => (
              <span key={p} style={{ fontSize: '15px' }}>
                {PILLAR_META[p].emoji}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '16px 20px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Period chip (Moved near pillar bars) */}
        <div
          className="flex flex-col items-center justify-center w-full text-center"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '100px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            alignSelf: 'center',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
            📅 {periodName}
          </span>
        </div>

        {/* Pillar bars */}
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {PILLAR_ORDER.map((pillar) => {
            const meta = PILLAR_META[pillar];
            const score = scores[pillar];
            const isBest = bestPillars.includes(pillar);
            return (
              <div key={pillar} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Emoji */}
                <span style={{ fontSize: '14px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                  {meta.emoji}
                </span>

                {/* Label */}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: isBest ? 700 : 500,
                    color: isBest ? '#fff' : 'rgba(255,255,255,0.75)',
                    width: '88px',
                    flexShrink: 0,
                  }}
                >
                  {meta.label}
                </span>

                {/* Bar track */}
                <div
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '100px',
                    background: 'rgba(255,255,255,0.15)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, score)}%`,
                      borderRadius: '100px',
                      background: isBest
                        ? `linear-gradient(90deg, ${meta.color}, ${meta.color}cc)`
                        : 'rgba(255,255,255,0.45)',
                    }}
                  />
                </div>

                {/* Score */}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isBest ? meta.color : 'rgba(255,255,255,0.65)',
                    width: '28px',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {Math.round(score)}
                </span>
              </div>
            );
          })}
        </div>

        {/* CTA / branding */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}
          >
            Acompanhe seus hábitos em{' '}
            <span style={{ color: '#fff', fontWeight: 700 }}>orgulhodanutri.com</span>
          </p>
        </div>
      </div>
    </div>
  );
});

ShareableInfographic.displayName = 'ShareableInfographic';
