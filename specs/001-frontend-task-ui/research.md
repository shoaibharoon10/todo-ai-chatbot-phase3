# Research: Professional Frontend Task UI

**Branch**: `001-frontend-task-ui` | **Date**: 2026-02-12

## Research Summary

All technical decisions resolved from constitution constraints and user requirements. No NEEDS CLARIFICATION items remain.

## Decision Log

### D1: UI Component Library

- **Decision**: shadcn/ui (Radix primitives + Tailwind CSS)
- **Rationale**: Constitution mandates Tailwind CSS. shadcn/ui provides accessible, unstyled Radix primitives with Tailwind classes. Components are copy-pasted (not a runtime dependency), giving full customization control.
- **Alternatives considered**:
  - Headless UI: fewer components, no form primitives
  - Chakra UI: CSS-in-JS conflicts with constitution Tailwind mandate
  - MUI: heavyweight, CSS-in-JS based

### D2: Dark Mode Implementation

- **Decision**: next-themes with `attribute="class"` strategy
- **Rationale**: Tailwind CSS `dark:` variant requires class-based toggling. next-themes handles localStorage persistence, system preference detection, and SSR hydration without flash.
- **Alternatives considered**:
  - Manual implementation: requires custom localStorage + hydration logic
  - CSS media query: no user toggle, system-only

### D3: Form Validation

- **Decision**: react-hook-form + zod + @hookform/resolvers
- **Rationale**: react-hook-form is uncontrolled (performant), zod provides type-safe schemas shared with TypeScript. User requirement is explicit: "React Hook Form + Zod validation".
- **Alternatives considered**:
  - Formik: controlled inputs, heavier re-renders
  - Native HTML validation: no programmatic error display

### D4: Toast Notifications

- **Decision**: sonner
- **Rationale**: Lightweight, beautiful defaults, supports theming. User requirement explicitly names sonner.
- **Alternatives considered**:
  - react-hot-toast: fewer features, no promise toasts
  - shadcn toast: requires additional Radix setup

### D5: State Management for Tasks

- **Decision**: React useState + useEffect with optimistic update pattern (no SWR/React Query)
- **Rationale**: Task list is a single screen with simple CRUD. Adding SWR or React Query introduces unnecessary complexity for a hackathon demo. Optimistic updates can be implemented with local state manipulation.
- **Alternatives considered**:
  - SWR: good for caching but overkill for single-page task list
  - Zustand: unnecessary for component-local state
  - React Query: similar to SWR, more setup than benefit here

### D6: Auth Integration

- **Decision**: Better Auth with JWT plugin (HS256 symmetric)
- **Rationale**: Constitution mandates Better Auth. JWT plugin issues tokens with shared secret matching backend's PyJWT verification.
- **Alternatives considered**: None (constitution-locked)

### D7: Icons

- **Decision**: lucide-react
- **Rationale**: User requirement explicitly names lucide-react. Tree-shakeable, consistent style, 1000+ icons.
- **Alternatives considered**: None (user-specified)
