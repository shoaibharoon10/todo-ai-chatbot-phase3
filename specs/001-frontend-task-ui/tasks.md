# Tasks: Professional Frontend Task UI

**Input**: Design documents from `/specs/001-frontend-task-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec. Tests are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` at repository root (Next.js App Router)
- All paths are relative to `frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create Next.js project, install all dependencies, configure Tailwind and shadcn/ui

- [ ] T001 Create Next.js 16+ project with TypeScript, App Router, and Tailwind CSS in `frontend/` directory using `npx create-next-app@latest frontend --typescript --app --tailwind --src-dir=false --import-alias="@/*"`
- [ ] T002 Initialize shadcn/ui in `frontend/` with New York style, Slate base color, and CSS variables using `npx shadcn@latest init`
- [ ] T003 Install shadcn/ui components: button, card, dialog, input, label, badge, select, skeleton, textarea, dropdown-menu using `npx shadcn@latest add button card dialog input label badge select skeleton textarea dropdown-menu`
- [ ] T004 [P] Install runtime dependencies: `npm install better-auth lucide-react next-themes sonner react-hook-form zod @hookform/resolvers`
- [ ] T005 [P] Create environment template in `frontend/.env.example` with NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, JWT_SECRET_KEY, DATABASE_URL placeholders
- [ ] T006 Create shared TypeScript interfaces (Task, CreateTaskPayload, UpdateTaskPayload, User, Session, ApiError) in `frontend/types/index.ts` per data-model.md
- [ ] T007 Create Zod validation schemas (loginSchema, signupSchema, createTaskSchema, editTaskSchema) in `frontend/lib/validations.ts` per data-model.md

**Checkpoint**: Project scaffolded with all dependencies installed, types and schemas ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Configure Better Auth server instance with JWT plugin (HS256, shared secret) in `frontend/lib/auth.ts` — enable emailAndPassword, configure jwt plugin with token.secret from env, customPayload returning sub/email/name
- [ ] T009 Create Better Auth client with jwtClient plugin in `frontend/lib/auth-client.ts` — export useSession, signIn, signUp, signOut helpers
- [ ] T010 Create Better Auth catch-all API route in `frontend/app/api/auth/[...all]/route.ts` — export GET and POST using toNextJsHandler
- [ ] T011 Create centralized API client in `frontend/lib/api.ts` — implement getToken (from Better Auth session), request wrapper with Bearer token attachment, 401 handling (signOut + redirect), typed methods: getTasks, getTask, createTask, updateTask, deleteTask, toggleTask per contracts/api-client.md
- [ ] T012 Configure root layout in `frontend/app/layout.tsx` — import Inter font, wrap with ThemeProvider (next-themes, attribute="class", defaultTheme="system"), add Toaster (sonner), set suppressHydrationWarning on html tag
- [ ] T013 Update global styles in `frontend/app/globals.css` — add Tailwind directives, CSS variables for shadcn/ui theme (light and dark), gradient background utilities per design system

**Checkpoint**: Foundation ready — auth configured, API client operational, root layout with theme and toast providers. User story implementation can now begin.

---

## Phase 3: User Story 1 — Sign Up and Log In (Priority: P1) 🎯 MVP

**Goal**: Users can register, log in, and be redirected to the task dashboard. Auth pages look premium with gradient backgrounds and polished forms.

**Independent Test**: Navigate to `/login`, create account, log in, verify redirect to `/tasks`. Try invalid credentials and verify error messages.

### Implementation for User Story 1

- [ ] T014 [US1] Create auth layout in `frontend/app/(auth)/layout.tsx` — full-screen gradient background (from-indigo-500 via-purple-500 to-pink-500), centered glassmorphism card container (bg-white/80 backdrop-blur-xl rounded-xl shadow-lg), dark mode support
- [ ] T015 [P] [US1] Build login form component in `frontend/components/features/auth/login-form.tsx` — "use client", react-hook-form with loginSchema (Zod), email and password inputs with shadcn/ui Input + Label, error messages below fields, submit button with loading state (disabled + spinner), link to signup, call signIn.email from auth-client
- [ ] T016 [P] [US1] Build signup form component in `frontend/components/features/auth/signup-form.tsx` — "use client", react-hook-form with signupSchema (Zod), name/email/password inputs with shadcn/ui, error messages below fields, submit button with loading state, link to login, call signUp.email from auth-client
- [ ] T017 [P] [US1] Create login page in `frontend/app/(auth)/login/page.tsx` — import LoginForm, add heading "Welcome back" with subtext, render form in card
- [ ] T018 [P] [US1] Create signup page in `frontend/app/(auth)/signup/page.tsx` — import SignupForm, add heading "Create your account" with subtext, render form in card
- [ ] T019 [US1] Create protected layout in `frontend/app/(protected)/layout.tsx` — server component, check Better Auth session via auth.api.getSession with headers, redirect to /login if no session, render children (placeholder header for now)

**Checkpoint**: Auth flow complete — users can sign up, log in, and access protected routes. Unauthenticated users are redirected to login.

---

## Phase 4: User Story 2 — View and Manage Tasks on Dashboard (Priority: P1) 🎯 MVP

**Goal**: Authenticated users see tasks in a responsive card grid with full CRUD operations, status badges, filtering, and sorting.

**Independent Test**: Log in, create a task via modal, see it in grid, edit title, toggle completion, filter by status, delete with confirmation. Verify empty state when no tasks.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Build task status badge component in `frontend/components/features/tasks/task-status-badge.tsx` — render rounded-full badge with color per status: pending (yellow-50/yellow-700), completed (green-50/green-700), per design system badge variants
- [ ] T021 [P] [US2] Build task empty state component in `frontend/components/features/tasks/task-empty-state.tsx` — dashed border container, clipboard/checklist icon from lucide-react, "No tasks yet" heading, "Create your first task to get started" subtext, "New Task" CTA button
- [ ] T022 [US2] Build task card component in `frontend/components/features/tasks/task-card.tsx` — "use client", shadcn Card with rounded-xl shadow-sm hover:shadow-md transition, TaskStatusBadge, title (text-lg font-semibold line-clamp-2), description (text-sm text-slate-500 line-clamp-3), created_at date, action row: checkbox toggle (Check icon), edit button (Pencil icon), delete button (Trash2 icon) from lucide-react, hover:scale-[1.02] transition, dark mode colors
- [ ] T023 [US2] Build create task dialog in `frontend/components/features/tasks/task-create-dialog.tsx` — "use client", shadcn Dialog, react-hook-form with createTaskSchema, title Input (required, maxLength 255) and description Textarea (optional), submit button with loading/disabled state, onCreated callback, toast on success/error
- [ ] T024 [US2] Build edit task dialog in `frontend/components/features/tasks/task-edit-dialog.tsx` — "use client", shadcn Dialog, react-hook-form with editTaskSchema, pre-populate fields from task prop, submit button with loading state, onUpdated callback, toast on success/error
- [ ] T025 [US2] Build delete task dialog in `frontend/components/features/tasks/task-delete-dialog.tsx` — "use client", shadcn Dialog, show task title in confirmation message "Are you sure you want to delete [title]?", cancel and delete (danger variant) buttons, onDeleted callback, toast on success/error
- [ ] T026 [US2] Build task filters component in `frontend/components/features/tasks/task-filters.tsx` — "use client", shadcn Select for status filter (All, Pending, Completed), shadcn Select for sort order (Newest first, Oldest first), flex row with gap-3, responsive: stack on mobile
- [ ] T027 [US2] Build task list component in `frontend/components/features/tasks/task-list.tsx` — "use client", useState for tasks/loading/error/filters, useEffect to fetch tasks via getTasks from lib/api.ts, responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4), render TaskCard for each task, TaskEmptyState when empty, TaskFilters above grid, "New Task" button opening TaskCreateDialog, handle toggle/edit/delete with optimistic state updates, pass user_id from session
- [ ] T028 [US2] Create task dashboard page in `frontend/app/(protected)/tasks/page.tsx` — server component shell, import TaskList, wrap in max-w-6xl mx-auto px-4 container, page title "My Tasks" (text-2xl font-bold)

**Checkpoint**: Full task CRUD operational — create, read, update, delete, toggle, filter, sort all working. Empty state displays correctly. Dashboard is the complete MVP.

---

## Phase 5: User Story 3 — Dark Mode and Visual Polish (Priority: P2)

**Goal**: Smooth dark mode toggle in the header, theme persists across sessions, all components render correctly in both themes.

**Independent Test**: Click the sun/moon toggle, verify all pages switch to dark palette. Refresh and verify persistence. Check cards, forms, badges, modals in dark mode.

### Implementation for User Story 3

- [ ] T029 [P] [US3] Build theme toggle component in `frontend/components/features/layout/theme-toggle.tsx` — "use client", useTheme from next-themes, Sun/Moon icons from lucide-react, ghost button variant, toggle between light/dark, transition-all duration-200
- [ ] T030 [US3] Add dark mode classes to all existing components — update task-card.tsx (dark:bg-slate-900, dark:border-slate-700, dark:text-slate-50), task-status-badge.tsx (dark ring colors), task-empty-state.tsx (dark text), task-filters.tsx (dark select styles), all dialog components (dark bg/text), auth layout (dark gradient variant), login-form and signup-form (dark input styles)
- [ ] T031 [US3] Verify and fix dark mode in globals.css — ensure CSS variables have correct dark theme values, verify shadcn components inherit dark styles from ThemeProvider class attribute

**Checkpoint**: Dark mode fully functional across all pages and components. Theme persists across refreshes.

---

## Phase 6: User Story 4 — Loading and Error States (Priority: P2)

**Goal**: Skeleton loading cards during fetch, toast notifications for all mutations, optimistic updates with rollback on error.

**Independent Test**: Observe skeleton cards while dashboard loads. Create/edit/delete tasks and verify success toasts. Simulate API failure and verify error toast + rollback.

### Implementation for User Story 4

- [ ] T032 [P] [US4] Build task skeleton component in `frontend/components/features/tasks/task-skeleton.tsx` — shadcn Skeleton, match TaskCard dimensions: rounded-xl card with pulsing bars for badge, title, description, date, and actions
- [ ] T033 [US4] Create loading state file in `frontend/app/(protected)/tasks/loading.tsx` — render grid of 6 TaskSkeleton cards in same responsive grid layout (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- [ ] T034 [US4] Add optimistic updates with rollback to task-list.tsx — on createTask: add to state immediately, rollback on error; on toggleTask: flip completed immediately, rollback on error; on deleteTask: remove from state immediately, re-add on error; on updateTask: merge changes immediately, rollback on error; show error toast via sonner on each rollback
- [ ] T035 [US4] Add toast notifications to all mutation handlers in task-list.tsx — success toasts for create ("Task created"), update ("Task updated"), delete ("Task deleted"), toggle ("Task completed"/"Task reopened"); error toasts with detail message from API; use sonner toast() with appropriate styling

**Checkpoint**: Loading states, toasts, and optimistic updates fully implemented. Error rollbacks working.

---

## Phase 7: User Story 5 — Responsive Navigation and Layout (Priority: P3)

**Goal**: Clean header with logo, user menu, theme toggle, logout. Mobile hamburger menu. Consistent design system across all viewports.

**Independent Test**: View app at desktop (>=1024px) and verify inline header. Resize to mobile (<640px) and verify hamburger menu. Check spacing and typography consistency.

### Implementation for User Story 5

- [ ] T036 [P] [US5] Build user menu component in `frontend/components/features/layout/user-menu.tsx` — "use client", shadcn DropdownMenu, show user avatar placeholder (circle with initial) + email, dropdown items: "My Tasks" link, separator, "Log out" button calling signOut from auth-client
- [ ] T037 [P] [US5] Build mobile nav component in `frontend/components/features/layout/mobile-nav.tsx` — "use client", hamburger icon (Menu from lucide-react), slide-out panel or dropdown with nav links, user email, theme toggle, logout button, visible only on sm breakpoint and below
- [ ] T038 [US5] Build header component in `frontend/components/features/layout/header.tsx` — "use client", sticky top-0 z-50, backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b, max-w-6xl mx-auto, app logo/title "TaskFlow" on left, desktop nav (hidden sm:flex): ThemeToggle + UserMenu on right, mobile: MobileNav (flex sm:hidden) on right
- [ ] T039 [US5] Update protected layout in `frontend/app/(protected)/layout.tsx` — import Header component, render above children, add min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 wrapper

**Checkpoint**: Responsive navigation complete. Header adapts to all viewports. Design system consistent.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final visual polish, accessibility audit, transitions, hover effects

- [ ] T040 Add hover and transition effects to all interactive elements — task cards (hover:shadow-md hover:scale-[1.02] transition-all duration-200), buttons (transition-all duration-200), form inputs (transition-colors duration-200), ensure focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 on all interactive elements
- [ ] T041 [P] Add ARIA attributes to all interactive components — aria-label on icon buttons (edit, delete, toggle), role="status" on badges, aria-live="polite" on task list for dynamic updates, aria-label on modals/dialogs
- [ ] T042 [P] Add keyboard navigation support — ensure Tab order is logical, Enter/Space activate buttons and toggles, Escape closes dialogs, focus trap in open dialogs (shadcn Dialog handles this)
- [ ] T043 Verify responsive layout at all breakpoints (320px, 640px, 768px, 1024px, 1280px) — check no horizontal scrollbar, grid adapts correctly, forms are full-width on mobile, buttons stack on mobile
- [ ] T044 Run quickstart.md validation — follow setup steps in quickstart.md, verify end-to-end flow: install → env config → dev server → signup → login → create task → toggle → edit → delete → dark mode → responsive check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 Auth (Phase 3)**: Depends on Phase 2 — BLOCKS US2 (dashboard needs auth)
- **US2 Dashboard (Phase 4)**: Depends on Phase 3 (needs auth working)
- **US3 Dark Mode (Phase 5)**: Depends on Phase 4 (needs components to exist for dark class additions)
- **US4 Loading/Error (Phase 6)**: Depends on Phase 4 (needs task-list.tsx to exist for optimistic updates)
- **US5 Navigation (Phase 7)**: Depends on Phase 3 (needs protected layout)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **US2 (P1)**: Depends on US1 (needs auth flow working to access dashboard)
- **US3 (P2)**: Depends on US2 (needs components to exist for dark mode styling)
- **US4 (P2)**: Depends on US2 (needs task-list.tsx for optimistic updates)
- **US5 (P3)**: Can start after US1 (needs protected layout, independent of dashboard)

### Within Each User Story

- Components before pages
- Base components before composite components (e.g., TaskStatusBadge before TaskCard)
- Forms before dialogs
- State management last (integrates all components)

### Parallel Opportunities

- T004 + T005 (install deps + create .env.example) — different files
- T015 + T016 + T017 + T018 (login form, signup form, login page, signup page) — different files
- T020 + T021 (status badge + empty state) — different files
- T029 + T030 is NOT parallel (T030 modifies files T029 creates)
- T032 + T033 is NOT parallel (T033 depends on T032)
- T036 + T037 (user menu + mobile nav) — different files
- T040 + T041 + T042 (polish tasks) — T041 and T042 are parallel, T040 touches same files

---

## Parallel Example: User Story 1

```bash
# Launch auth form components together:
Task T015: "Build login form in frontend/components/features/auth/login-form.tsx"
Task T016: "Build signup form in frontend/components/features/auth/signup-form.tsx"

# Launch auth pages together:
Task T017: "Create login page in frontend/app/(auth)/login/page.tsx"
Task T018: "Create signup page in frontend/app/(auth)/signup/page.tsx"
```

## Parallel Example: User Story 2

```bash
# Launch base components together:
Task T020: "Build task status badge in frontend/components/features/tasks/task-status-badge.tsx"
Task T021: "Build task empty state in frontend/components/features/tasks/task-empty-state.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Auth)
4. Complete Phase 4: User Story 2 (Dashboard CRUD)
5. **STOP and VALIDATE**: Full auth + CRUD flow working
6. Demo-ready MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Auth) → Test independently → Login/Signup working
3. US2 (Dashboard) → Test independently → Full CRUD MVP!
4. US3 (Dark Mode) → Test independently → Premium polish
5. US4 (Loading/Error) → Test independently → Production-quality states
6. US5 (Navigation) → Test independently → Responsive header
7. Polish → Final visual refinement → Demo-perfect

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 + US2 together form the MVP — prioritize completing both before polish
