# Implementation Plan: Professional Frontend Task UI

**Branch**: `001-frontend-task-ui` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-task-ui/spec.md`

## Summary

Build a professional, visually stunning frontend for the hackathon todo app using Next.js 16+ (App Router), TypeScript, Tailwind CSS, and shadcn/ui. The frontend integrates with Better Auth for JWT-based authentication and communicates with the FastAPI backend at `http://localhost:8000/api/`. Key deliverables: premium auth pages, responsive task dashboard with CRUD, dark mode, loading skeletons, optimistic updates, toast notifications, and full accessibility.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+
**Primary Dependencies**: Next.js 16+, Tailwind CSS 4, shadcn/ui, better-auth, lucide-react, sonner, next-themes, react-hook-form, zod
**Storage**: N/A (frontend-only; backend provides API)
**Testing**: Visual testing via browser, Lighthouse accessibility audits
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge) — responsive 320px to 1440px+
**Project Type**: Web application (frontend portion of monorepo)
**Performance Goals**: <2s dashboard render, <200ms theme switch, <100ms optimistic UI
**Constraints**: Must use constitution-approved stack only; no CSS-in-JS; no inline styles
**Scale/Scope**: ~10 pages/layouts, ~15 components, single-user frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Rule | Status |
|------|------|--------|
| I. Spec-First | Plan references spec.md; all code via Claude Code | PASS |
| II. User Isolation | Frontend sends JWT; backend filters by user_id | PASS |
| III. Stateless JWT | Better Auth issues HS256 JWT; API client attaches Bearer token | PASS |
| IV. Immutable Stack | Next.js 16+, TypeScript, Tailwind CSS, Better Auth — all approved | PASS |
| V. API-First | Centralized API client at `/lib/api.ts` calls `/api/{user_id}/tasks` | PASS |
| VI. Quality | Responsive Tailwind, error toasts, loading skeletons, accessibility | PASS |

**Result: ALL GATES PASS — proceed to Phase 0.**

## Design System

### Color Palette

```yaml
light:
  background: slate-50            # bg-slate-50
  surface: white                  # bg-white
  surface-hover: slate-50         # hover:bg-slate-50
  border: slate-200               # border-slate-200
  text-primary: slate-900         # text-slate-900
  text-secondary: slate-500       # text-slate-500
  text-muted: slate-400           # text-slate-400

dark:
  background: slate-950           # dark:bg-slate-950
  surface: slate-900              # dark:bg-slate-900
  surface-hover: slate-800        # dark:hover:bg-slate-800
  border: slate-700               # dark:border-slate-700
  text-primary: slate-50          # dark:text-slate-50
  text-secondary: slate-400       # dark:text-slate-400
  text-muted: slate-600           # dark:text-slate-600

accent:
  primary: indigo-600             # bg-indigo-600, hover:bg-indigo-700
  primary-light: indigo-50        # bg-indigo-50 (badges, highlights)
  success: green-500              # completed badge
  success-light: green-50         # completed badge bg
  warning: yellow-500             # pending badge
  warning-light: yellow-50        # pending badge bg
  danger: red-500                 # delete actions
  danger-light: red-50            # error backgrounds
```

### Typography Scale

```yaml
heading-1: text-2xl font-bold     # Page titles
heading-2: text-xl font-semibold  # Section headers
heading-3: text-lg font-semibold  # Card titles
body: text-sm font-normal         # Default text
caption: text-xs font-medium      # Badges, timestamps
font-family: font-sans            # System font stack (Inter if available)
```

### Spacing & Layout

```yaml
page-padding: px-4 sm:px-6 lg:px-8
card-padding: p-4 sm:p-5
gap-grid: gap-4 sm:gap-6
border-radius: rounded-xl         # Cards, modals
border-radius-sm: rounded-lg      # Buttons, inputs
border-radius-badge: rounded-full # Status badges
max-width: max-w-6xl mx-auto      # Content container
```

### Visual Effects

```yaml
card-shadow: shadow-sm hover:shadow-md transition-shadow duration-200
card-hover: hover:scale-[1.02] transition-transform duration-200
button-transition: transition-all duration-200 ease-in-out
focus-ring: focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
gradient-bg-light: bg-gradient-to-br from-slate-50 to-white
gradient-bg-dark: dark:bg-gradient-to-br dark:from-slate-950 dark:to-slate-900
gradient-auth: bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500
glassmorphism: bg-white/80 backdrop-blur-xl border border-white/20
```

### Component Variants

```yaml
button:
  primary: bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm
  secondary: border border-slate-300 text-slate-700 hover:bg-slate-50
  ghost: text-slate-500 hover:text-slate-700 hover:bg-slate-100
  danger: bg-red-600 text-white hover:bg-red-700

badge:
  pending: bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20
  completed: bg-green-50 text-green-700 ring-1 ring-green-600/20
  in_progress: bg-blue-50 text-blue-700 ring-1 ring-blue-600/20

input:
  default: border-slate-300 focus:border-indigo-500 focus:ring-indigo-500
  error: border-red-300 focus:border-red-500 focus:ring-red-500
```

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-task-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-client.md    # Frontend API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── layout.tsx                    # Root layout: fonts, ThemeProvider, Toaster
│   ├── globals.css                   # Tailwind directives + CSS variables
│   ├── (auth)/
│   │   ├── layout.tsx                # Auth layout: centered card on gradient bg
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   └── signup/
│   │       └── page.tsx              # Signup page
│   └── (protected)/
│       ├── layout.tsx                # Protected layout: header + auth guard
│       └── tasks/
│           ├── page.tsx              # Task dashboard page
│           └── loading.tsx           # Skeleton loading state
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── badge.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   └── textarea.tsx
│   └── features/
│       ├── auth/
│       │   ├── login-form.tsx        # "use client" — login with RHF + Zod
│       │   └── signup-form.tsx       # "use client" — signup with RHF + Zod
│       ├── tasks/
│       │   ├── task-list.tsx          # "use client" — grid + state management
│       │   ├── task-card.tsx          # "use client" — card with actions
│       │   ├── task-create-dialog.tsx # "use client" — create modal
│       │   ├── task-edit-dialog.tsx   # "use client" — edit modal
│       │   ├── task-delete-dialog.tsx # "use client" — delete confirmation
│       │   ├── task-status-badge.tsx  # Status badge component
│       │   ├── task-filters.tsx       # "use client" — filter/sort controls
│       │   ├── task-empty-state.tsx   # Empty state illustration
│       │   └── task-skeleton.tsx      # Skeleton loading cards
│       └── layout/
│           ├── header.tsx             # "use client" — nav, user menu, theme toggle
│           ├── mobile-nav.tsx         # "use client" — hamburger menu
│           ├── theme-toggle.tsx       # "use client" — sun/moon toggle
│           └── user-menu.tsx          # "use client" — avatar + dropdown
├── lib/
│   ├── api.ts                        # Centralized API client with JWT
│   ├── auth.ts                       # Better Auth server config
│   ├── auth-client.ts                # Better Auth client config
│   └── validations.ts                # Zod schemas for forms
├── types/
│   └── index.ts                      # Shared TypeScript interfaces
├── public/
│   └── (static assets)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local                        # Local env vars (gitignored)
└── .env.example                      # Template for env vars
```

**Structure Decision**: Web application (Option 2) — frontend-only scope within monorepo. The `frontend/` directory contains the complete Next.js application.

## Data Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  Browser  │───▶│  Next.js App │───▶│  Better Auth     │   │
│  │  (React)  │    │  (App Router)│    │  /api/auth/*     │   │
│  └─────┬─────┘    └──────┬───────┘    └────────┬─────────┘   │
│        │                 │                      │             │
│        │    ┌────────────▼──────────────┐       │             │
│        │    │    lib/api.ts             │       │             │
│        │    │    ──────────────         │       │             │
│        │    │  1. Get JWT from session  │◀──────┘             │
│        │    │  2. Attach Bearer token   │                     │
│        │    │  3. Handle 401 → logout   │                     │
│        │    │  4. Parse JSON response   │                     │
│        │    └────────────┬──────────────┘                     │
│        │                 │                                    │
└────────┼─────────────────┼────────────────────────────────────┘
         │                 │
         │                 │ HTTP + Authorization: Bearer <jwt>
         │                 ▼
┌────────┼─────────────────────────────────────────────────────┐
│        │            BACKEND (assumed running)                 │
│        │    ┌──────────────────────────────┐                 │
│        │    │  FastAPI                      │                 │
│        │    │  ── Verify JWT (PyJWT)        │                 │
│        │    │  ── Extract user_id from sub  │                 │
│        │    │  ── Filter queries by user_id │                 │
│        │    │  ── Return JSON               │                 │
│        │    └──────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

## Auth & Routing Plan

```text
app/layout.tsx
  └── ThemeProvider (next-themes, class strategy)
       └── Toaster (sonner)
            ├── (auth)/layout.tsx
            │     └── Centered card on gradient background
            │           ├── /login/page.tsx   → LoginForm
            │           └── /signup/page.tsx  → SignupForm
            │
            └── (protected)/layout.tsx
                  └── AuthGuard (check session, redirect if none)
                       └── Header (logo, nav, user-menu, theme-toggle)
                            └── /tasks/page.tsx → TaskList + filters
```

**Auth Guard Strategy**: The `(protected)/layout.tsx` checks the Better Auth session server-side. If no session exists, it calls `redirect("/login")`. The API client additionally catches 401 responses and triggers client-side sign-out + redirect.

## Installation & Dependencies

```bash
# Core framework (from project root)
npx create-next-app@latest frontend --typescript --app --tailwind --src-dir=false --import-alias="@/*"

# UI component library
cd frontend
npx shadcn@latest init    # Select: New York style, Slate base, CSS variables

# shadcn components (install individually)
npx shadcn@latest add button card dialog input label badge select skeleton textarea dropdown-menu

# Auth
npm install better-auth

# Icons
npm install lucide-react

# Dark mode
npm install next-themes

# Toast notifications
npm install sonner

# Form validation
npm install react-hook-form zod @hookform/resolvers
```

**Total new dependencies**: 8 packages + shadcn components (copy-pasted, not runtime deps)

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT expires mid-session | User sees 401 errors | API client catches 401, calls `signOut()`, redirects to `/login` with toast |
| Network failure during mutation | Optimistic update shows stale data | Rollback optimistic state on error, show error toast with retry suggestion |
| Better Auth session/token mismatch | User cannot call API | Ensure JWT plugin is correctly configured; test token flow end-to-end |
| Flash of unstyled content on theme switch | Visual flicker | Use `next-themes` with `attribute="class"` and `suppressHydrationWarning` on `<html>` |
| Double-click on submit buttons | Duplicate API calls | Disable button during submission via `isSubmitting` from react-hook-form |
| Form validation bypass | Invalid data sent to API | Zod schemas validate client-side; backend validates independently |
| Empty state not shown | Blank screen confuses user | Explicit check for `tasks.length === 0` with dedicated EmptyState component |
| Slow API response | User thinks app is frozen | Skeleton loaders appear instantly; optimistic updates for mutations |

## Implementation Phases (High-Level)

### Phase 1: Project Setup & Foundation
1. Create Next.js project with TypeScript + Tailwind
2. Initialize shadcn/ui and install all components
3. Install dependencies (lucide-react, next-themes, sonner, react-hook-form, zod, better-auth)
4. Configure environment variables and `.env.example`
5. Set up root layout with ThemeProvider + Toaster

### Phase 2: Authentication
6. Configure Better Auth (server + client)
7. Create centralized API client (`lib/api.ts`)
8. Build login page with form validation
9. Build signup page with form validation
10. Create protected layout with auth guard

### Phase 3: Task Dashboard (P1 Story)
11. Build task list with responsive grid
12. Build task card component with status badges and actions
13. Build create task dialog with form validation
14. Build edit task dialog
15. Build delete confirmation dialog
16. Add filter and sort controls
17. Add empty state component

### Phase 4: Polish (P2/P3 Stories)
18. Add dark mode toggle and theme persistence
19. Add loading skeletons
20. Add toast notifications for all mutations
21. Implement optimistic updates with rollback
22. Build responsive header with mobile nav
23. Accessibility audit and fixes
24. Final visual polish (transitions, hover effects, gradients)

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.

## Next Steps

1. Run `/sp.tasks` to break this plan into granular, dependency-ordered implementation tasks
2. Begin implementation with Phase 1 (project setup)
3. After each phase, validate against spec acceptance scenarios
