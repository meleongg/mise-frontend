# Mise frontend

Next.js client for [Mise](https://cookwithmise.vercel.app) — adaptive weekly
meal planning, shopping, Kitchen Mode, and Sodie (AI coaching and proposals)
backed by the FastAPI service.

## Product surfaces

| Area | Routes / entry | Notes |
| --- | --- | --- |
| Weekly plan | `/weekly-plan` | Generate, swap, servings scale, prep timeline, plan tips |
| Recipes | `/recipe/[id]`, cook flow | Feedback, personal overlays from plan entries |
| Shopping | `/shopping` | From plan entries; offline check queue + sync |
| Kitchen Mode | `/recipe/[id]/cook` | Coach-only Sodie, timers, read-aloud (browser TTS) |
| My Recipes | `/my-recipes` | Personal recipes and Sodie-approved edits |
| Analytics | `/analytics` | Opt-in Tips; Sodie scope for insights |
| Settings | `/settings/*` | Preferences, pantry, account (incl. delete account) |
| Legal | `/privacy`, `/terms` | Public policies linked from landing and auth |

Sodie uses page-aware scopes (plan, recipe, kitchen, settings, personal recipe,
analytics). The global launcher and recipe FAB share the same thread model with
history and private/temporary sessions where applicable.

## Architecture

- **Application:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Server state:** TanStack Query for cache keys, deduplication, and mutation
  invalidation (especially week-level progress and shopping)
- **Session handling:** JWT access/refresh with single-flight refresh and retry
  on interrupted API calls
- **API boundary:** `src/lib/api.ts` typed client for auth, recipes, plans,
  shopping, Sodie, and account APIs

## Run locally

```bash
cd mise-frontend
npm install
npm run dev
```

Create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:8000/auth
NEXT_PUBLIC_PLAN_BASE_URL=http://localhost:8000/plan
```

The backend must allow the frontend origin in `CORS_ORIGINS`.

## Validation before PR

```bash
npm run lint
npm run build
```

Production deploys typically target Vercel; ensure env vars match the hosted
backend URLs.

## Related repo

Backend API, migrations, and operator scripts live in `mise-backend` (separate
repository). Catalog reseed and image backfill are documented in
`mise-backend/scripts/README.md`.
