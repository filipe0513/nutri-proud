# Contributing to Orgulho da Nutri

## Git Flow

```
dev  ──── feature work, AI agent commits ──────► PR to main
main ──── production, human merge only
```

- All development happens on the `dev` branch.
- AI agents are **prohibited** from committing to `main`.
- Vercel deploys `dev` to a preview environment and `main` to production.

## Setting Up Locally

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ running locally

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd nutri-proud
npm install

# 2. Environment variables
cp .env.example .env.local
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
#          RESEND_API_KEY, NEXT_PUBLIC_POSTHOG_KEY, SENTRY_DSN, etc.

# 3. Apply database migrations
npx prisma migrate deploy
npx prisma generate

# 4. Start development server
npm run dev
```

### Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pgBouncer for Supabase) |
| `DIRECT_URL` | Direct PostgreSQL URL (migrations, used by Prisma config) |
| `NEXTAUTH_SECRET` | Random secret for Auth.js |
| `NEXTAUTH_URL` | Base URL of the app (e.g., `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `RESEND_API_KEY` | Resend API key for magic link emails |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL |
| `SENTRY_DSN` | Sentry DSN for error monitoring |

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm run validate` | Full pipeline: typecheck + lint + test + build |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npx prisma studio` | Open Prisma Studio (DB GUI) |
| `npx prisma migrate dev --name <name>` | Create a new migration |

## Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): short description
fix(scope): short description
refactor(scope): short description
chore(scope): short description
```

## Definition of Done

Before every PR or commit, run:

```bash
npx prisma generate
npm run validate
```

Both must pass with zero errors. See `CLAUDE.md` for full agent rules.

## Security Rules

- **Never run `prisma migrate reset`** — it targets the production Supabase database and is destructive.
- **Every new Prisma model must enable RLS** — add `ALTER TABLE "ModelName" ENABLE ROW LEVEL SECURITY;` to the migration SQL.

See `CLAUDE.md` for complete architecture rules and design system tokens.
