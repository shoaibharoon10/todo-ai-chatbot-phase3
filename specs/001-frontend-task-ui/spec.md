# Feature Specification: Professional Frontend Task UI

**Feature Branch**: `001-frontend-task-ui`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "Professional, modern, visually stunning frontend UI for hackathon todo app with auth, task CRUD, dark mode, responsive design, and premium SaaS-grade polish."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign Up and Log In (Priority: P1)

A new user visits the app and sees a beautiful login page with a gradient background. They click "Create account", fill in email and password on an equally polished signup form, and are redirected to the task dashboard. Returning users enter credentials on the login page and are taken directly to their dashboard. If the session expires, the user is automatically redirected to login with a friendly message.

**Why this priority**: Without authentication, no other feature is accessible. Auth pages are the first impression of the app — they MUST look premium.

**Independent Test**: Can be fully tested by navigating to `/login`, creating an account, logging in, and verifying redirect to the dashboard. Delivers a complete first-run experience.

**Acceptance Scenarios**:

1. **Given** a new user on the login page, **When** they click "Create account" and fill the signup form with valid email and password, **Then** they are registered and redirected to the task dashboard.
2. **Given** a registered user on the login page, **When** they enter valid credentials, **Then** they are authenticated and see the task dashboard.
3. **Given** a user with an invalid or expired token, **When** they attempt to access the dashboard, **Then** they are redirected to the login page.
4. **Given** a user on the signup form, **When** they submit with an invalid email or short password, **Then** validation errors appear below the relevant fields.

---

### User Story 2 - View and Manage Tasks on Dashboard (Priority: P1)

An authenticated user lands on the dashboard and sees their tasks displayed as cards in a responsive grid (1 column on mobile, 2-3 columns on desktop). Each card shows the title, a truncated description, a color-coded status badge (pending: yellow, completed: green), a creation date, and action icons (edit, delete, toggle complete). A floating "+" button or header button opens a modal to create new tasks. The user can filter tasks by status and sort by date.

**Why this priority**: The dashboard is the core product screen. It MUST demonstrate all CRUD operations and look visually impressive for judging.

**Independent Test**: Can be tested by logging in, creating a task, viewing it in the grid, editing it, toggling completion, filtering by status, and deleting it.

**Acceptance Scenarios**:

1. **Given** an authenticated user with tasks, **When** they open the dashboard, **Then** they see their tasks in a responsive card grid with status badges and action icons.
2. **Given** an authenticated user, **When** they click the "New Task" button and submit the form, **Then** the task appears immediately in the grid (optimistic update) and persists after refresh.
3. **Given** a task card, **When** the user clicks the edit icon and modifies the title, **Then** the card updates immediately with the new title.
4. **Given** a task card, **When** the user clicks the completion toggle, **Then** the status badge changes (pending ↔ completed) and the API is called.
5. **Given** a task card, **When** the user clicks delete and confirms, **Then** the card is removed from the grid.
6. **Given** the dashboard, **When** the user selects a status filter, **Then** only tasks matching that status are displayed.
7. **Given** no tasks exist, **When** the user views the dashboard, **Then** a friendly empty state with illustration and "Create your first task" call-to-action is shown.

---

### User Story 3 - Dark Mode and Visual Polish (Priority: P2)

A user toggles dark mode via a sun/moon icon in the header. The entire app transitions smoothly to a dark palette. All components (cards, forms, badges, navigation) adapt correctly. The theme preference persists across sessions.

**Why this priority**: Dark mode is a differentiator for visual polish and demonstrates attention to detail. It is secondary to core functionality but critical for the "premium" impression.

**Independent Test**: Can be tested by toggling the dark mode switch and verifying all pages/components render correctly in both themes.

**Acceptance Scenarios**:

1. **Given** the app in light mode, **When** the user clicks the dark mode toggle, **Then** all UI elements transition to the dark palette smoothly.
2. **Given** the app in dark mode, **When** the user refreshes the page, **Then** the app loads in dark mode (preference persisted).
3. **Given** any page in dark mode, **When** viewing task cards, forms, badges, navigation, and modals, **Then** all elements have correct contrast and readable text.

---

### User Story 4 - Loading and Error States (Priority: P2)

While tasks are being fetched, the user sees skeleton loading cards that pulse. If an API call fails, a toast notification appears with an error message. If the user creates a task and the API fails, the optimistic update is rolled back and an error toast is shown.

**Why this priority**: Graceful state handling prevents confusion and demonstrates production-quality polish.

**Independent Test**: Can be tested by simulating slow/failed API responses and verifying skeletons, toasts, and rollbacks appear correctly.

**Acceptance Scenarios**:

1. **Given** the dashboard is loading tasks, **When** the API has not yet responded, **Then** skeleton cards with pulse animation are displayed.
2. **Given** an API error occurs during task creation, **When** the optimistic update was applied, **Then** the update is rolled back and an error toast is shown.
3. **Given** any API error, **When** the error response is received, **Then** a descriptive toast notification appears and auto-dismisses.

---

### User Story 5 - Responsive Navigation and Layout (Priority: P3)

On desktop, the user sees a clean header with the app logo/title, navigation links, a user avatar/email, dark mode toggle, and logout button. On mobile, the header collapses into a hamburger menu. The entire layout uses consistent spacing, typography, and the design system.

**Why this priority**: Navigation and layout polish complete the professional appearance but are less critical than core CRUD and auth.

**Independent Test**: Can be tested by resizing the browser from mobile to desktop widths and verifying the header, grid, and all components adapt correctly.

**Acceptance Scenarios**:

1. **Given** a desktop viewport (>=1024px), **When** viewing the app, **Then** the header shows all navigation elements inline.
2. **Given** a mobile viewport (<640px), **When** viewing the app, **Then** the header shows a hamburger menu that expands on tap.
3. **Given** any viewport, **When** navigating between pages, **Then** spacing, typography, and colors are consistent with the design system.

---

### Edge Cases

- What happens when the JWT expires mid-session during a form submission? The API client MUST catch the 401, sign the user out, and redirect to login with a toast message.
- What happens when the user submits a task with an extremely long title (>255 chars)? The form validation MUST prevent submission and show an error.
- What happens when the user has hundreds of tasks? The grid MUST remain performant with no layout breakage.
- What happens when the user double-clicks the submit button? The form MUST disable the button during submission to prevent duplicates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to register with email and password via a polished signup page.
- **FR-002**: Users MUST be able to log in with email and password via a polished login page.
- **FR-003**: Authenticated users MUST see a dashboard with all their tasks in a responsive card grid.
- **FR-004**: Users MUST be able to create a new task via a modal form with title (required) and description (optional).
- **FR-005**: Users MUST be able to edit a task's title, description, and status via a modal form.
- **FR-006**: Users MUST be able to delete a task with a confirmation dialog.
- **FR-007**: Users MUST be able to toggle a task's completion status with a single click.
- **FR-008**: Users MUST be able to filter tasks by status (all, pending, completed).
- **FR-009**: Users MUST be able to sort tasks by creation date (newest/oldest).
- **FR-010**: The app MUST support dark mode with a persistent toggle in the header.
- **FR-011**: All task mutations MUST use optimistic updates with rollback on error.
- **FR-012**: The app MUST display loading skeletons while data is being fetched.
- **FR-013**: The app MUST display toast notifications for success and error events.
- **FR-014**: All forms MUST validate input and display errors below the relevant field.
- **FR-015**: The app MUST redirect unauthenticated users to the login page.
- **FR-016**: The app MUST handle 401 API responses by signing out and redirecting to login.
- **FR-017**: All UI MUST be responsive from mobile (320px) to desktop (1440px+).
- **FR-018**: All interactive elements MUST be keyboard-accessible with visible focus indicators.

### Key Entities

- **User**: Represents an authenticated person with email and session. Managed by Better Auth.
- **Task**: A user-owned todo item with title, optional description, completion status, and timestamps. Displayed as a card with status badge and action controls.
- **Session**: The Better Auth session containing the JWT used to authenticate API requests.

## Assumptions

- The backend API is fully operational at `http://localhost:8000/api/` with all CRUD endpoints and JWT verification as specified in the constitution.
- Better Auth is configured with the JWT plugin on the frontend, issuing HS256 tokens with the shared secret.
- The `tasks` table schema matches the constitution: id, user_id, title, description, completed, created_at, updated_at.
- shadcn/ui components are available for installation via CLI into the frontend project.
- The project uses Next.js 16+ with App Router and Tailwind CSS already configured (or will be configured as a setup task).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full registration-to-first-task flow in under 90 seconds.
- **SC-002**: The dashboard renders the task grid within 2 seconds of navigation for up to 100 tasks.
- **SC-003**: All pages score 90+ on Lighthouse accessibility audit.
- **SC-004**: All interactive elements are operable via keyboard alone.
- **SC-005**: Dark mode toggle switches theme in under 200ms with no flash of unstyled content.
- **SC-006**: Task creation with optimistic update reflects in the UI within 100ms of form submission.
- **SC-007**: The layout adapts correctly at all standard breakpoints (320px, 640px, 768px, 1024px, 1280px) with no horizontal scrollbar or overflow.
- **SC-008**: Zero unhandled errors visible in the browser console during normal task CRUD operations.
