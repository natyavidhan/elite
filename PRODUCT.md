# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript. Tailwind CSS. React Router (client-side only, no SSR — no backend to load data from). Dexie.js over IndexedDB for local storage. Recharts for trend charts. `@zxing/browser` for barcode decoding via `getUserMedia`. `canvas-confetti` for PR celebrations. `vite-plugin-pwa` for the service worker and manifest.

This is a pivot from an earlier Expo/React Native build to a PWA, decided collaboratively with the user and recorded in `PLAN.md` and `phases.md` at the project root — those two files are the authoritative technical spec this product record summarizes.

## Users

Primary user is the builder, tracking their own strength training, food/macros, cardio, and body weight day to day. Secondary: friends who install their own local instance from a shared link — each gets an independent, empty local database (no accounts, nothing shared between instances). The product should read cleanly on first open for that second case (clear empty states) without needing dedicated onboarding hand-holding, since there's no data to lose and nothing to configure before first use.

## Product Purpose

A local-first, installable fitness tracker unifying four modules that are normally four separate apps: strength workout logging (with a live SVG muscle-volume heatmap), food/calorie logging, cardio session logging, and body weight tracking with trends. It exists because the primary user wanted one tool for all of it, with no account creation, no server, and no native-app-store hassle — installable as a PWA on desktop, Android, and iOS from the same codebase. Success is daily use that stays fast enough not to interrupt a workout or a meal.

## Positioning

The interactive muscle heatmap is the mechanism a plain workout-log app doesn't have: today's per-muscle training volume (weight × reps, summed across sets) is computed live and rendered as color intensity directly on an anatomical SVG, front and back. Combined with zero-setup installability (no account, no app store, one link) across every device class, this is meaningfully different from both spreadsheet-style logging apps and heavyweight native fitness platforms that require sign-up.

## Operating Context

Two very different moments of use: mid-workout on a phone, one-handed, between sets — logging needs to be fast, thumb-reachable, and forgiving of a sweaty/distracted user; and at a desk on a wider screen, reviewing trends or logging a meal at leisure, where more information can be shown at once. Barcode scanning happens via the phone's camera mid-grocery-trip or mid-meal-prep. All entry is manual, quick-log style — there is no wearable/device integration.

## Capabilities and Constraints

- No backend, no auth, no sync. All data lives in the browser's IndexedDB, scoped to that browser/device/origin.
- Cross-device use is manual: JSON export from one instance, import into another (see `PLAN.md`'s Backup & Restore section). This is a deliberate trade for "no server," not an oversight.
- Food lookup is three-tier: local IndexedDB cache first, then Open Food Facts (barcode) or USDA FoodData Central (text search) over the network. The app should degrade gracefully offline except for genuinely new food lookups.
- Two source SVG assets exist at the repo root (`Muscular System.svg`, `Muscular System backside.svg`) with muscle groups already identified and unified (no left/right split — a muscle is trained as a whole) per `PLAN.md`.
- Service worker + manifest make the app installable and offline-capable once loaded; HTTPS (or localhost) is required for both the service worker and camera access.
- iOS Safari has no install-prompt event — installation there is manual via the Share sheet, which the UI needs to surface rather than assume.

## Brand Commitments

Name: **Elite**. No existing logo/mark — an app icon and PWA identity need to be designed as part of this build.

## Evidence on Hand

`PLAN.md` and `phases.md` at the project root are the confirmed technical and product spec (architecture, schema, per-module screen behavior, build phases). The two source anatomical SVGs are real assets, not placeholders. No user testimonials, screenshots, or existing brand assets exist yet — this is a from-scratch build.

## Product Principles

1. **Local-first, zero-friction** — no login, no setup wizard; the app is fully usable the moment it's opened.
2. **Fast logging beats comprehensive logging** — a quick gym-floor entry should never take more than a few taps; depth (RPE, notes, custom exercises) stays available but never blocks the fast path.
3. **The muscle heatmap is the emotional core of the workout module** — it must feel alive and immediately responsive to what was just logged, not a static diagram with a color filter.
4. **Cross-device by intent, not by magic** — since there's no sync, backup/restore has to be easy to find and trustworthy, not a buried settings checkbox.
5. **One codebase, every surface, same quality bar** — phone-in-gym and desktop-at-a-desk both get a layout considered on its own terms, not a phone UI stretched wide or a desktop UI shrunk down.

## Accessibility & Inclusion

Baseline: solid color contrast, visible keyboard focus states, semantic markup. The muscle heatmap communicates volume by color intensity — tappable muscle groups need accessible names/labels so the information isn't color-only, and interactive controls need proper ARIA roles since the heatmap is a custom SVG interaction, not native form controls.
