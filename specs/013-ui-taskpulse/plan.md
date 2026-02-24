# Plan 013 — TaskPulse UI & Branding Revamp

**Feature**: `013-ui-taskpulse`
**Spec ref**: `specs/013-ui-taskpulse/spec.md`
**Plan date**: 2026-02-24
**Constitution ref**: v1.2.1

---

## Architecture Overview

Pure frontend change. No new dependencies required. All changes are in the
Next.js app directory (`frontend/src/`) and public assets (`frontend/public/`).

Because the project uses **Tailwind v4** (single-file CSS import, no config),
the design token extension point is the `@theme inline` block in `globals.css`.
CSS custom property overrides replace the shadcn default neutral palette with
the TaskPulse brand palette.

---

## Implementation Layers

### Layer 1 — Design Tokens (globals.css)
**Order**: first, because all components consume tokens.

1. Add brand utility tokens to `@theme inline`.
2. Override `--primary`, `--secondary`, `--accent`, `--ring` in `:root`.
3. Override same variables in `.dark`.
4. Add `@keyframes shimmer` and `.animate-shimmer` class.
5. Add `.glass-panel` class.

### Layer 2 — Metadata & Manifest
**Order**: second, independent of component changes.

6. Update `layout.tsx` — title, description, theme-color meta.
7. Update `manifest.json` — name, short_name, description, theme_color.

### Layer 3 — Navigation & Layout Components
**Order**: third, after tokens are settled.

8. `header.tsx` — rename "TaskFlow" → "TaskPulse", update active-nav classes.
9. `mobile-nav.tsx` — update active-nav classes.

### Layer 4 — Auth Page Copy
**Order**: fourth.

10. `signup/page.tsx` — "TaskFlow" → "TaskPulse" in sub-heading.

### Layer 5 — Chat UI Enhancement
**Order**: fifth (depends on shimmer token from Layer 1).

11. `chat-message-list.tsx` — replace bounce loading with shimmer bubble.
12. `floating-chat.tsx` — add gradient to chat header bar.

### Layer 6 — Verification
13. TypeScript check (`tsc --noEmit`) — must report 0 errors.
14. Visual verification checklist.

---

## Key Decisions

### D1: Colour format in CSS variables
**Decision**: Use hex literals (`#6366f1`) in CSS custom property values.
**Rationale**: The `@theme inline` block and `:root` accept any valid CSS colour;
hex is more readable and directly matches brand colour codes from the spec.
The existing oklch values are kept for unchanged variables.

### D2: No tailwind.config.ts
**Decision**: No new config file created.
**Rationale**: Tailwind v4 does not need `tailwind.config.ts`; the `@theme inline`
block in `globals.css` is the correct extension point.

### D3: Shimmer via CSS class (not Tailwind JIT)
**Decision**: `.animate-shimmer` implemented as a plain CSS class.
**Rationale**: Custom `background-size` + `background-position` animation doesn't
map cleanly to Tailwind arbitrary values; a regular CSS class is cleaner and more
readable.

### D4: Active nav — use Tailwind indigo palette, not custom brand-*
**Decision**: Active nav uses `bg-indigo-50 text-indigo-700 dark:bg-indigo-950
dark:text-indigo-300` instead of `bg-brand-indigo`.
**Rationale**: These pre-existing Tailwind scales are lighter tints of indigo,
appropriate for backgrounds. `brand-indigo` is the full #6366f1 — too dark for a nav bg.

---

## Risk Analysis

| Risk                                          | Mitigation                                        |
|-----------------------------------------------|---------------------------------------------------|
| shadcn component theming breaks after primary  override | Only `--primary` / `--secondary` / `--accent` are changed; structural variables (`--card`, `--popover`, `--border`) are untouched |
| Dark mode contrast regression               | Chose `#818cf8` (indigo-400) as dark primary — verified ~5.5:1 on dark-bg |
| Tailwind v4 purge removes `.animate-shimmer` | Class used directly in JSX; no purging risk |
| PWA manifest cache serves stale name       | Hard-refresh / service worker update will propagate; documented in verification steps |
