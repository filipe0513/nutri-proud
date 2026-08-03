# 📱 Orgulho da Nutri — Agent Instructions (CLAUDE.md)

> Read `AGENTS.md` first, then this file. Rules here complement and extend it.

@AGENTS.md

---

## 🎯 Product Overview

A gamified daily health diary PWA tracking **5 pillars**: Water, Food, Sleep, Workout, Bowel. Built for a B2B2C model where Nutritionists can monitor their patients via Teams and a dedicated Dashboard.
**UX Differentiator:** Zero-friction One-Click Actions. Nubank-inspired minimal UI with Cards, Bottom Sheets, and modals — the user never leaves the current page.

---

## 🛠️ Tech Stack

| Layer        | Tool                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| Core         | React 18+ · Next.js 14+ (App Router, Full-Stack)                               |
| Language     | TypeScript                                                                     |
| Styling      | Tailwind CSS (custom tokens only — see Design System)                          |
| Components   | Shadcn UI + Radix UI                                                           |
| Icons        | Lucide React                                                                   |
| Auth         | NextAuth / Auth.js (Magic Link via Resend + OAuth Google)                      |
| Client State | Zustand (UI cache & optimistic updates only — no `persist` for sensitive data) |
| Database     | PostgreSQL on Neon/Supabase via **Prisma ORM**                                 |
| Validation   | Zod — isomorphic schemas in `src/schemas/`                                     |
| Testing      | Vitest + vitest-mock-extended                                                  |

---

## 📂 Folder Structure

```text
src/
├── app/
│   ├── (setup)/
│   │   ├── welcome/page.tsx      # Entry screen
│   │   └── onboarding/page.tsx   # Goals & profile flow
│   ├── (main)/
│   │   ├── history/page.tsx      # Diary / past records
│   │   ├── settings/page.tsx     # Profile & target adjustments
│   │   ├── pillar/[category]/    # Pillar insight pages (water|food|sleep|workout|poop)
│   │   └── page.tsx              # Home dashboard (Stories + quick actions)
│   ├── dashboard/                # B2B Nutritionist Dashboard (Teams & Patients)
│   ├── admin/                    # ADMIN role only
│   ├── api/                      # RESTful API routes (thin controllers only)
│   └── layout.tsx / globals.css
├── components/
│   ├── ui/                       # Shadcn-generated primitives (Button, Card, Drawer…)
│   └── shared/                   # Our components (StoryCircle, BottomNav…)
├── schemas/                      # Zod schemas (shared front ↔ back)
├── services/                     # Business logic layer (logService, userService…)
├── store/
│   └── useAppStore.ts            # Zustand store (session + UI cache, NO persist for DB data)
├── lib/
│   └── utils.ts                  # Helpers (cn, date utils)
└── types/
    └── index.ts                  # Shared TypeScript interfaces
```

---

## 🗺️ Route Map

### Public (no auth)

- `/welcome` — Entry screen. Login via Google, Magic Link, or anonymous.

### Private (requires NextAuth session)

- `/onboarding` — Step-by-step goals, weight, height setup.
- `/` — Home dashboard: Stories carousel + quick-action cards.
- `/history` — Log feed with infinite scroll (filter via `?categories=`).
- `/settings` — Single-page profile and target fine-tuning.
- `/pillar/[category]` — Educational insights. Valid categories: `water`, `food`, `sleep`, `workout`, `poop`.
- `/dashboard` — B2B Nutritionist Dashboard for managing teams and patients.

### Admin (`role: 'ADMIN'` required)

- `/admin` — Management dashboard (Recharts, conversion metrics).

### Main API Routes

- `POST /api/logs` — Save a new DailyLog (Zod-validated).
- `GET /api/logs` — Paginated history (`page`, `limit`, `categories`).
- `POST /api/auth/anonymous` — Create anonymous session; merge logs on upgrade.

---

## 🗄️ Data Model

### UserSession (Zustand + Backend)

```typescript
interface UserSession {
  id: string; // UUID
  email: string | null;
  is_anonymous: boolean;
  profile: {
    weight_kg: number;
    height_cm: number;
    gender: "male" | "female" | "other";
    main_goal: "fat_loss" | "muscle_gain" | "health";
  };
  targets: {
    water_ml_per_day: number;
    sleep_hours_per_night: number;
  };
}
```

### DailyLog (Prisma / PostgreSQL)

```typescript
interface DailyLog {
  id: string; // UUID
  user_id: string;
  category: "WATER" | "FOOD" | "SLEEP" | "WORKOUT" | "POOP";
  score: number; // 0–100, drives Story gamification
  details: any; // JSONB — validated by Zod schema in src/schemas/
  created_at: string; // ISO string
}
```

### Team / Social (Prisma)

- `Team`: Groups of patients created by Nutritionists (B2B2C).
- `TeamMember`: Junction with roles `ADMIN` (Nutritionist) or `MEMBER` (Patient).

---

## 🏗️ Architecture Rules

### Service Layer (MANDATORY)

- **No business logic in `route.ts` files.** Routes are thin controllers: parse → call service → return HTTP.
- All logic lives in `src/services/` (e.g., `logService.ts`, `userService.ts`).

### Validation (MANDATORY)

- Every data shape validated with **Zod**.
- Schemas saved in `src/schemas/`. Import the same schema in both the API route and the frontend form.

### Zustand Store

- Used **only** for: current session, optimistic UI updates, temporary in-memory cache.
- Do **not** use `persist` middleware for data that lives in the database.

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

---

## 🎨 Design System (STRICT — No Exceptions)

Using arbitrary Tailwind font sizes or opacities in new components is **FORBIDDEN**. Use only tokens from `tailwind.config.ts`.

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
| Page background           | `bg-neutral-100` / `bg-bg-light`                                  |
| Primary text              | `text-neutral-500`                                                |
| Secondary text            | `text-neutral-400`                                                |
| Success / Warning / Error | `text-notify-success`, `text-notify-warning`, `text-notify-error` |

### Glassmorphism Rules

All overlaid components **must** use translucent backgrounds + blur:

| Component         | Classes                                                     |
| ----------------- | ----------------------------------------------------------- |
| Normal Cards      | `bg-glass-light-1 backdrop-blur-sm border border-white/40`  |
| Bottom Navigation | `bg-glass-light-2 backdrop-blur-md`                         |
| Drawers / Modals  | `bg-glass-light-3 backdrop-blur-lg`                         |
| Toasts            | `bg-notify-*-glass backdrop-blur-md border border-notify-*` |

### Story Circle Color Rules

Border color is based on the sum of `score` values for the day:

- `< 50` → `text-notify-error` (red)
- `< 75` → `text-notify-warning` (yellow)
- `>= 75` → `text-notify-success` (green)

---

## 📐 UI Interaction Rules

- **Never redirect** to fill a simple form. Always use `<Drawer>` (Bottom Sheet).
- **Immediate feedback:** close Drawer → fire `<Toast>` with the correct notification color.
- **Contextual buttons:** Inside a Bottom Sheet, the save button color matches the category (e.g., `bg-blue-500` for water).

---

## 🔐 Business Rules

### Anonymous Users

- **Time limit:** Access blocked after **7 days** from first log.
- **Usage limit:** Access blocked after **11 logs** registered.
- **Upgrade (merge):** On real login (Google / Magic Link), transfer all anonymous logs to the new user ID.

### RBAC

- Default role: `'USER'`.
- `'ADMIN'` role required for `/admin` routes and admin API endpoints.

---

## 🧪 Testing Protocol

- **Framework:** Vitest + `vitest-mock-extended`.
- **Scope:** Unit-test the **service layer** (`src/services/`). Don't test routes directly unless strictly necessary.
- **Never** run tests against the real database. Mock Prisma Client.
- **Pattern (AAA):**
  1. **Arrange** — set up fake data and Prisma mocks.
  2. **Act** — call the service function.
  3. **Assert** — verify result and Prisma call arguments.
- **Bug fix rule:** If a production bug is reported, write a failing test first, then fix the service to make it pass.

---

## ✅ Definition of Done (MANDATORY before reporting task complete)

> **Goal:** Simulate the Vercel build environment locally so deploys never break.

After **every** file change, run the following two commands **in order**:

```bash
# 1. Always regenerate Prisma typings first
npx prisma generate

# 2. Full pipeline: typecheck → lint → vitest → next build (Vercel simulation)
npm run validate
```

> **Restrição de Branch (Git Flow):**
> O agente está terminantemente proibido de realizar commits ou fazer push na branch `main`. Todo o desenvolvimento de novas features, correções de bugs e automações feitas pelo agente devem ocorrer **exclusivamente na branch `dev`**. O comando padrão de versionamento automático deve garantir isso (ex: `git checkout dev` antes de realizar add e commit). A branch `dev` é usada para fazer o deploy de preview na Vercel, e `main` é para produção.

1. Run `npm run validate`.
2. Read the terminal and autonomously resolve any error (TypeScript, Lint, etc) until it is Green.
3. If the validation passes without errors, execute Git versioning before marking the task as completed.

> `npm run validate` runs sequentially: `typecheck && lint && test && build`. The `build` step is what Vercel executes — if it fails here it will fail in production.

- 🟢 **All pass** → Task is done. Code is tested, compiled, and deploy-ready.
- 🔴 **Any step fails** → Do NOT report completion. Read the error, fix autonomously, re-run both commands. Repeat until green.

When the validation is successful, you MUST execute the versioning commands in the project terminal:
1. `git add .`
2. `git commit -m '<type>(<scope>): <description of task and changes>'`

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
2. **Zod schemas are the single source of truth** for all data shapes.
3. **Service layer is non-negotiable** — routes are controllers, services hold logic.
4. **Design tokens are non-negotiable** — no raw Tailwind sizes or opacities in new components.
