# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
