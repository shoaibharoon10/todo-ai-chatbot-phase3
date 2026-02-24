# Tasks 013 — TaskPulse UI & Branding Revamp

**Feature**: `013-ui-taskpulse`
**Spec ref**: `specs/013-ui-taskpulse/spec.md`
**Plan ref**: `specs/013-ui-taskpulse/plan.md`
**Generated**: 2026-02-24

---

## Task List

### T1 — Extend @theme inline with brand colour tokens
**File**: `frontend/src/app/globals.css`
**Action**: Add three custom colour tokens inside the existing `@theme inline { }` block.
```css
--color-brand-indigo: #6366f1;
--color-brand-teal:   #0d9488;
--color-brand-orange: #f97316;
```
**Tests**:
- [ ] `bg-brand-indigo` Tailwind class resolves to `#6366f1` in computed styles.
- [ ] `text-brand-teal` and `border-brand-orange` tokens exist in generated CSS.

---

### T2 — Override :root CSS variables with brand colours
**File**: `frontend/src/app/globals.css`
**Action**: In the `:root { }` block, override:
- `--primary: #6366f1;`
- `--primary-foreground: #ffffff;`
- `--secondary: #0d9488;`
- `--secondary-foreground: #ffffff;`
- `--accent: #f97316;`
- `--accent-foreground: #ffffff;`
- `--ring: #6366f1;`
- `--sidebar-primary: #6366f1;`
- `--sidebar-ring: #6366f1;`
**Tests**:
- [ ] shadcn `Button` (default variant) renders Electric Indigo background.
- [ ] Focus ring on inputs renders indigo.

---

### T3 — Override .dark CSS variables with brand colours
**File**: `frontend/src/app/globals.css`
**Action**: In the `.dark { }` block, override:
- `--primary: #818cf8;`
- `--primary-foreground: #1e1b4b;`
- `--secondary: #2dd4bf;`
- `--secondary-foreground: #042f2e;`
- `--accent: #fb923c;`
- `--accent-foreground: #431407;`
- `--ring: #818cf8;`
- `--sidebar-primary: #818cf8;`
- `--sidebar-ring: #818cf8;`
**Tests**:
- [ ] In dark mode, primary buttons render `#818cf8` (indigo-400).
- [ ] Contrast ratio ≥ 4.5:1 for primary-foreground on primary bg (dark).

---

### T4 — Add shimmer keyframe and .animate-shimmer class
**File**: `frontend/src/app/globals.css`
**Action**: After the `@layer base { }` block, add:
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
**Tests**:
- [ ] `.animate-shimmer` class is present in the browser's computed styles.
- [ ] AI loading state in chat shows shimmer (not plain grey dots).

---

### T5 — Add .glass-panel utility class
**File**: `frontend/src/app/globals.css`
**Action**: Add after shimmer:
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
**Tests**:
- [ ] Applying `.glass-panel` to a `div` shows blur + translucent background.

---

### T6 — Update layout.tsx metadata and theme-color
**File**: `frontend/src/app/layout.tsx`
**Action**:
- title: `"TaskPulse — Feel the rhythm of your work"`
- description: `"AI-driven todos that keep you moving."`
- `<meta name="theme-color" content="#6366F1" />`
**Tests**:
- [ ] Browser tab title reads "TaskPulse — Feel the rhythm of your work".
- [ ] `<meta name="theme-color">` value is `#6366F1`.

---

### T7 — Update PWA manifest
**File**: `frontend/public/manifest.json`
**Action**:
- `name`: `"TaskPulse"`
- `short_name`: `"TaskPulse"`
- `description`: `"AI-driven todos that keep you moving."`
- `theme_color`: `"#6366F1"`
**Tests**:
- [ ] PWA install prompt shows "TaskPulse" name.

---

### T8 — Rename brand in header
**File**: `frontend/src/components/features/layout/header.tsx`
**Action**:
- Change `TaskFlow` text → `TaskPulse` in the `<span>`.
- Change active nav class:
  `bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50`
  → `bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300`
**Tests**:
- [ ] Header logo text reads "TaskPulse".
- [ ] Active nav link has indigo background highlight.

---

### T9 — Update active-nav classes in mobile nav
**File**: `frontend/src/components/features/layout/mobile-nav.tsx`
**Action**:
- Change active class:
  `font-medium text-slate-900 dark:text-slate-50`
  → `font-medium text-indigo-700 dark:text-indigo-300`
**Tests**:
- [ ] Mobile menu active link renders in indigo.

---

### T10 — Update signup page sub-heading
**File**: `frontend/src/app/(auth)/signup/page.tsx`
**Action**:
- Change: `"Get started with TaskFlow in seconds"`
  → `"Get started with TaskPulse in seconds"`
**Tests**:
- [ ] Signup page shows "TaskPulse" in sub-heading text.

---

### T11 — Replace chat loading bounce with shimmer
**File**: `frontend/src/components/features/chat/chat-message-list.tsx`
**Action**: Replace the three-dot bounce loading div with a shimmer-styled bubble:
```tsx
{isLoading && (
  <div className="flex justify-start">
    <div className="relative overflow-hidden rounded-2xl bg-slate-100 px-16 py-5 dark:bg-slate-800">
      <div className="animate-shimmer absolute inset-0" />
    </div>
  </div>
)}
```
**Tests**:
- [ ] While AI responds, a shimmer (not bouncing dots) appears in chat.
- [ ] Shimmer disappears when response arrives.

---

### T12 — Add gradient to floating chat header
**File**: `frontend/src/components/features/chat/floating-chat.tsx`
**Action**:
- Change: `bg-indigo-600` → `bg-gradient-to-r from-indigo-600 to-indigo-500`
  on the header bar div.
**Tests**:
- [ ] Floating chat header shows a subtle indigo gradient.

---

### T13 — TypeScript verification
**Action**: Run `cd frontend && npx tsc --noEmit` (or equivalent).
**Tests**:
- [ ] 0 TypeScript errors.

---

## Dependency Order

```
T1 → T2 → T3 → T4 → T5   (globals.css, sequential within file)
T6                          (layout.tsx, independent)
T7                          (manifest.json, independent)
T8, T9                      (nav components, independent of each other)
T10                         (auth page, independent)
T11 ← depends on T4         (shimmer must exist first)
T12                         (floating chat, independent)
T13                         (runs last, validates all)
```
