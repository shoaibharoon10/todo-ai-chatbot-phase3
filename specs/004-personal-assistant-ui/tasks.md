# Tasks 004: Personal Assistant UI

**Feature:** `004-personal-assistant-ui`
**Spec:** `specs/004-personal-assistant-ui/spec.md`
**Date:** 2026-02-21

---

## Batch 1 — Backend: Dynamic System Prompt

### T001 — Extend ChatRequest with user identity fields
**File:** `backend/models.py`
**Change:** Add `user_name: str | None = None` and `user_email: str | None = None` to `ChatRequest`
**Covers:** AC1.5
- [ ] `user_name` and `user_email` are optional (default `None`)
- [ ] Existing clients without these fields continue to work (backward compatible)

### T002 — Implement `_build_system_prompt()` in chat.py
**File:** `backend/routes/chat.py`
**Change:** Replace static `SYSTEM_PROMPT` constant with `_build_system_prompt(user_name, user_email)` function
**Covers:** AC1.1, AC1.2, AC1.3, AC1.4, AC1.6
- [ ] Function accepts `user_name: str | None` and `user_email: str | None`
- [ ] Includes user identity in prompt when name/email provided
- [ ] Prompt instructs AI to greet by name, answer "who am I?", handle general questions
- [ ] Task management capabilities are preserved

### T003 — Pass user_name/user_email to system prompt in chat endpoint
**File:** `backend/routes/chat.py`
**Change:** In the `chat()` endpoint, call `_build_system_prompt(body.user_name, body.user_email)` instead of `SYSTEM_PROMPT`
**Covers:** AC1.6
- [ ] System message in Cohere messages array uses dynamic prompt
- [ ] No other behavior changes

---

## Batch 2 — Frontend: API + Floating Widget

### T004 — Update sendChatMessage to accept userInfo options
**File:** `frontend/src/lib/api.ts`
**Change:** Update `sendChatMessage` signature to accept optional `options` object with `conversationId`, `userName`, `userEmail`
**Covers:** AC1.7
- [ ] Old call signature `sendChatMessage(userId, message, conversationId?)` replaced
- [ ] New signature: `sendChatMessage(userId, message, options?)`
- [ ] `body` includes `user_name` and `user_email` when provided

### T005 — Create `floating-chat.tsx` component
**File:** `frontend/src/components/features/chat/floating-chat.tsx`
**Change:** NEW component — fixed bottom-right floating card with minimize/maximize
**Covers:** AC2.1, AC2.2, AC2.3, AC2.4, AC2.5, AC2.6, AC2.7
- [ ] Fixed position `bottom-6 right-6 z-50 hidden md:block`
- [ ] Expanded state: 360px wide, 480px tall, indigo header with Minus + Maximize2 icons
- [ ] Minimized state: slim bar showing "Chat with AI" + expand icon
- [ ] Maximize2 button navigates to `/chat` via `router.push`
- [ ] Minus button sets `isMinimized = true`
- [ ] Passes `userInfo` and `compact` to `ChatContainer`

### T006 — Add FloatingChat to /tasks page
**File:** `frontend/src/app/(protected)/tasks/page.tsx`
**Change:** Convert to `"use client"`, import `FloatingChat`, render at bottom of page
**Covers:** AC2.1, AC2.6
- [ ] Reads `userId`, `userName`, `userEmail` from `authClient.useSession()`
- [ ] Renders `<FloatingChat userId={userId} userName={userName} userEmail={userEmail} />` when userId present

---

## Batch 3 — Frontend: ChatContainer compact mode + userInfo wiring

### T007 — Add compact and userInfo props to ChatContainer
**File:** `frontend/src/components/features/chat/chat-container.tsx`
**Change:** Add `compact?: boolean` and `userInfo?: { userName?: string; userEmail?: string }` to props
**Covers:** AC2.8, AC1.7
- [ ] Both props optional, no breaking change to existing usage
- [ ] `handleSend` passes `userInfo.userName`/`userInfo.userEmail` to `sendChatMessage`
- [ ] Input area uses `p-2` when `compact`, `p-4` otherwise
- [ ] Update call from `sendChatMessage(userId, message, conversationId)` to options-object form

---

## Test Cases

| ID | Scenario | Expected |
|----|----------|----------|
| TC1 | POST /chat with `user_name: "Alice"`, say "hi" | AI greets "Hi Alice!" |
| TC2 | POST /chat with `user_name: "Alice"`, `user_email: "a@b.com"`, ask "who am I?" | AI states name + email |
| TC3 | POST /chat without user_name/user_email | AI responds generically, task tools work |
| TC4 | Floating widget on /tasks — click minimize | Widget collapses to bar |
| TC5 | Floating widget minimized — click expand icon | Widget re-opens |
| TC6 | Floating widget — click maximize | Router navigates to /chat |
| TC7 | Mobile viewport — floating widget | Widget not visible (hidden md:block) |
