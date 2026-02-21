# Spec 004: Personal Assistant UI

**Feature:** `004-personal-assistant-ui`
**Status:** Draft
**Date:** 2026-02-21

---

## 1. Overview

Enhance the Phase 3 AI chatbot with two safe, non-breaking improvements:

1. **Personal Assistant System Prompt** — the AI greets users by name, answers identity questions ("who am I?"), handles general conversation, and remains a strong task management expert.
2. **Floating Chat Widget** — a minimizable floating card on the `/tasks` page lets users chat without navigating away; a maximize button opens the full `/chat` page.

---

## 2. User Stories

### US1: Personal Assistant System Prompt

**As a logged-in user**, I want the AI to address me by name, answer "who am I?", respond to greetings warmly, and handle general questions — while still being an expert task manager.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC1.1 | When the user says "hello" or "hi", the AI greets them warmly and uses their name if known |
| AC1.2 | When the user asks "who am I?", the AI states their name and email |
| AC1.3 | The AI answers general knowledge questions and conversational topics |
| AC1.4 | Task management commands still trigger the correct tool calls |
| AC1.5 | `ChatRequest` accepts optional `user_name: str | None` and `user_email: str | None` fields |
| AC1.6 | `_build_system_prompt(user_name, user_email)` builds a context-aware prompt string |
| AC1.7 | The frontend passes `userName` and `userEmail` from the session to `sendChatMessage` |

### US2: Floating Chat Widget on /tasks Page

**As a logged-in user on the Tasks page**, I want a floating chat widget so I can manage tasks via AI without leaving the page.

**Acceptance Criteria:**

| ID | Criterion |
|----|-----------|
| AC2.1 | A floating card appears at bottom-right of the `/tasks` page |
| AC2.2 | The widget shows a compact chat UI (message list + input) at 480px height and 360px wide |
| AC2.3 | A minimize (−) button collapses the widget to a slim header bar |
| AC2.4 | A maximize/expand (⤢) button navigates to the full `/chat` page |
| AC2.5 | When minimized, only a "Chat with AI" header bar with expand icon is visible |
| AC2.6 | The widget passes `userInfo: { userName, userEmail }` to `ChatContainer` |
| AC2.7 | The widget is hidden on mobile (`hidden md:block`) |
| AC2.8 | `ChatContainer` accepts a `compact` prop that reduces input area padding |

---

## 3. Out of Scope

- WebSocket / real-time streaming
- Persisting minimize state across page reloads
- Third-party chat widget libraries
- Resize-by-drag interaction
- Multi-conversation switching in the widget

---

## 4. Constraints

- No new npm packages; use existing shadcn/ui + lucide-react
- Backend `ChatRequest` changes are additive (optional fields, fully backward compatible)
- `ChatContainer` changes are additive (`compact` and `userInfo` are optional props)
- Smallest viable diff only; do not refactor unrelated code

---

## 5. API Contract Change (Backend)

**Endpoint:** `POST /api/{user_id}/chat`

**Request body (updated):**
```json
{
  "message": "string (1–5000 chars)",
  "conversation_id": "string | null",
  "user_name": "string | null",
  "user_email": "string | null"
}
```

All new fields are optional. Existing clients without `user_name`/`user_email` continue to work; system prompt falls back to generic form.
