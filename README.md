# Mise frontend

Next.js client for Mise, an AI-assisted meal planner. It provides onboarding,
weekly plans, cooking progress, recipe swaps, analytics, and the Sodie coaching
experience backed by the FastAPI service.

## Architecture

- **Application:** Next.js 15, React 19, TypeScript, and Tailwind CSS
- **Server state:** TanStack Query centralizes cache keys, request deduplication,
  targeted mutation invalidation, and prefetching for week-level progress
- **Session handling:** JWT access/refresh tokens with a single-flight refresh
  flow prevent duplicate renewal requests and retry interrupted API calls
- **API boundary:** `src/lib/api.ts` is the typed client boundary for backend,
  authentication, and AI-planning endpoints

## Run locally

```bash
cd mise-frontend
npm install
npm run dev
```

Create `.env.local` with the backend endpoints:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_AUTH_BASE_URL=http://localhost:8000/auth
NEXT_PUBLIC_PLAN_BASE_URL=http://localhost:8000/plan
```

The backend must allow the frontend origin through `CORS_ORIGINS`. Run `npm run
lint` before submitting changes and `npm run build` to validate a production build.
