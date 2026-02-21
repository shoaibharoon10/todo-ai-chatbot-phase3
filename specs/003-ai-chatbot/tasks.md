# Tasks: AI Chatbot with Cohere Tool Use

**Input**: Design documents from `/specs/003-ai-chatbot/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/chat-endpoint.md, quickstart.md

**Tests**: Not explicitly requested in spec. Manual E2E verification via curl and browser at checkpoints.

**Organization**: Tasks grouped by user story. US1-US3 share backend infrastructure (built in Foundational). Frontend is US7. Persistence is US8.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` (Python FastAPI), `frontend/src/` (Next.js TypeScript)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add Cohere dependency and create directory structure for new modules

- [x] T001 Add `cohere>=5.20.0` to `backend/requirements.txt` and install via `pip install -r requirements.txt`
- [x] T002 [P] Create `backend/tools/__init__.py` as empty package init file
- [x] T003 [P] Add `CO_API_KEY` to `backend/.env` with the Cohere API key value, and verify `backend/.env.example` already has the placeholder

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend models, MCP tool functions, and chat endpoint — the complete backend pipeline that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add `Conversation` SQLModel class to `backend/models.py` with fields: id (str UUID PK), user_id (str indexed), created_at (datetime), updated_at (datetime). Table name: `conversations`. Use `uuid4()` default factory for id. Ref: `@specs/003-ai-chatbot/data-model.md`
- [x] T005 Add `Message` SQLModel class to `backend/models.py` with fields: id (str UUID PK), conversation_id (str FK to conversations.id, indexed), user_id (str indexed), role (str), content (str), tool_calls_json (str nullable), created_at (datetime). Table name: `messages`. Ref: `@specs/003-ai-chatbot/data-model.md`
- [x] T006 Add Pydantic request/response schemas to `backend/models.py`: `ChatRequest` (message: str 1-5000 chars, conversation_id: str optional), `ChatResponse` (response: str, tool_calls: list[ToolCallResult], conversation_id: str), `ToolCallResult` (tool: str, args: dict, result: dict), `ConversationRead`, `MessageRead`. Ref: `@specs/003-ai-chatbot/data-model.md`
- [x] T007 [P] Implement `add_task(session, user_id, title, description=None)` in `backend/tools/task_tools.py`. Create a Task via SQLModel (reuse logic from `routes/tasks.py:42-59`), return dict with id, title, description, completed, created_at. Validate title 1-200 chars, description max 1000.
- [x] T008 [P] Implement `list_tasks(session, user_id, status=None, sort=None)` in `backend/tools/task_tools.py`. Query tasks filtered by user_id, optional status (all/pending/completed) and sort (newest/oldest/title). Return list of task dicts. Reuse query logic from `routes/tasks.py:14-38`.
- [x] T009 [P] Implement `complete_task(session, user_id, task_id)` in `backend/tools/task_tools.py`. Toggle task.completed, update updated_at. Return updated task dict. Return error dict if task not found. Reuse logic from `routes/tasks.py:120-138`.
- [x] T010 [P] Implement `delete_task(session, user_id, task_id)` in `backend/tools/task_tools.py`. Delete task by id + user_id. Return `{"deleted": True, "task_id": N}`. Return error dict if not found. Reuse logic from `routes/tasks.py:103-117`.
- [x] T011 [P] Implement `update_task(session, user_id, task_id, title=None, description=None, completed=None)` in `backend/tools/task_tools.py`. Update only provided fields, set updated_at. Return updated task dict. Return error dict if not found. Reuse logic from `routes/tasks.py:79-99`.
- [x] T012 Create `backend/routes/chat.py` with: (1) `cohere.AsyncClientV2()` singleton initialized at module level (reads `CO_API_KEY` from env). (2) `COHERE_MODEL` from env with default `command-a-03-2025`. (3) `TOOLS` list containing all 5 MCP tool definitions as Cohere v2 JSON function schemas per `@specs/003-ai-chatbot/contracts/chat-endpoint.md`. (4) `TOOL_DISPATCH` dict mapping tool names to functions from `tools/task_tools.py`. (5) System prompt instructing the model it's a task management assistant that can add/list/complete/delete/update tasks.
- [x] T013 In `backend/routes/chat.py`, implement `POST /api/{user_id}/chat` async endpoint: (1) Validate JWT via `get_current_user` dependency. (2) Check URL `user_id` matches JWT `sub`, return 403 on mismatch. (3) Accept `ChatRequest` body. (4) Create or load `Conversation` from DB. (5) Load last 20 messages from DB for context. (6) Build Cohere messages array (system + history + new user message). (7) Call `await co.chat(model=MODEL, messages=messages, tools=TOOLS)`. (8) Implement iterative tool-call loop: while `response.message.tool_calls` (max 10 iterations), execute each tool via `TOOL_DISPATCH`, wrap results in Cohere document format `{"type": "document", "document": {"data": json.dumps(result)}}`, call Cohere again. (9) Collect all tool calls and results into `tool_calls_executed` list. (10) Store user message, tool messages, and assistant response as `Message` records. (11) Return `ChatResponse`. Ref: `@specs/003-ai-chatbot/research.md` R4, R5.
- [x] T014 In `backend/routes/chat.py`, add error handling: catch `cohere.errors.TooManyRequestsError` -> 429, `cohere.errors.ApiError` -> 502, connection errors -> 502, unknown tool names -> skip silently. Log errors. Ref: `@specs/003-ai-chatbot/research.md` R9.
- [x] T015 In `backend/routes/chat.py`, add `GET /api/{user_id}/conversations` endpoint: list conversations for user (newest first), validate user_id matches JWT. Return `list[ConversationRead]`.
- [x] T016 In `backend/routes/chat.py`, add `GET /api/{user_id}/conversations/{conversation_id}/messages` endpoint: list messages for a conversation, validate user_id matches JWT and conversation belongs to user. Return `list[MessageRead]`.
- [x] T017 Register chat router in `backend/main.py`: import `from routes.chat import router as chat_router`, add `app.include_router(chat_router)`.

**Checkpoint**: Backend complete. Verify with curl:
```bash
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task called Test chatbot"}'
```

---

## Phase 3: User Story 1 — Add Task via Natural Language (Priority: P1) MVP

**Goal**: Verify that "Add a task called X" creates a task in the database and returns a friendly confirmation.

**Independent Test**: Log in, open chat (curl or browser), send "Add a task called Buy groceries". Check task list page — task should appear.

### Implementation for User Story 1

- [ ] T018 [US1] Verify `add_task` tool via backend curl: send `{"message": "Add a task called Buy groceries"}` to `POST /api/{user_id}/chat`. Confirm response includes `tool_calls` with `add_task` and the created task. Confirm task exists in DB via `GET /api/tasks`.
- [ ] T019 [US1] Verify `add_task` with description: send `{"message": "Create a task: Finish report, description: Q4 sales summary"}`. Confirm both title and description are set.
- [ ] T020 [US1] Verify clarification: send `{"message": "Add task"}` (no title). Confirm chatbot asks for clarification instead of creating empty task.

**Checkpoint**: US1 validated — add_task pipeline works end-to-end via backend.

---

## Phase 4: User Story 7 — Chat UI and Conversation Display (Priority: P1)

**Goal**: Frontend chat page with message input, message list, and tool result rendering.

**Independent Test**: Navigate to /chat while logged in. Type a message, see it in the chat, receive AI response.

### Implementation for User Story 7

- [x] T021 [P] [US7] Add TypeScript types to `frontend/src/lib/types/index.ts`: `ChatResponse` (response: string, tool_calls: ToolCallResult[], conversation_id: string), `ToolCallResult` (tool: string, args: Record<string, unknown>, result: Record<string, unknown>), `ChatMessage` (id: string, role: "user" | "assistant" | "tool", content: string, tool_calls_json?: string, created_at: string), `Conversation` (id: string, user_id: string, created_at: string, updated_at: string).
- [x] T022 [P] [US7] Add chat API functions to `frontend/src/lib/api.ts`: `sendChatMessage(userId: string, message: string, conversationId?: string): Promise<ChatResponse>` calling `POST /api/{userId}/chat`; `getConversations(userId: string): Promise<Conversation[]>` calling `GET /api/{userId}/conversations`; `getMessages(userId: string, conversationId: string): Promise<ChatMessage[]>` calling `GET /api/{userId}/conversations/{conversationId}/messages`.
- [x] T023 [P] [US7] Create `frontend/src/components/features/chat/chat-input.tsx`: Client Component with text input (shadcn Input) + send button (shadcn Button). Props: `onSend(message: string)`, `disabled: boolean`. Prevent empty submission. Enter key to send. Clear input after send.
- [x] T024 [P] [US7] Create `frontend/src/components/features/chat/tool-result-card.tsx`: Client Component displaying tool execution results. Props: `toolCall: ToolCallResult`. Show tool name as badge, args summary, and result summary. Use shadcn Card styling with a distinct background (e.g., muted).
- [x] T025 [P] [US7] Create `frontend/src/components/features/chat/chat-message.tsx`: Client Component for a single message bubble. Props: `message: {role, content, tool_calls_json?}`. Style differently for user (right-aligned, primary bg) vs assistant (left-aligned, muted bg). If tool_calls_json, render `ToolResultCard` for each tool call.
- [x] T026 [US7] Create `frontend/src/components/features/chat/chat-message-list.tsx`: Client Component for scrollable message list. Props: `messages: ChatMessage[]`, `isLoading: boolean`. Auto-scroll to bottom on new messages. Show typing indicator when isLoading. Show empty state when no messages ("Start a conversation! Try 'Show my tasks' or 'Add a task called...'").
- [x] T027 [US7] Create `frontend/src/components/features/chat/chat-container.tsx`: Client Component orchestrating the chat. Manages state: messages array, conversationId, isLoading, error. On send: add user message to state, call `sendChatMessage`, add assistant response to state, update conversationId. Handle errors with toast (sonner). Compose `ChatMessageList` + `ChatInput`.
- [x] T028 [US7] Create `frontend/src/app/(protected)/chat/page.tsx`: Protected page that renders `ChatContainer`. Get userId from auth session. Pass userId to ChatContainer. Page title: "Chat Assistant".
- [x] T029 [US7] Add chat navigation link to `frontend/src/components/features/layout/header.tsx`: Add a "Chat" link in the nav bar pointing to `/chat`, next to the existing "Tasks" link. Use a message/chat icon if available.

**Checkpoint**: US7 validated — navigate to /chat, send a message, see AI response with tool results rendered.

---

## Phase 5: User Story 2 — List Tasks via Natural Language (Priority: P1)

**Goal**: "Show my tasks" / "What are my pending tasks?" returns correctly filtered task lists.

**Independent Test**: Create tasks (some completed), ask "Show my pending tasks", verify only pending returned.

### Implementation for User Story 2

- [ ] T030 [US2] Verify `list_tasks` tool via chat UI: send "Show my tasks" and confirm all tasks listed with IDs, titles, and status.
- [ ] T031 [US2] Verify filtered list: send "Show my pending tasks", confirm only pending tasks returned. Send "What have I completed?", confirm only completed tasks returned.
- [ ] T032 [US2] Verify empty state: with no tasks, send "Show my tasks", confirm chatbot says something like "You don't have any tasks yet."

**Checkpoint**: US2 validated — list and filter through chat works.

---

## Phase 6: User Story 3 — Complete Task via Natural Language (Priority: P1)

**Goal**: "Mark task 3 as done" toggles task completion status.

**Independent Test**: Create a pending task, ask chatbot to complete it, verify in task list.

### Implementation for User Story 3

- [ ] T033 [US3] Verify `complete_task` tool via chat UI: create a task, send "Mark task {id} as done", confirm completion toggled in both chat response and task list page.
- [ ] T034 [US3] Verify toggle back: send "Uncomplete task {id}", confirm task goes back to pending.
- [ ] T035 [US3] Verify not found: send "Complete task 99999", confirm chatbot says task not found.

**Checkpoint**: US3 validated — complete/uncomplete via chat works.

---

## Phase 7: User Story 4 — Delete Task via Natural Language (Priority: P2)

**Goal**: "Delete task 5" removes a task permanently.

**Independent Test**: Create a task, ask chatbot to delete it, verify it's gone from task list.

### Implementation for User Story 4

- [ ] T036 [US4] Verify `delete_task` tool via chat UI: create a task, send "Delete task {id}", confirm task removed. Check task list page — task gone.
- [ ] T037 [US4] Verify not found: send "Delete task 99999", confirm chatbot says task not found.

**Checkpoint**: US4 validated — delete via chat works.

---

## Phase 8: User Story 5 — Update Task via Natural Language (Priority: P2)

**Goal**: "Rename task 3 to X" and "Add description to task 5: Y" modify tasks.

**Independent Test**: Create a task, rename it via chat, verify title changed in task list.

### Implementation for User Story 5

- [ ] T038 [US5] Verify `update_task` tool via chat UI: create a task, send "Rename task {id} to Buy organic groceries", confirm title updated.
- [ ] T039 [US5] Verify description update: send "Add description to task {id}: Need milk and eggs", confirm description set.

**Checkpoint**: US5 validated — update via chat works.

---

## Phase 9: User Story 6 — Multi-Step Tool Chains (Priority: P2)

**Goal**: Complex commands that chain multiple tools (e.g., "Delete all completed tasks").

**Independent Test**: Create 3 completed + 2 pending tasks. Send "Delete all completed tasks". Verify only completed deleted.

### Implementation for User Story 6

- [ ] T040 [US6] Verify multi-step chain: create 3 completed and 2 pending tasks. Send "Delete all completed tasks" via chat. Confirm chatbot chains list_tasks(completed) + delete_task for each. Confirm 3 deleted, 2 pending remain. Check tool_calls in response includes list + deletes.
- [ ] T041 [US6] Verify count query: send "How many tasks do I have?", confirm chatbot calls list_tasks and responds with count.
- [ ] T042 [US6] Verify batch complete: create 3 pending tasks. Send "Complete all my pending tasks". Confirm all 3 toggled to completed.

**Checkpoint**: US6 validated — multi-step chains work correctly.

---

## Phase 10: User Story 8 — Conversation Persistence (Priority: P3)

**Goal**: Chat history persists across page refreshes; conversations scoped to user.

**Independent Test**: Send messages, refresh page, verify messages still visible.

### Implementation for User Story 8

- [x] T043 [US8] Update `frontend/src/components/features/chat/chat-container.tsx` to load conversation history on mount: call `getConversations(userId)` to get latest conversation, then `getMessages(userId, conversationId)` to populate message list. If no conversations exist, start fresh.
- [ ] T044 [US8] Verify persistence: send 3 messages in chat, refresh the page, confirm all 3 messages (user + assistant) reappear in order.
- [ ] T045 [US8] Verify user isolation: log in as User A, send a message. Log out. Log in as User B. Navigate to /chat. Confirm User B does NOT see User A's messages.

**Checkpoint**: US8 validated — conversation history persists and is user-scoped.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, UX improvements, and edge case coverage

- [x] T046 [P] Add loading/typing indicator to `frontend/src/components/features/chat/chat-message-list.tsx`: show animated dots or skeleton while waiting for AI response.
- [x] T047 [P] Add Cohere error handling to `frontend/src/components/features/chat/chat-container.tsx`: catch 429 (show "Rate limit reached. Please wait."), 502 (show "AI service temporarily unavailable."), generic errors (show "Something went wrong. Please try again.").
- [ ] T048 [P] Verify mobile responsiveness of chat UI at 320px, 375px, 768px breakpoints. Adjust Tailwind classes if needed in chat components.
- [ ] T049 Verify Phase 2 regression: login, navigate to /tasks, create/edit/delete/complete tasks via the web UI. Confirm all existing CRUD operations still work correctly with no regressions.
- [ ] T050 Verify edge case: send a non-task message (e.g., "What's the weather?"). Confirm chatbot responds conversationally but notes it can only help with tasks.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — first MVP verification
- **US7 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1
- **US2 (Phase 5)**: Depends on Phase 4 (needs chat UI) — or can verify via curl after Phase 2
- **US3 (Phase 6)**: Depends on Phase 4
- **US4 (Phase 7)**: Depends on Phase 4
- **US5 (Phase 8)**: Depends on Phase 4
- **US6 (Phase 9)**: Depends on Phases 5-8 (all tools verified)
- **US8 (Phase 10)**: Depends on Phase 4
- **Polish (Phase 11)**: Depends on all user stories

### User Story Dependencies

```
Phase 1 (Setup) ──→ Phase 2 (Foundational) ──┬──→ Phase 3 (US1: Add Task - curl)
                                               ├──→ Phase 4 (US7: Chat UI) ──┬──→ Phase 5 (US2: List)
                                               │                              ├──→ Phase 6 (US3: Complete)
                                               │                              ├──→ Phase 7 (US4: Delete)
                                               │                              ├──→ Phase 8 (US5: Update)
                                               │                              ├──→ Phase 10 (US8: Persistence)
                                               │                              └──→ Phase 9 (US6: Multi-Step)
                                               └──→ Phase 11 (Polish)
```

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel with T001
- **Phase 2**: T007, T008, T009, T010, T011 (all 5 tool functions) can run in parallel
- **Phase 2**: T004 and T005 can run in parallel (different models in same file, but sequential is safer)
- **Phase 4**: T021, T022, T023, T024, T025 can all run in parallel (different files)
- **Phase 4**: After parallel tasks, T026 → T027 → T028 sequentially (compose components)
- **Phases 5-8**: All verification phases (US2-US5) can run in parallel after Phase 4
- **Phase 11**: T046, T047, T048 can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# After T004-T006 (models), launch all 5 tool implementations in parallel:
Task T007: "Implement add_task tool in backend/tools/task_tools.py"
Task T008: "Implement list_tasks tool in backend/tools/task_tools.py"
Task T009: "Implement complete_task tool in backend/tools/task_tools.py"
Task T010: "Implement delete_task tool in backend/tools/task_tools.py"
Task T011: "Implement update_task tool in backend/tools/task_tools.py"
# Note: All in same file but independent functions — execute sequentially if LLM prefers

# After tools, create chat route:
Task T012: "Create chat.py with Cohere init + tool definitions"
Task T013: "Implement POST /api/{user_id}/chat with tool-call loop"
Task T014: "Add error handling to chat route"
Task T015: "Add GET conversations endpoint"
Task T016: "Add GET messages endpoint"
Task T017: "Register chat router in main.py"
```

## Parallel Example: Phase 4 Chat UI

```bash
# Launch all independent component files in parallel:
Task T021: "Add TypeScript types to frontend/src/lib/types/index.ts"
Task T022: "Add chat API functions to frontend/src/lib/api.ts"
Task T023: "Create chat-input.tsx"
Task T024: "Create tool-result-card.tsx"
Task T025: "Create chat-message.tsx"

# Then compose sequentially:
Task T026: "Create chat-message-list.tsx" (uses ChatMessage)
Task T027: "Create chat-container.tsx" (uses ChatMessageList + ChatInput)
Task T028: "Create chat page.tsx" (uses ChatContainer)
Task T029: "Add chat nav link to header.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1-3)

1. Complete Phase 1: Setup (3 tasks, ~5 min)
2. Complete Phase 2: Foundational (14 tasks, ~45 min)
3. Complete Phase 3: US1 verification (3 tasks, ~10 min)
4. **STOP and VALIDATE**: curl the chat endpoint, confirm add_task works
5. This proves the entire Cohere → tool → DB pipeline works

### MVP+ (Add Chat UI — Phase 4)

6. Complete Phase 4: US7 Chat UI (9 tasks, ~30 min)
7. **STOP and VALIDATE**: Browser E2E — login, /chat, send message, see response

### Full P1 Delivery (Phases 5-6)

8. Complete Phase 5-6: US2 + US3 verification (6 tasks, ~15 min)
9. All P1 stories complete

### P2 Delivery (Phases 7-9)

10. Complete Phases 7-9: US4 + US5 + US6 (7 tasks, ~20 min)
11. All P2 stories complete

### P3 + Polish (Phases 10-11)

12. Complete Phase 10: US8 persistence (3 tasks, ~15 min)
13. Complete Phase 11: Polish (5 tasks, ~15 min)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total tasks** | **50** |
| Phase 1 (Setup) | 3 |
| Phase 2 (Foundational) | 14 |
| Phase 3 (US1: Add Task) | 3 |
| Phase 4 (US7: Chat UI) | 9 |
| Phase 5 (US2: List Tasks) | 3 |
| Phase 6 (US3: Complete Task) | 3 |
| Phase 7 (US4: Delete Task) | 2 |
| Phase 8 (US5: Update Task) | 2 |
| Phase 9 (US6: Multi-Step) | 3 |
| Phase 10 (US8: Persistence) | 3 |
| Phase 11 (Polish) | 5 |
| Parallelizable tasks [P] | 16 |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Tools (T007-T011) are in the same file but independent functions — execute in sequence if preferred
- Verification tasks (Phases 3, 5-9) can be done via curl or browser after UI is built
- Commit after each phase completion
- Stop at any checkpoint to validate the feature increment
