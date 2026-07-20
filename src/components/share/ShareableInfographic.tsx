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
  bestPillar: InfographicPillar;
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
  if (score >= 80) return 'linear-gradient(135deg, #10b981, #059669)';
  if (score >= 70) return 'linear-gradient(135deg, #3b82f6, #2563eb)';
  if (score >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
  if (score >= 50) return 'linear-gradient(135deg, #ef4444, #dc2626)';
  return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente! 🔥';
  if (score >= 70) return 'Muito Bem! 💪';
  if (score >= 60) return 'Bom Desempenho';
  if (score >= 50) return 'Em Progresso';
  return 'Continue Firme!';
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
>(({ periodName, scores, globalScore, bestPillar }, ref) => {
  const bgImage = PILLAR_BG_MAP[bestPillar];
  const scoreGradient = getScoreGradient(globalScore);
  const scoreLabel = getScoreLabel(globalScore);
  const bestMeta = PILLAR_META[bestPillar];

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
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.70) 100%)',
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
          background: `radial-gradient(circle, ${bestMeta.color}33 0%, transparent 70%)`,
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
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-white-h.webp"
          alt="Orgulho da Nutri"
          style={{ height: '24px', width: 'auto', objectFit: 'contain', alignSelf: 'flex-start' }}
        />

        {/* Period chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            paddingLeft: '10px',
            paddingRight: '10px',
            paddingTop: '4px',
            paddingBottom: '4px',
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.25)',
            alignSelf: 'flex-start',
            marginTop: '4px',
          }}
        >
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
            📅 {periodName}
          </span>
        </div>
      </div>

      {/* ===== CENTER SCORE ===== */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0',
          paddingTop: '8px',
        }}
      >
        {/* Score ring */}
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: scoreGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 48px 8px ${bestMeta.color}55, 0 20px 60px rgba(0,0,0,0.4)`,
            border: '3px solid rgba(255,255,255,0.3)',
            marginBottom: '16px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-2px',
              }}
            >
              {Math.min(100, Math.round(globalScore))}
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                marginTop: '2px',
                letterSpacing: '0.5px',
              }}
            >
              PONTOS
            </div>
          </div>
        </div>

        {/* Score label */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#fff',
            textAlign: 'center',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {scoreLabel}
        </div>

        {/* Best pillar badge */}
        <div
          style={{
            marginTop: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            paddingLeft: '14px',
            paddingRight: '14px',
            paddingTop: '6px',
            paddingBottom: '6px',
            borderRadius: '100px',
            background: `${bestMeta.color}33`,
            border: `1px solid ${bestMeta.color}88`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span style={{ fontSize: '15px' }}>{bestMeta.emoji}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
            Melhor pilar: {bestMeta.label}
          </span>
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
        {/* Pillar bars */}
        <div
          style={{
            background: 'rgba(0,0,0,0.35)',
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
            const isBest = pillar === bestPillar;
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
              color: 'rgba(255,255,255,0.65)',
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
