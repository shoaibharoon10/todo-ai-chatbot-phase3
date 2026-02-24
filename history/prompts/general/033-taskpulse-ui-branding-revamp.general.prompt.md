---
id: 033
title: TaskPulse UI & Branding Revamp
stage: general
date: 2026-02-24
surface: agent
model: claude-sonnet-4-6
feature: 013-ui-taskpulse
branch: main
user: architect
command: /sp.specify + /sp.plan + /sp.tasks + /sp.implement
labels: ["branding","tailwind","css","ui","glassmorphism","pwa","constitution"]
links:
  spec: specs/013-ui-taskpulse/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - specs/013-ui-taskpulse/spec.md
  - specs/013-ui-taskpulse/plan.md
  - specs/013-ui-taskpulse/tasks.md
  - frontend/src/app/globals.css
  - frontend/src/app/layout.tsx
  - frontend/public/manifest.json
  - frontend/src/components/features/layout/header.tsx
  - frontend/src/components/features/layout/mobile-nav.tsx
  - frontend/src/app/(auth)/signup/page.tsx
  - frontend/src/components/features/chat/chat-message-list.tsx
  - frontend/src/components/features/chat/floating-chat.tsx
tests:
  - tsc --noEmit → exit code 0 (0 TypeScript errors)
---

## Prompt

Update the project's UI and branding to "TaskPulse" following the Spec-Kit Plus workflow. Do not modify any existing backend logic, DB schemas, MCP tools, Cohere integration, or the 8 recently implemented Phase IV features (due dates, notifications, priorities, tags, recurring, analytics, offline PWA, notes). Focus strictly on Next.js frontend (App Router), Tailwind CSS, shadcn/ui components, global styles, metadata, and branding text.

1. **Update Constitution (v1.2.1 or minor amendment)**:
   - Read existing constitution at .specify/memory/constitution.md (v1.2.0).
   - Add a new section: "Brand Identity & UI Guidelines" under Principle VIII or as a new Principle IX.
   - Brand Name: "TaskPulse"
   - Tagline/Slogans: Primary — "Feel the rhythm of your work" | Secondary — "AI-driven todos that keep you moving."
   - UI Theme: Vibrant Professional (Glassmorphism + Modern Bento-style grids, subtle animations).
   - Core Colors: Electric Indigo (#6366F1), Deep Teal (#0D9488), Sunset Orange (#F97316), Neutral Slate.
   - Typography: Modern sans-serif (Inter or default system), increased font weights for headings.
   - Animations: Add subtle "shimmer" keyframe for AI loading states.
   - Ratify the constitution update with date 2026-02-24.

2. **Create UI Revamp Spec** at specs/013-ui-taskpulse/spec.md.

3. **Generate Plan & Tasks** — plan.md and tasks.md in the same directory.

4. **Autonomous Implementation** — execute all tasks T1–T12 then TypeScript verify.

## Response snapshot

Full Spec-Kit Plus workflow executed across 6 phases:

**Constitution**: Updated to v1.2.1. Added Principle IX (Brand Identity & UI Guidelines) with product name TaskPulse, taglines, full colour palette, typography, animation, and glassmorphism standards. Ratified 2026-02-24.

**Spec** (`specs/013-ui-taskpulse/spec.md`): Created with 8 requirement sections covering Tailwind v4 brand tokens, CSS variable overrides (light + dark), glassmorphism utility, shimmer animation, global text replacements table, active-nav colour update, chat shimmer upgrade, and floating-chat gradient. WCAG AA analysis included.

**Plan** (`specs/013-ui-taskpulse/plan.md`): 6-layer implementation order defined (tokens → metadata → nav → auth copy → chat → verify). 4 architectural decisions documented.

**Tasks** (`specs/013-ui-taskpulse/tasks.md`): 13 tasks with acceptance criteria, dependency graph, and test cases.

**Implementation** (T1–T12):
- `globals.css`: Added `--color-brand-indigo/teal/orange` to `@theme inline`; overrode `--primary/#6366f1`, `--secondary/#0d9488`, `--accent/#f97316`, `--ring` in `:root`; overrode dark-mode variants with WCAG AA-verified lighter shades (`#818cf8`, `#2dd4bf`, `#fb923c`); added `@keyframes shimmer` + `.animate-shimmer`; added `.glass-panel` utility.
- `layout.tsx`: Title → "TaskPulse — Feel the rhythm of your work"; description → "AI-driven todos that keep you moving."; theme-color → `#6366F1`.
- `manifest.json`: name/short_name → "TaskPulse"; description & theme_color updated.
- `header.tsx`: "TaskFlow" → "TaskPulse"; active nav classes updated to indigo-50/700.
- `mobile-nav.tsx`: active nav class updated to indigo-700/300.
- `signup/page.tsx`: "TaskFlow" → "TaskPulse" in sub-heading.
- `chat-message-list.tsx`: Three-dot bounce loader → shimmer bubble using `.animate-shimmer`.
- `floating-chat.tsx`: Solid indigo header → gradient `from-indigo-600 to-indigo-500`.

**T13 — TypeScript**: `tsc --noEmit` exit code 0. Zero errors.

## Outcome

- ✅ Impact: Complete brand rename (TaskFlow → TaskPulse) and vibrant brand theme applied across all user-visible frontend surfaces. Zero backend changes. Zero Phase IV feature regressions.
- 🧪 Tests: tsc --noEmit passed (0 errors)
- 📁 Files: 12 files modified/created (1 constitution, 3 spec artifacts, 8 frontend files)
- 🔁 Next prompts: Visual QA in browser; consider applying `.glass-panel` to task cards for full glassmorphism effect; consider adding TaskPulse logo SVG icon.
- 🧠 Reflection: Tailwind v4's `@theme inline` pattern (no config file) was correctly identified from `globals.css` imports — no separate `tailwind.config.ts` needed. Hex values in CSS custom properties work cleanly alongside existing `oklch()` values.

## Evaluation notes (flywheel)

- Failure modes observed: None — TypeScript clean, no structural changes to existing components.
- Graders run and results (PASS/FAIL): tsc → PASS
- Prompt variant (if applicable): Full SDD workflow (specify → plan → tasks → implement)
- Next experiment: Apply `.glass-panel` to task cards and modals for full Glassmorphism theme expression.
