# 📱 Orgulho da Nutri — Agent Instructions (CLAUDE.md)

> This is the single source of truth for all agent behavior on this project.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## 🎯 Product Overview

A gamified daily health diary PWA tracking **5 pillars**: Water, Food, Sleep, Workout, Bowel. Built for a B2B2C model where Nutritionists can monitor their patients via Teams and a dedicated Dashboard.
**UX Differentiator:** Zero-friction One-Click Actions. Nubank-inspired minimal UI with Cards, Bottom Sheets, and modals — the user never leaves the current page.

---

## 🛠️ Tech Stack

| Layer        | Tool                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| Core         | React 19+ · Next.js 16+ (App Router, Full-Stack)                              |
| Language     | TypeScript 5+                                                                  |
| Styling      | Tailwind CSS v4 (CSS-first config via `@theme` in `globals.css`)               |
| Components   | Shadcn UI + Radix UI                                                           |
| Icons        | Lucide React                                                                   |
| Animation    | Framer Motion                                                                  |
| Auth         | NextAuth / Auth.js v5 beta (Magic Link via Resend + OAuth Google)              |
| Client State | Zustand (UI cache & optimistic updates only — no `persist` for sensitive data) |
| Database     | PostgreSQL on Supabase via **Prisma 7+** (`@prisma/adapter-pg`)                |
| Validation   | Zod 4+ — isomorphic schemas in `src/schemas/`                                  |
| AI           | Google Gemini (`@google/generative-ai`)                                        |
| Monitoring   | Sentry (`@sentry/nextjs`) · PostHog (`posthog-js`)                             |
| Push         | OneSignal (`react-onesignal`)                                                  |
| Media        | Cloudinary (`next-cloudinary`)                                                 |
| Testing      | Vitest + vitest-mock-extended · Playwright (E2E)                               |

---

## 📂 Folder Structure

```text
src/
├── app/
│   ├── (setup)/
│   │   ├── welcome/page.tsx          # Entry screen (login)
│   │   ├── onboarding/page.tsx       # Goals & profile flow
│   │   └── join/[code]/page.tsx      # Team invite deep-link
│   ├── (main)/                       # Main user app (layout.tsx)
│   │   ├── page.tsx                  # Home dashboard (Stories + quick actions)
│   │   ├── evolution/page.tsx        # User evolution / progress view
│   │   ├── history/
│   │   │   ├── page.tsx              # Diary / past records
│   │   │   └── weeks/page.tsx        # Weekly history view
│   │   ├── insights/page.tsx         # AI-generated insights feed
│   │   ├── pillar/[category]/page.tsx # Pillar insight pages
│   │   ├── profile/[id]/page.tsx     # Public user profile
│   │   ├── settings/page.tsx         # Profile & target adjustments
│   │   └── teams/
│   │       ├── page.tsx              # Teams list
│   │       └── [id]/page.tsx         # Single team feed
│   ├── (nutri)/                      # Nutritionist area (layout.tsx)
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Nutri dashboard home
│   │   │   ├── feed/page.tsx         # Patient activity feed
│   │   │   ├── settings/page.tsx     # Nutri settings
│   │   │   └── teams/page.tsx        # Nutri teams management
│   │   └── pricing/page.tsx          # Plan pricing page
│   ├── admin/page.tsx                # ADMIN role only (Recharts, metrics)
│   ├── actions/                      # Server Actions
│   ├── api/                          # RESTful API routes (thin controllers only)
│   └── layout.tsx / globals.css / manifest.ts / sitemap.ts
├── components/
│   ├── ui/                           # Shadcn-generated primitives (Button, Card, Drawer…)
│   ├── shared/                       # App components (~55 files)
│   └── share/                        # Shareable canvas components (Infographic, Sticker)
├── schemas/                          # Zod schemas (shared front ↔ back)
├── services/                         # Business logic layer (~17 services + __tests__/)
├── store/
│   ├── store.ts                      # Main Zustand store (session + UI cache)
│   ├── historyStore.ts               # History-specific state
│   ├── api.ts                        # API fetch helpers
│   └── types.ts                      # Store type definitions
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── rateLimit.ts                  # Rate limiting utility
│   ├── apiAuth.ts                    # API authentication helper
│   ├── cloudinary.ts                 # Cloudinary upload config
│   └── utils.ts                      # Helpers (cn, date utils)
├── providers/
│   └── PostHogProvider.tsx           # Analytics provider
├── constants/
│   └── motivations.ts               # Motivational phrases data
├── data/
│   └── release-notes.json           # Changelog data
├── utils/
│   ├── dateUtils.ts                  # Date formatting helpers
│   ├── scoreUtils.ts                 # Score calculation utilities
│   ├── timeUtils.ts                  # Time-related helpers
│   └── motivationPhrases.ts         # Phrase selection logic
├── types/
│   ├── next-auth.d.ts                # NextAuth type augmentations
│   ├── roles.ts                      # Role type definitions
│   └── teamTypes.ts                  # Team-related types
├── auth.ts                           # NextAuth configuration
└── instrumentation.ts               # Sentry instrumentation
```

---

## 🗺️ Route Map

### Public (no auth)

- `/welcome` — Entry screen. Login via Google, Magic Link, or anonymous.
- `/join/[code]` — Team invite deep-link (redirects after auth).

### Private (requires NextAuth session)

- `/` — Home dashboard: Stories carousel + quick-action cards.
- `/onboarding` — Step-by-step goals, weight, height setup.
- `/evolution` — Progress evolution view.
- `/history` — Log feed with infinite scroll (filter via `?categories=`).
- `/history/weeks` — Weekly aggregated history.
- `/insights` — AI-generated health insights feed.
- `/settings` — Single-page profile and target fine-tuning.
- `/pillar/[category]` — Educational insights. Valid categories: `water`, `food`, `sleep`, `workout`, `poop`.
- `/teams` — List of user's teams.
- `/teams/[id]` — Single team feed with posts, reactions, comments.
- `/profile/[id]` — Public user profile view.

### Nutritionist (`(nutri)` route group)

- `/dashboard` — Nutritionist dashboard home.
- `/dashboard/feed` — Patient activity feed.
- `/dashboard/teams` — Team management.
- `/dashboard/settings` — Nutritionist settings.
- `/pricing` — Plan pricing page (FREE / START / PRO).

### Admin (`role: 'ADMIN'` required)

- `/admin` — Management dashboard (Recharts, conversion metrics).

### Main API Routes

| Method   | Route                              | Purpose                                     |
| -------- | ---------------------------------- | ------------------------------------------- |
| `POST`   | `/api/logs`                        | Save a new DailyLog (Zod-validated)         |
| `GET`    | `/api/logs`                        | Paginated history (`page`, `limit`, `categories`) |
| `DELETE` | `/api/logs/[id]`                   | Delete a specific log                       |
| `POST`   | `/api/logs/jacada`                 | AI-powered log reaction (Jacada)            |
| `POST`   | `/api/auth/anonymous`              | Create anonymous session                    |
| `GET`    | `/api/insights`                    | Fetch user insights                         |
| `GET`    | `/api/insights/latest`             | Fetch latest insight                        |
| `POST`   | `/api/insights/generate`           | Generate new AI insight                     |
| `PATCH`  | `/api/insights/[id]/view`          | Mark insight as viewed                      |
| `GET`    | `/api/streaks`                     | Fetch user streak data                      |
| `GET`    | `/api/progress/weekly`             | Weekly progress summary                     |
| `GET`    | `/api/progress/history-weeks`      | Historical weeks data                       |
| `GET`    | `/api/reports`                     | Generate shareable reports                  |
| `POST`   | `/api/teams`                       | Create a team                               |
| `GET`    | `/api/teams/[id]`                  | Get team details                            |
| `POST`   | `/api/teams/join`                  | Join a team via invite code                 |
| `GET`    | `/api/teams/[id]/posts`            | Fetch team posts                            |
| `POST`   | `/api/posts/[id]/reactions`        | React to a post                             |
| `GET`    | `/api/notifications`               | Fetch user notifications                    |
| `POST`   | `/api/events`                      | Track system events (analytics)             |
| `GET`    | `/api/plans/usage`                 | Check plan usage limits                     |
| `PUT`    | `/api/users/profile`               | Update user profile                         |
| `POST`   | `/api/users/me/push-token`         | Register push notification token            |
| `POST`   | `/api/ai/jacada-reaction`          | AI reaction to logs                         |
| `POST`   | `/api/ai/lifesaver`                | AI lifesaver nudge                          |
| `POST`   | `/api/ai/poop-analysis`            | AI poop analysis                            |
| `POST`   | `/api/cron/triggers`               | Cron-triggered notifications/insights       |
| `GET`    | `/api/dashboard/feed`              | Nutri patient activity feed                 |
| `GET`    | `/api/dashboard/radar`             | Patient radar/analytics                     |
| `POST`   | `/api/dashboard/message`           | Send message to patients                    |
| `POST`   | `/api/dashboard/message/suggest`   | AI message suggestions                      |

---

## 🗄️ Data Model

### DailyLog (Prisma / PostgreSQL)

```typescript
interface DailyLog {
  id: string;           // UUID
  userId: string;
  category: string;     // "water" | "food" | "sleep" | "workout" | "poop" | "note" | "jacada" | "evolution" (lowercase)
  primaryValue: number; // Main numeric value (e.g., ml, hours, score)
  details: Json;        // JSONB — validated by Zod schema in src/schemas/
  eventTime: DateTime;  // When the event actually happened
  source: string;       // "UNKNOWN" default — tracks log origin
  createdAt: DateTime;
}
```

### User (Prisma)

```typescript
interface User {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  is_anonymous: boolean;
  role: string;                     // "USER" | "NUTRITIONIST" | "ADMIN"
  plan: "FREE" | "START" | "PRO";
  oneSignalId: string | null;
  pushEnabled: boolean;
  profile: Json | null;             // { weight_kg, height_cm, gender, main_goal }
  targets: Json | null;             // { water_ml_per_day, sleep_hours_per_night }
  notification_preferences: Json;   // Default: "{}"
  // ... relations: logs, accounts, sessions, notifications, aiInsights, teamMembers, posts, reactions, comments, teamFeedPosts
}
```

### Team / Social (Prisma)

- `Team`: Groups of patients created by Nutritionists. Has `inviteCode` for joining.
- `TeamMember`: Junction with roles `ADMIN` (Nutritionist) or `MEMBER` (Patient). Supports `muteNotifications`.
- `Post`: User-generated or system milestone posts within a team.
- `Reaction`: Emoji reactions on posts (unique per user+post+emoji).
- `Comment`: Text comments on posts.
- `TeamFeedPost`: B2B dashboard feed entries (types: `MILESTONE`, `ALERT`, `EVOLUTION`, `SYSTEM`).

### Notifications & AI

- `Notification`: Push/in-app notifications with categories (`REMINDER`, `ACHIEVEMENT`, `SYSTEM`, `ALERT`).
- `AiInsight`: AI-generated health insights with optional CTA.
- `SystemEvent`: Analytics event tracking (nullable userId for pre-auth events).

---

## 🏗️ Architecture Rules

### Service Layer (MANDATORY)

- **No business logic in `route.ts` files.** Routes are thin controllers: parse → call service → return HTTP.
- All logic lives in `src/services/` (e.g., `logService.ts`, `userService.ts`, `aiService.ts`, `streakService.ts`).

### Validation (MANDATORY)

- Every data shape validated with **Zod 4+**.
- Schemas saved in `src/schemas/`. Import the same schema in both the API route and the frontend form.

### Zustand Store

- Used **only** for: current session, optimistic UI updates, temporary in-memory cache.
- Do **not** use `persist` middleware for data that lives in the database.
- Main store: `src/store/store.ts`. History state: `src/store/historyStore.ts`. API helpers: `src/store/api.ts`.

### Database

- Single `DailyLog` table with JSONB `details` column — no separate tables per category.
- All DB access via Prisma. Run `npx prisma generate` after schema changes.

### 🔒 RLS on Every New Table (MANDATORY — Security)

Every new Prisma `model` that creates a table in the `public` schema **MUST** have Row-Level Security enabled. Without it, anyone with the Supabase project URL can read, edit, and delete all data.

**Rule:** Whenever you create or update `prisma/schema.prisma` with a new `model`, you must add `ALTER TABLE "ModelName" ENABLE ROW LEVEL SECURITY;` to the same migration SQL file.

**Template to append at the end of every `migration.sql` that creates a new table:**

```sql
-- Enable RLS (required for Supabase security)
ALTER TABLE "NewTableName" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "NewTableName" FROM anon;
REVOKE ALL ON TABLE "NewTableName" FROM authenticated;
```

> ⚠️ Forgetting this will trigger a critical security alert from Supabase (`rls_disabled_in_public`).

**History:** In July 2026, tables `Notification`, `AiInsight`, and `SystemEvent` were created without RLS and required a corrective migration (`20260716165500_enable_rls_new_tables`).

### 🚨 FORBIDDEN COMMAND: `prisma migrate reset`

> **ABSOLUTE PROHIBITION — No Exceptions, No Discussion**

The command `prisma migrate reset` is **strictly forbidden** on this project, in any situation, on any branch, in any environment.

**NEVER run:**
```bash
prisma migrate reset        # FORBIDDEN
npx prisma migrate reset    # FORBIDDEN
```

**Why it is so dangerous:** `prisma.config.ts` reads `DIRECT_URL` from `.env`, which points to the **production Supabase database**. This command executes `DROP SCHEMA public CASCADE` on that target — meaning it **irreversibly destroys all production data**.

**Real incident:** On 03/08/2026 at ~09:42 BRT, the command was run during a migration consolidation. The result was total loss of all users, logs, and production data (Supabase Free tier, no automatic backup).

**Safe alternatives:**
- Create a new migration: `npx prisma migrate dev --name <name>` (reads `.env.local` → local DB)
- Apply migrations in prod: `npx prisma migrate deploy` (only applies pending, never destroys)
- Reset ONLY the local DB: **REQUIRES EXPLICIT USER CONFIRMATION before running.** You MUST stop, explain what will be destroyed, and wait for the user to type "confirmo reset local" before executing:
  ```bash
  psql postgresql://postgres:pg123456@localhost:5432/nutriproud -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  npx prisma migrate deploy
  ```
  > ⚠️ This destroys all local data including sessions, users, and logs. Never run autonomously.

---

## 🎨 Design System (STRICT — No Exceptions)

Tailwind v4 CSS-first configuration. All tokens defined in `src/app/globals.css` via `@theme` and `@utility` directives. **No `tailwind.config.ts` file exists.**

Using arbitrary Tailwind font sizes or opacities in new components is **FORBIDDEN**. Use only tokens from `globals.css`.

### Typography Tokens

| Role        | Token                                          |
| ----------- | ---------------------------------------------- |
| Headings    | `text-title-1`, `text-title-2`, `text-title-3` |
| Body        | `text-body-1`, `text-body-2`                   |
| Support     | `text-caption-1`, `text-caption-2`             |
| Interactive | `text-button-1`, `text-input-1`                |

### Color Palette

| Usage                     | Token                                                             |
| ------------------------- | ----------------------------------------------------------------- |
| Page background           | `bg-neutral-100` / `bg-bg-light` / `bg-bg-surface`               |
| Primary text              | `text-neutral-500`                                                |
| Secondary text            | `text-neutral-400`                                                |
| Brand accent              | `bg-brand-500` / `text-brand-500` (orange #F97316)               |
| Success / Warning / Error | `text-notify-success`, `text-notify-warning`, `text-notify-error` |
| Info                      | `text-notify-info` (blue #3B82F6)                                 |
| Category: water           | `text-cat-water` / `bg-cat-water` (blue)                         |
| Category: food            | `text-cat-food` / `bg-cat-food` (green)                          |
| Category: workout         | `text-cat-workout` / `bg-cat-workout` (red)                      |
| Category: sleep           | `text-cat-sleep` / `bg-cat-sleep` (slate)                        |
| Category: poop            | `text-cat-poop` / `bg-cat-poop` (amber)                         |

### Glassmorphism Rules

All overlaid components **must** use translucent backgrounds + blur:

| Component         | Classes                                                     |
| ----------------- | ----------------------------------------------------------- |
| Normal Cards      | `bg-glass-light-1 backdrop-blur-sm border border-white/40`  |
| Bottom Navigation | `bg-glass-light-2 backdrop-blur-md`                         |
| Drawers / Modals  | `bg-glass-light-3 backdrop-blur-lg`                         |
| Secondary glass   | `bg-glass-light-4 backdrop-blur-md`                         |
| Toasts            | `bg-notify-*-glass backdrop-blur-md border border-notify-*` |
| Dark overlays     | `bg-glass-dark-1` / `bg-glass-dark-2`                       |

### Gradient Utilities

| Class                   | Purpose                                    |
| ----------------------- | ------------------------------------------ |
| `bg-mesh-sunset`        | Hero/splash background (purple → peach)    |
| `bg-gradient-score`     | Story scoring visual (purple → pink → orange) |
| `bg-gradient-insights`  | Insights section (teal → purple)           |
| `bg-gradient-fab`       | FAB button (purple → pink)                 |
| `bg-gradient-flow`      | Animated flow (10s infinite cycle)         |

### Story Circle Color Rules

Border color is based on the sum of `score` values for the day:

- `< 50` → `text-notify-error` (red)
- `< 75` → `text-notify-warning` (yellow)
- `>= 75` → `text-notify-success` (green)

---

## 📐 UI Interaction Rules

- **Never redirect** to fill a simple form. Always use `<Drawer>` (Bottom Sheet).
- **Immediate feedback:** close Drawer → fire `<Toast>` with the correct notification color.
- **Contextual buttons:** Inside a Bottom Sheet, the save button color matches the category (e.g., `bg-cat-water` for water).

---

## 🔐 Business Rules

### Anonymous Users

- **Time limit:** Access blocked after **7 days** from first log.
- **Usage limit:** Access blocked after **11 logs** registered.
- **Upgrade (merge):** On real login (Google / Magic Link), transfer all anonymous logs to the new user ID.

### Plans

- `FREE` — Default tier. Limited AI insights and features.
- `START` — Intermediate tier.
- `PRO` — Full access to all features.
- Usage tracked via `/api/plans/usage`.

### RBAC

- Default role: `'USER'`.
- `'ADMIN'` role required for `/admin` routes and admin API endpoints.

---

## 🧪 Testing Protocol

- **Unit tests:** Vitest + `vitest-mock-extended`.
- **E2E tests:** Playwright (`npm run test:e2e`).
- **Scope:** Unit-test the **service layer** (`src/services/`). Don't test routes directly unless strictly necessary.
- **Never** run tests against the real database. Mock Prisma Client (`src/lib/__mocks__/prisma.ts`).
- **Pattern (AAA):**
  1. **Arrange** — set up fake data and Prisma mocks.
  2. **Act** — call the service function.
  3. **Assert** — verify result and Prisma call arguments.
- **Bug fix rule:** If a production bug is reported, write a failing test first, then fix the service to make it pass.

---

## 🌿 Worktree Workflow (MANDATORY — Parallel Agent Safety)

Multiple agents may run simultaneously on this repo. To prevent conflicts, **every task MUST be executed inside a Git worktree**. Never work directly in the main repo directory.

### Step 1 — Detect if already in a worktree

```bash
git rev-parse --git-dir
# Returns ".git" → you are in the main repo → MUST create a worktree
# Returns an absolute path (e.g. /.../.git/worktrees/...) → already in a worktree → proceed
```

### Step 2 — Create the worktree (if not already in one)

Derive a short kebab-case slug from the task (e.g. `fix-water-log`, `feat-team-feed`).

```bash
# From the main repo root:
git worktree add ../nutri-proud-<slug> dev
cd ../nutri-proud-<slug>
```

> The worktree is checked out from `dev` and lives at `../nutri-proud-<slug>` (sibling of the main repo).

### Step 3 — Do all work inside the worktree

All file edits, installs, and commands run from `../nutri-proud-<slug>`. Never touch the main repo directory during the task.

### Step 4 — Validate, commit, and remove the worktree

After all changes are made and green (see Definition of Done below):

```bash
# Inside the worktree:
git add .
git commit -m '<type>(<scope>): <description>'

# Back in the main repo to clean up:
cd /Users/filipemagalhaes/Workspace/personal/nutri-proud
git worktree remove ../nutri-proud-<slug>
```

> `git worktree remove` fails if there are uncommitted changes — this is intentional. Commit first.

---

## ✅ Definition of Done (MANDATORY before reporting task complete)

> **Goal:** Simulate the Vercel build environment locally so deploys never break.

After **every** file change, run the following two commands **in order** (from inside the worktree):

```bash
# 1. Always regenerate Prisma typings first
npx prisma generate

# 2. Full pipeline: typecheck → lint → vitest → next build (Vercel simulation)
npm run validate
```

> **Restrição de Branch (Git Flow):**
> O agente está terminantemente proibido de realizar commits ou fazer push na branch `main`. Todo o desenvolvimento de novas features, correções de bugs e automações feitas pelo agente devem ocorrer **exclusivamente na branch `dev`**. Worktrees são sempre criados a partir de `dev`. A branch `dev` é usada para fazer o deploy de preview na Vercel, e `main` é para produção.

1. Run `npm run validate`.
2. Read the terminal and autonomously resolve any error (TypeScript, Lint, etc) until it is Green.
3. If the validation passes without errors, execute Git versioning and close the worktree.

> `npm run validate` runs sequentially: `typecheck && lint && test && build`. The `build` step is what Vercel executes — if it fails here it will fail in production.

- 🟢 **All pass** → Commit, then remove the worktree. Task is done.
- 🔴 **Any step fails** → Do NOT report completion. Read the error, fix autonomously, re-run both commands. Repeat until green.

When the validation is successful, you MUST execute the versioning commands in the worktree terminal:
1. `git add .`
2. `git commit -m '<type>(<scope>): <description of task and changes>'`
3. `cd /Users/filipemagalhaes/Workspace/personal/nutri-proud && git worktree remove ../nutri-proud-<slug>`

**Valid commit types:**
- **feat:** New feature or page.
- **fix:** Bug fix.
- **refactor:** Refactoring or logic/UI improvement without changing behavior.
- **chore:** Package updates or workflow configuration changes.

**Specific error guidance:**

- `no-unused-vars` → remove or use the variable.
- Implicit `any` → add explicit types (breaks the production Next.js build).
- Prisma `"has no exported member"` → check the real model name in `schema.prisma`, fix the import, re-run `npx prisma generate`.
- All imports must resolve; all dependencies must be in `package.json`.

---

## 📏 Code Style

| Context                  | Convention                                              |
| ------------------------ | ------------------------------------------------------- |
| JSON / DB keys           | `snake_case`                                            |
| TS variables & functions | `camelCase`                                             |
| React components         | `PascalCase`                                            |
| Components               | Keep small and focused — componentize Stories and Cards |

---

## ⚠️ Critical Reminders

1. **Read `node_modules/next/dist/docs/`** before using any Next.js API — this version may differ from training data. Heed deprecation notices.
2. **Zod 4+ schemas are the single source of truth** for all data shapes.
3. **Service layer is non-negotiable** — routes are controllers, services hold logic.
4. **Design tokens are non-negotiable** — no raw Tailwind sizes or opacities in new components.
5. **Tailwind v4 uses CSS-first config** — tokens live in `globals.css`, not a JS config file.
6. **DailyLog uses `primaryValue` (not `score`)** and lowercase category strings (not uppercase enums).
