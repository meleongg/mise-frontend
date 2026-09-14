# Frontend contribution guide

## System architecture and constraints

- **Primary language/framework:** strict TypeScript, Next.js 15 App Router,
  React 19, Tailwind CSS, and existing Radix-based UI primitives.
- **Data/state:** TanStack Query v5 owns server cache; transient client state
  belongs in component state or the existing contexts.
- **Architecture:** Keep pages in `src/app/`, reusable UI in `src/components/`,
  page-independent behavior in `src/hooks/`, and all backend requests in
  `src/lib/api.ts`. Do not issue ad-hoc component `fetch` calls.
- **Secrets boundary:** Never read, print, source, copy, modify, or otherwise
  expose `.env` or `.env.*` files, credentials, tokens, or keychain material.
  Never run commands that dump environment variables. Ask the user to run any
  secret-dependent command or to confirm non-sensitive configuration status.
  This is behavioral guidance; filesystem sandbox permissions remain the actual
  security boundary.

## Execution and verification

```bash
npm run lint
npm run build
```

- Run lint for every frontend behavior change.
- Run the production build when changing routes, types, or app-wide layout.
- Run `git diff --check` before handoff.
- Do not commit `.env.local`, access tokens, or generated `.next` artifacts.

## Core agent boundaries

- **Dependency guard:** Do not add packages for trivial tasks. Prefer native
  helpers and existing dependencies; request approval before adding a package.
- **Architectural isolation:** Do not mix API/business logic into rendering
  components or duplicate server cache in `AppContext`.
- **Accessibility:** Preserve keyboard interaction and focus behavior; label
  icon-only controls; maintain responsive, touch-friendly UI.
- **AI trust:** Do not present an AI suggestion as a completed mutation until
  the backend confirms it. Keep Sodie limitations clear in user-facing copy.
- **Git hygiene:** Never commit directly to the default branch. Use a clean,
  short-lived `feat/<description>` or `fix/<description>` branch.

## Pull-request workflow

- Use [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
- Recommend exactly one review tier based on the highest-risk change:
  **Auto-approve** (formatting or standard documentation), **Spot-check**
  (isolated low-risk UI or mechanical work), or **Full review** (architecture,
  business logic, auth, data, APIs, AI, dependencies, or migrations).
- A review-tier recommendation never authorizes merging. Only the user may
  approve, mark ready, or merge a pull request.
- For substantial feature work, commit validated changes, push the branch, and
  open a draft PR. Small changes and experiments do not require a new draft.
- Provide clickable links to available deliverables in handoffs. Include visual
  evidence for user-visible work when reliable capture is available; otherwise
  state why it is unavailable.

## Definition of done

Before presenting substantial work as complete or opening a draft PR:

1. Run lint, and run the production build when the change affects routes,
   types, or app-wide layout.
2. Run `git diff --check` and explain changed files and risks.
3. Use the `explain-diff-html` skill for substantial or high-risk changes;
   provide a clean terminal diff explanation for small follow-ups.
4. Commit, push, and open the required draft PR; do not mark it ready, approve,
   or merge it.
