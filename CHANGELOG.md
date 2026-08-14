# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2.6.0] — 2026-08-14

### Added
- Perfil público de nutricionista com layout estilo X/Instagram — banner de onboarding e modo preview/edição
- Diretório público de nutricionistas em `/nutricionistas`
- Painel de saúde de negócio por nutricionista no admin — métricas agregadas via banco + PostHog
- Insights de pacientes para o nutricionista no dashboard — visão consolidada por banco e analytics
- Card de nutricionista exibido para usuários anônimos na home
- Navegação de Evolução e Times bloqueada para usuários anônimos com CTA de login

### Changed
- 5 refinamentos de UX: fluxo de compartilhamento, navegação de times e PostCard

### Fixed
- Sincronização do perfil do servidor após onboarding — guard de cookie httpOnly removido
- SessionProvider adicionado ao layout da área nutri e ao RootProvider para corrigir `useSession` em client components
- Overlay de blur no sticker de compartilhamento reduzido para cobrir apenas a área do card

## [2.5.1] — 2026-08-11

### Fixed
- Reduced excessive blur overlay height on share sticker — blur now covers only the card area instead of ~45% of the background image

## [2.5.0] — 2026-08-11

### Added
- Challenge system: model, services, API routes, daily summary, and cron integration
- Challenge UI: creation flow, join block, weekly evolution reminder, and feed rendering
- Pillar score circles in Score do Dia team posts — rings now show real per-pillar progress (water, food, workout, sleep, gut)
- Customizable invite code for teams and challenges
- 'Usar Fundo' option in PhotoStickerShareDrawer

## [2.4.0] — 2026-08-10

### Added
- Dedicated post page at `/teams/[id]/posts/[postId]` for viewing individual team posts
- LogDetailsDrawer for read-only log details with edit flow in History
- CommentsDrawer wired to post comment buttons in team feed and profile pages
- Push notification toggle with 7-day localStorage dismiss in Settings
- Optimistic comment count update when a comment is added
- `postHref` prop on PostCard for direct post navigation

### Changed
- Comments refresh from server after submit for consistency (teams)
- Removed deprecated EvolutionDrawer and unused props from ShareReportDrawer

## [2.3.1] — 2026-08-10

### Fixed
- Cloudinary signed upload: removed `signature_algorithm` from params-to-sign string to fix signature mismatch errors

## [2.3.0] — 2026-08-10

### Added
- Nutri team management page with already-a-member join guard
- SEO metadata: metadataBase, OG image, Twitter card, sitemap expansion
- Push/in-app notifications for nutritionists
- Teams options drawer on "+" button with create and join choices
- Redirect stub for legacy `/dashboard/feed` route

### Changed
- Removed tab switcher and infographic flow from ShareReportDrawer (simplified to single compose mode)

### Fixed
- Disabled Gemini thinking phase on jacada and poop AI routes
- Share drawer clipping (`-mt-2`) on overflow container and Vaul height inheritance between stacked drawers
- Evolution logs excluded from patient history feed

## [0.9.0] — 2026-08-09

### Added
- Share report drawer: compose mode with team checkbox and infographic generation
- Patient history feed with evolution logs excluded
- Redirect stub for legacy `/dashboard/feed` route
- Delay between drawers in ShareReportDrawer to prevent Vaul height inheritance

### Changed
- Removed tab switcher and infographic flow from ShareReportDrawer (simplified to single compose mode)

### Fixed
- Scroll in compose drawer
- "Gerar Infografico" button now visible in source step
- Story circle height inheritance issue when opening stacked Vaul drawers

## [0.8.0] — 2026-07-16

### Added
- Teams social feed: posts, reactions, and comments
- AI-generated health insights (`/insights`)
- Evolution view (`/evolution`)
- Weekly history view (`/history/weeks`)
- OneSignal push notifications
- Cloudinary media uploads
- Sentry + PostHog monitoring

### Fixed
- RLS missing on `Notification`, `AiInsight`, and `SystemEvent` tables (critical security fix)
- Timezone normalization for log history

## [0.7.0] — 2026-05-01

### Added
- Nutritionist dashboard (`/dashboard`) with B2B2C model
- Teams creation and invite-code flow
- Anonymous user limits: 7-day window and 11-log cap
- Anonymous-to-real account merge (Google / Magic Link)

### Changed
- Migrated from localStorage to PostgreSQL via Prisma
- Zustand scoped to UI cache and session only (no persist for DB data)

## [0.1.0] — 2025-01-01

### Added
- Initial PWA scaffold: Next.js App Router, Auth.js, Prisma, Tailwind v4
- Five health pillars: Water, Food, Sleep, Workout, Bowel
- Gamified Stories with score rings
- One-click action cards on home dashboard
