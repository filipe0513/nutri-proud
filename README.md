# Orgulho da Nutri

A gamified daily health diary PWA for patients and nutritionists. Tracks 5 pillars: Water, Food, Sleep, Workout, and Bowel — with one-click logging, AI insights, and a B2B2C team model where nutritionists monitor patients via a dedicated dashboard.

## Tech Stack

| Layer | Tools |
|---|---|
| Core | React 19 · Next.js 16 (App Router, Full-Stack) · TypeScript 5 |
| Styling | Tailwind CSS v4 (CSS-first `@theme` in `globals.css`) · Shadcn UI · Radix UI |
| Auth | Auth.js v5 beta — Magic Link (Resend) + Google OAuth |
| State | Zustand (UI cache & optimistic updates only) |
| Database | PostgreSQL on Supabase via Prisma 7 (`@prisma/adapter-pg`) |
| Validation | Zod 4 (isomorphic schemas in `src/schemas/`) |
| AI | Google Gemini (`@google/generative-ai`) |
| Testing | Vitest + vitest-mock-extended · Playwright (E2E) |
| Monitoring | Sentry · PostHog |
| Push | OneSignal |
| Media | Cloudinary |

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (local instance for development)

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in the required variables (see CONTRIBUTING.md for the full list)

# 3. Apply migrations and generate Prisma client
npx prisma migrate deploy
npx prisma generate

# 4. Start dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Key Scripts

```bash
npm run dev          # Development server
npm run validate     # Full pipeline: typecheck + lint + test + build
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npx prisma studio    # Database GUI
```

## Project Docs

| File | Purpose |
|---|---|
| `CLAUDE.md` | Agent instructions — architecture rules, design system, Definition of Done |
| `PROJECT_CONTEXT.md` | Product context, data model, Git flow |
| `CONTRIBUTING.md` | Setup guide, commit convention, PR process |
| `CHANGELOG.md` | Version history |
| `.claude/` | Agent cheat-sheets (patterns, commands, agents) |

## Architecture Overview

```
src/
├── app/          # Next.js App Router (pages + API routes)
├── components/   # UI primitives (ui/) and shared app components (shared/)
├── services/     # Business logic layer — all DB/AI logic lives here
├── schemas/      # Zod schemas shared between front and back
├── store/        # Zustand stores (session + UI cache only)
└── lib/          # Prisma client, rate limiting, utilities
```

Routes are thin controllers. All logic lives in `src/services/`. See `CLAUDE.md` for full rules.
