# Spec 013 — TaskPulse UI & Branding Revamp

**Feature slug**: `013-ui-taskpulse`
**Status**: approved
**Spec version**: 1.0.0
**Author**: Claude Code (Spec-Kit Plus)
**Date**: 2026-02-24
**Constitution ref**: v1.2.1 — Principle IX (Brand Identity & UI Guidelines)

---

## 1. Goal

Replace all "TaskFlow" branding with "TaskPulse" and apply the Vibrant Professional
UI theme (Electric Indigo primary, Glassmorphism panels, shimmer AI loading animation)
across the Next.js (App Router) frontend. No backend, DB, MCP, or Cohere changes.

---

## 2. Scope

### In scope
- `frontend/src/app/globals.css` — colour variables, shimmer keyframe, glass-panel
- `frontend/src/app/layout.tsx` — metadata title/description, theme-color meta tag
- `frontend/public/manifest.json` — PWA name, short_name, description, theme_color
- `frontend/src/components/features/layout/header.tsx` — brand name, active-nav colours
- `frontend/src/components/features/layout/mobile-nav.tsx` — active-nav colours
- `frontend/src/app/(auth)/signup/page.tsx` — brand name in sub-heading
- `frontend/src/components/features/chat/chat-message-list.tsx` — shimmer loading bubble
- `frontend/src/components/features/chat/floating-chat.tsx` — header gradient
- `frontend/src/components/features/chat/chat-message.tsx` — user bubble brand colour

### Out of scope
- Backend (`backend/`) — zero changes
- DB schemas or migrations — zero changes
- Cohere integration or MCP tools — zero changes
- Phase IV features (005–012) business logic — zero changes
- Auth flows (Better Auth, JWT) — zero changes
- New pages or routes

---

## 3. Requirements

### 3.1 Tailwind v4 Custom Colour Tokens

Since the project uses Tailwind v4 (imported via `globals.css`), custom colours are
registered in the `@theme inline` block — there is no separate `tailwind.config.ts`.

Add to `@theme inline`:
```css
--color-brand-indigo: #6366f1;
--color-brand-teal:   #0d9488;
--color-brand-orange: #f97316;
```

This generates utilities: `bg-brand-indigo`, `text-brand-teal`, `border-brand-orange`, etc.

### 3.2 CSS Variable Overrides (shadcn/ui theme)

Override the default shadcn neutral-primary with Electric Indigo brand colours.

**`:root` (light mode) overrides:**
| Variable              | New value   | Meaning                         |
|-----------------------|-------------|---------------------------------|
| `--primary`           | `#6366f1`   | Electric Indigo                 |
| `--primary-foreground`| `#ffffff`   | White text on primary bg        |
| `--secondary`         | `#0d9488`   | Deep Teal                       |
| `--secondary-foreground`| `#ffffff` | White text on secondary bg      |
| `--accent`            | `#f97316`   | Sunset Orange                   |
| `--accent-foreground` | `#ffffff`   | White text on accent bg         |
| `--ring`              | `#6366f1`   | Focus ring = primary            |
| `--sidebar-primary`   | `#6366f1`   | Sidebar active = brand indigo   |
| `--sidebar-ring`      | `#6366f1`   | Sidebar ring = brand indigo     |

**`.dark` overrides:**
| Variable              | New value   | Meaning                                      |
|-----------------------|-------------|----------------------------------------------|
| `--primary`           | `#818cf8`   | Indigo-400 (lighter for dark bg, WCAG AA ok) |
| `--primary-foreground`| `#1e1b4b`   | Deep indigo text on light primary            |
| `--secondary`         | `#2dd4bf`   | Teal-400                                     |
| `--secondary-foreground`| `#042f2e`| Dark teal text                               |
| `--accent`            | `#fb923c`   | Orange-400                                   |
| `--accent-foreground` | `#431407`   | Dark orange text                             |
| `--ring`              | `#818cf8`   | Focus ring = lighter indigo                  |
| `--sidebar-primary`   | `#818cf8`   | Sidebar active (dark)                        |
| `--sidebar-ring`      | `#818cf8`   | Sidebar ring (dark)                          |

### 3.3 Glassmorphism Utility

Add `.glass-panel` as a custom CSS class (not a Tailwind utility, but a regular class):
```css
.glass-panel {
  background-color: rgb(255 255 255 / 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgb(255 255 255 / 0.2);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}
.dark .glass-panel {
  background-color: rgb(15 23 42 / 0.7);
}
```

### 3.4 Shimmer Animation

Add `@keyframes shimmer` and `.animate-shimmer` utility for AI loading states:
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent              0%,
    rgba(99, 102, 241, 0.18) 50%,
    transparent              100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### 3.5 Global Metadata & Text Replacements

| File                                     | Old text                             | New text                                   |
|------------------------------------------|--------------------------------------|--------------------------------------------|
| `layout.tsx` — metadata title            | `TaskFlow — Modern Task Management`  | `TaskPulse — Feel the rhythm of your work` |
| `layout.tsx` — metadata description      | `A professional, beautiful task …`   | `AI-driven todos that keep you moving.`    |
| `layout.tsx` — theme-color meta          | `#4f46e5`                            | `#6366F1`                                  |
| `manifest.json` — name                   | `TaskFlow AI`                        | `TaskPulse`                                |
| `manifest.json` — short_name             | `TaskFlow`                           | `TaskPulse`                                |
| `manifest.json` — description            | `AI-powered personal task manager`   | `AI-driven todos that keep you moving.`    |
| `manifest.json` — theme_color            | `#4f46e5`                            | `#6366F1`                                  |
| `header.tsx` — brand span                | `TaskFlow`                           | `TaskPulse`                                |
| `signup/page.tsx` — sub-heading          | `Get started with TaskFlow in seconds` | `Get started with TaskPulse in seconds`  |

### 3.6 Active Nav State Colour Update

In `header.tsx` and `mobile-nav.tsx`, replace the active-state class from
`bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50` to
`bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300`.
(Matches brand-indigo without using custom utility.)

### 3.7 Chat Loading Shimmer

In `chat-message-list.tsx`, replace the three-dot bounce loading indicator in the
AI response bubble with a shimmer animation:
- Wrap the bubble `div` with the `.animate-shimmer` class applied to an overlay, OR
- Replace the inner content with a shimmer div of fixed dimensions.

Chosen approach: Replace the static bubble with a shimmer-styled loading card that
uses the brand indigo palette and `animate-shimmer`.

### 3.8 Floating Chat Header

Update `floating-chat.tsx` chat header to use a brand-indigo gradient:
- Replace `bg-indigo-600` with `bg-gradient-to-r from-indigo-600 to-indigo-500`.
- The hover states remain `hover:bg-indigo-700`.

---

## 4. Acceptance Criteria

- [ ] `tsc --noEmit` reports 0 TypeScript errors after all changes.
- [ ] "TaskPulse" appears in browser `<title>`, PWA manifest name, and header logo text.
- [ ] Primary buttons (shadcn `Button` default) render as Electric Indigo (#6366F1).
- [ ] Active nav links render with indigo-50/indigo-700 background/text in light mode.
- [ ] AI loading state in chat uses shimmer animation (not plain bouncing dots).
- [ ] `.glass-panel` class applies glassmorphism styling when added to any element.
- [ ] Dark mode: primary colour is indigo-400 (#818CF8), passing WCAG AA against dark bg.
- [ ] No errors in the browser console related to the changes.
- [ ] All Phase IV feature components (due-date badge, priority badge, tags, etc.) remain unmodified.

---

## 5. Non-Goals

- Redesigning page layouts (task list grid, dashboard grid structure).
- Adding new icons or illustration assets.
- Custom font installation (Geist Sans is already loaded; sufficient).
- Backend API or database changes of any kind.
- Changing shadcn component source files in `components/ui/`.

---

## 6. WCAG AA Colour Contrast Notes

| Combination                         | Contrast Ratio | WCAG AA pass? |
|-------------------------------------|----------------|---------------|
| #6366F1 on #FFFFFF (light primary)  | ~3.0:1         | ✅ large text / UI |
| #FFFFFF on #6366F1 (primary btn)    | ~3.0:1         | ✅ large text / UI |
| #818CF8 on #0f172a (dark primary)   | ~5.5:1         | ✅ normal text |
| #1e1b4b on #818CF8 (dark btn text)  | ~5.5:1         | ✅ normal text |
| #F97316 on #FFFFFF (orange accent)  | ~2.8:1         | ✅ large text only — use for badges ≥ 14pt bold |
| #FB923C on #0f172a (dark orange)    | ~4.6:1         | ✅ normal text |

Urgent / overdue badge text: use `text-white font-semibold` on brand-orange bg to ensure readability.
