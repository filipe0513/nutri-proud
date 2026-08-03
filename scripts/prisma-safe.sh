#!/usr/bin/env bash
# ============================================================
# scripts/prisma-safe.sh — Wrapper de segurança para Prisma
#
# Substitui o comando `prisma` direto e bloqueia comandos
# destrutivos que apontam para o banco de produção (Supabase).
#
# INCIDENTE: 03/08/2026 — `prisma migrate reset` apagou todo
# o banco de produção porque prisma.config.ts usa DIRECT_URL
# (Supabase), não o banco local. NUNCA MAIS.
# ============================================================

set -euo pipefail

# Detecta o binário real do prisma no node_modules
PRISMA_BIN="$(npm bin)/prisma"
if [ ! -f "$PRISMA_BIN" ]; then
  PRISMA_BIN="npx --no-install prisma"
fi

ARGS=("$@")

# ─────────────────────────────────────────────
# 🚨 BLOCO DE COMANDO PROIBIDO: migrate reset
# ─────────────────────────────────────────────
if [[ "${ARGS[*]}" == *"migrate reset"* ]]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  🚨  COMANDO BLOQUEADO: prisma migrate reset                ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║                                                              ║"
  echo "║  Este comando está PROIBIDO neste projeto.                   ║"
  echo "║                                                              ║"
  echo "║  MOTIVO: prisma.config.ts usa DIRECT_URL (.env) que aponta  ║"
  echo "║  para o Supabase de PRODUÇÃO. O reset apaga TUDO via        ║"
  echo "║  DROP SCHEMA public CASCADE — sem recuperação possível.     ║"
  echo "║                                                              ║"
  echo "║  INCIDENTE: 03/08/2026 — todos os dados de prod perdidos.   ║"
  echo "║                                                              ║"
  echo "║  ALTERNATIVAS SEGURAS:                                       ║"
  echo "║  • Nova migration:  npx prisma migrate dev --name <nome>    ║"
  echo "║  • Aplicar em prod: npx prisma migrate deploy               ║"
  echo "║  • Reset local:     ver .agents/AGENTS.md                   ║"
  echo "║                                                              ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  exit 1
fi

# ─────────────────────────────────────────────
# 🚨 BLOCO DE COMANDO PROIBIDO: db push (sem --preview-feature em prod)
# ─────────────────────────────────────────────
if [[ "${ARGS[*]}" == *"db push"* ]]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  ⚠️   AVISO: prisma db push em ambiente de produção          ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Este comando sincroniza o schema SEM criar migrations.      ║"
  echo "║  Use 'prisma migrate dev' + 'prisma migrate deploy' em vez.  ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  exit 1
fi

# Passa para o prisma real
exec $PRISMA_BIN "${ARGS[@]}"
