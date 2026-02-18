# Feature Specification: AI Chatbot with Cohere Tool Use

**Feature Branch**: `003-ai-chatbot`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "Phase III AI Chatbot — conversational task management using Cohere API (Command models) with MCP tool calling, integrated into the existing full-stack todo app (FastAPI + Next.js + Neon PostgreSQL + Better Auth/JWT)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Task via Natural Language (Priority: P1)

An authenticated user opens the chat interface and types a natural language command like "Add a task called Buy groceries". The AI chatbot understands the intent, invokes the `add_task` MCP tool, persists the task in the database scoped to the user, and responds with a friendly confirmation including the task details.

**Why this priority**: This is the core proof-of-concept — if the chatbot can create a task from natural language, the tool-calling pipeline (Cohere API -> tool execution -> DB persistence -> response) is validated end-to-end.

**Independent Test**: Log in, open chat, type "Add a task called Buy groceries". Verify the task appears in both the chat response and the task list page.

**Acceptance Scenarios**:

1. **Given** an authenticated user with the chat open, **When** they type "Add a task called Buy groceries", **Then** the system creates a task with title "Buy groceries" for that user and responds with confirmation (e.g., "Done! I've added 'Buy groceries' to your tasks.").
2. **Given** an authenticated user, **When** they type "Create a task: Finish report, description: Q4 sales summary", **Then** the system creates a task with both title and description and confirms.
3. **Given** an authenticated user, **When** they type "Add task" with no title, **Then** the chatbot asks for clarification (e.g., "What would you like to call the task?") instead of creating an empty task.
4. **Given** User A's chat session, **When** a task is created, **Then** it is scoped to User A's `user_id` and does NOT appear in User B's task list.

---

### User Story 2 - List Tasks via Natural Language (Priority: P1)

An authenticated user asks the chatbot to show their tasks using natural language (e.g., "Show my tasks", "What are my pending tasks?", "List completed tasks"). The chatbot invokes the `list_tasks` MCP tool with appropriate filters and presents the results in a readable format.

**Why this priority**: Listing tasks is the most frequent read operation and validates that the chatbot can query and present filtered data.

**Independent Test**: Create several tasks (some completed, some pending). Ask "Show my pending tasks" and verify only pending tasks are returned.

**Acceptance Scenarios**:

1. **Given** a user has 5 tasks (3 pending, 2 completed), **When** they type "Show my tasks", **Then** the chatbot lists all 5 tasks with titles, status, and IDs.
2. **Given** a user has tasks, **When** they type "Show my pending tasks", **Then** only pending (not completed) tasks are returned.
3. **Given** a user has tasks, **When** they type "What have I completed?", **Then** only completed tasks are returned.
4. **Given** a user has no tasks, **When** they type "Show my tasks", **Then** the chatbot responds with a friendly empty-state message (e.g., "You don't have any tasks yet. Want to add one?").

---

### User Story 3 - Complete Task via Natural Language (Priority: P1)

An authenticated user asks the chatbot to mark a task as done (e.g., "Mark task 3 as done", "Complete Buy groceries"). The chatbot invokes the `complete_task` MCP tool, toggles the task's completion status, and confirms.

**Why this priority**: Task completion is the primary workflow action and validates write operations through the chatbot.

**Independent Test**: Create a pending task, ask the chatbot to complete it, verify it shows as completed in the task list.

**Acceptance Scenarios**:

1. **Given** a user has a pending task with ID 3, **When** they type "Mark task 3 as done", **Then** the task is toggled to completed and the chatbot confirms.
2. **Given** a user has a completed task, **When** they type "Uncomplete task 3", **Then** the task is toggled back to pending.
3. **Given** a user references a task by title ("Complete Buy groceries"), **When** there's an exact or close match, **Then** the chatbot completes that task.
4. **Given** a user references a non-existent task, **When** they type "Complete task 999", **Then** the chatbot responds with "I couldn't find that task."

---

### User Story 4 - Delete Task via Natural Language (Priority: P2)

An authenticated user asks the chatbot to delete a task (e.g., "Delete task 5", "Remove Buy groceries from my list"). The chatbot invokes the `delete_task` MCP tool and confirms deletion.

**Why this priority**: Deletion is important but less frequent than create/list/complete. The app is functional without chatbot-driven deletion (users can still delete via the task UI).

**Independent Test**: Create a task, ask the chatbot to delete it, verify it no longer appears in the task list.

**Acceptance Scenarios**:

1. **Given** a user has task ID 5, **When** they type "Delete task 5", **Then** the task is permanently removed and the chatbot confirms.
2. **Given** a user types "Delete task 999" (non-existent), **Then** the chatbot responds that the task was not found.
3. **Given** a user says "Remove all completed tasks", **Then** the chatbot chains `list_tasks(status=completed)` + `delete_task` for each, and confirms the count deleted.

---

### User Story 5 - Update Task via Natural Language (Priority: P2)

An authenticated user asks the chatbot to modify a task's title or description (e.g., "Rename task 3 to Buy organic groceries", "Add description to task 5: Need milk and eggs"). The chatbot invokes the `update_task` MCP tool.

**Why this priority**: Updates are a convenience feature; users can still edit via the task UI.

**Independent Test**: Create a task, ask the chatbot to rename it, verify the title changed in the task list.

**Acceptance Scenarios**:

1. **Given** a user has task ID 3, **When** they type "Rename task 3 to Buy organic groceries", **Then** the title is updated and confirmed.
2. **Given** a user has task ID 5, **When** they type "Add description to task 5: Need milk and eggs", **Then** the description is set and confirmed.
3. **Given** ambiguous input like "Update task", **Then** the chatbot asks for clarification (which task, what to change).

---

### User Story 6 - Multi-Step Tool Chains (Priority: P2)

The chatbot can handle complex requests that require chaining multiple tool calls in sequence (e.g., "Delete all completed tasks" requires listing completed tasks, then deleting each one). The Cohere API orchestrates multi-turn tool execution.

**Why this priority**: Multi-step chains demonstrate advanced agent capability but the app works without them (single-tool calls cover MVP).

**Independent Test**: Create 3 completed tasks and 2 pending. Say "Delete all completed tasks". Verify only the 3 completed are deleted; pending remain.

**Acceptance Scenarios**:

1. **Given** a user has completed and pending tasks, **When** they type "Delete all completed tasks", **Then** the chatbot lists completed tasks, deletes each, and reports how many were removed.
2. **Given** a user types "How many tasks do I have?", **Then** the chatbot calls `list_tasks`, counts them, and responds with the number.
3. **Given** a user types "Complete all my pending tasks", **Then** the chatbot lists pending tasks and completes each one.

---

### User Story 7 - Chat UI and Conversation Display (Priority: P1)

The frontend provides a custom chat interface where users can type messages, see AI responses, and view tool execution results. The chat is accessible from the main navigation as an authenticated page.

**Why this priority**: Without the UI, users cannot interact with the chatbot. This is the frontend counterpart to the backend chat endpoint.

**Independent Test**: Navigate to the chat page while logged in. Type a message, see it appear in the chat history, and receive an AI response within the conversation view.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they navigate to the chat page, **Then** they see a chat interface with a message input and send button.
2. **Given** a user types a message and sends it, **When** the AI responds, **Then** both the user message and AI response appear in the conversation timeline.
3. **Given** the AI executes a tool (e.g., adds a task), **When** the result is returned, **Then** the chat shows a visual indicator of the tool action and its result.
4. **Given** the Cohere API returns an error or times out, **Then** the chat displays a friendly error message (not a raw error).
5. **Given** a mobile device, **When** viewing the chat, **Then** the interface is responsive and usable.

---

### User Story 8 - Conversation Persistence (Priority: P3)

Chat messages (user inputs, AI responses, tool calls) are stored in the database so users can see their conversation history when they return. Conversations are scoped to the authenticated user.

**Why this priority**: Persistence is a nice-to-have for UX but the chatbot is fully functional without it (stateless request/response works for MVP).

**Independent Test**: Send a few chat messages, refresh the page, verify previous messages are still visible.

**Acceptance Scenarios**:

1. **Given** a user has sent messages previously, **When** they open the chat page, **Then** they see their previous conversation history.
2. **Given** User A's conversation, **When** User B logs in, **Then** User B does NOT see User A's messages.
3. **Given** a user wants a fresh start, **When** they start a new conversation, **Then** previous messages remain in the old conversation (not deleted).

---

### Edge Cases

- What happens when the Cohere API is unreachable? The backend returns a 502/503 with a user-friendly message; the chat UI shows "I'm having trouble connecting right now. Please try again."
- What happens when the Cohere API rate limits the request? The backend returns 429; the chat UI shows a rate-limit message with retry guidance.
- What happens when the user sends an empty message? The frontend prevents submission (client-side validation).
- What happens when the AI response doesn't include a tool call? The chatbot responds conversationally (general chat without tool execution).
- What happens when a tool call fails (e.g., DB error during task creation)? The tool returns an error result to Cohere, which generates a user-friendly failure message.
- What happens when the user's JWT expires mid-conversation? The frontend detects 401, signs out, and redirects to login.
- What happens with very long messages (>5000 chars)? The backend truncates or rejects with 422.
- What happens when the Cohere model hallucinates a non-existent tool? The backend ignores unknown tool calls and returns a generic response.
- What happens when the user asks something unrelated to tasks (e.g., "What's the weather?")? The chatbot responds conversationally but notes it can only help with task management.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `POST /api/{user_id}/chat` endpoint that accepts a JSON body with `message` (string, required) and `conversation_id` (string, optional).
- **FR-002**: System MUST verify the JWT token on the chat endpoint and extract `user_id` from the `sub` claim. The URL `{user_id}` MUST match the JWT `sub`; mismatches return 403.
- **FR-003**: System MUST call the Cohere Chat API (Command model) with the user's message and MCP tool definitions.
- **FR-004**: System MUST define the following MCP tools as Cohere-compatible function schemas:
  - `add_task(title: str, description: str | None)` — creates a task
  - `list_tasks(status: str | None, sort: str | None)` — lists tasks
  - `complete_task(task_id: int)` — toggles task completion
  - `delete_task(task_id: int)` — deletes a task
  - `update_task(task_id: int, title: str | None, description: str | None, completed: bool | None)` — updates a task
- **FR-005**: System MUST execute tool calls returned by Cohere against the database using existing CRUD logic, scoped to the authenticated `user_id`.
- **FR-006**: System MUST support multi-step tool chains via iterative Cohere API calls (call -> tool result -> call again until no more tool calls).
- **FR-007**: System MUST return a JSON response from the chat endpoint containing: `response` (AI text), `tool_calls` (list of executed tools and results), and `conversation_id`.
- **FR-008**: System MUST store chat messages in the database: `conversations` table (id, user_id, created_at, updated_at) and `messages` table (id, conversation_id, user_id, role, content, tool_calls_json, created_at).
- **FR-009**: System MUST scope all conversation and message queries to the authenticated `user_id`.
- **FR-010**: System MUST handle Cohere API errors (timeouts, rate limits, server errors) gracefully, returning structured error responses.
- **FR-011**: Frontend MUST provide a custom chat component at `/chat` (protected route) with message input, send button, message list, and tool-result indicators.
- **FR-012**: Frontend MUST send chat messages via the centralized API client (`/lib/api.ts`) with JWT attached.
- **FR-013**: Frontend MUST display conversation history loaded from the backend on page load.
- **FR-014**: Frontend MUST handle loading states (typing indicator while waiting for AI), error states, and empty states.
- **FR-015**: System MUST NOT use any OpenAI SDK, API, or UI components. Cohere API is the sole LLM provider.
- **FR-016**: All tool executions MUST be stateless — each tool call is an independent DB operation with no server-side session state.
- **FR-017**: System MUST use the `cohere` Python package with the `CO_API_KEY` environment variable.
- **FR-018**: Chat UI MUST be responsive (mobile-first Tailwind CSS).
- **FR-019**: System MUST add `cohere` to `backend/requirements.txt`.
- **FR-020**: Frontend MUST include a navigation link to the chat page from the main header.

### Key Entities

- **Conversation**: Represents a chat session. Attributes: id (UUID, PK), user_id (string, FK to auth user), created_at (timestamp), updated_at (timestamp). A conversation belongs to one user and has many messages.
- **Message**: Represents a single chat message. Attributes: id (UUID, PK), conversation_id (UUID, FK to conversations.id), user_id (string, indexed), role (enum: "user", "assistant", "tool"), content (text), tool_calls_json (JSON, nullable — stores tool name + args + result for tool-type messages), created_at (timestamp). A message belongs to one conversation.
- **Task** (existing): Unchanged from Phase 2. MCP tools wrap the existing Task CRUD logic.

### Database Schema Additions

```
conversations
  id            UUID        PK, default uuid_generate_v4()
  user_id       VARCHAR     NOT NULL, indexed
  created_at    TIMESTAMP   NOT NULL, default now()
  updated_at    TIMESTAMP   NOT NULL, default now()

messages
  id                UUID        PK, default uuid_generate_v4()
  conversation_id   UUID        FK -> conversations.id, NOT NULL
  user_id           VARCHAR     NOT NULL, indexed
  role              VARCHAR     NOT NULL  ("user" | "assistant" | "tool")
  content           TEXT        NOT NULL
  tool_calls_json   JSONB       NULLABLE
  created_at        TIMESTAMP   NOT NULL, default now()

Indexes:
  ix_conversations_user_id    ON conversations(user_id)
  ix_messages_conversation_id ON messages(conversation_id)
  ix_messages_user_id         ON messages(user_id)
```

### API Contract: Chat Endpoint

**`POST /api/{user_id}/chat`**

Request:
```json
{
  "message": "Add a task called Buy groceries",
  "conversation_id": "optional-uuid-or-null"
}
```

Response: `200 OK`
```json
{
  "response": "Done! I've added 'Buy groceries' to your tasks.",
  "tool_calls": [
    {
      "tool": "add_task",
      "args": { "title": "Buy groceries" },
      "result": { "id": 7, "title": "Buy groceries", "completed": false }
    }
  ],
  "conversation_id": "uuid-of-conversation"
}
```

Error responses:
- `401 Unauthorized` — missing/invalid JWT
- `403 Forbidden` — URL user_id doesn't match JWT sub
- `422 Unprocessable Entity` — missing message field or message too long
- `502 Bad Gateway` — Cohere API unreachable
- `429 Too Many Requests` — Cohere rate limit hit

### Cohere Tool Definitions

Tools are declared as Cohere-compatible function schemas passed to the Chat API:

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task for the user",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Task title (required, 1-200 chars)"},
                    "description": {"type": "string", "description": "Optional task description (max 1000 chars)"}
                },
                "required": ["title"]
            }
        }
    },
    # ... list_tasks, complete_task, delete_task, update_task
]
```

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can add, list, complete, delete, and update tasks via natural language in the chat interface — all 5 MCP tools function correctly.
- **SC-002**: All chat requests are authenticated via JWT. Unauthenticated requests receive 401. User ID mismatches receive 403.
- **SC-003**: User A's chat and tasks are invisible to User B — complete user isolation.
- **SC-004**: Multi-step tool chains (e.g., "delete all completed tasks") execute correctly with the right number of tool calls.
- **SC-005**: Chat responses return within 5 seconds for single-tool operations (excluding Cohere API latency spikes).
- **SC-006**: Cohere API errors are caught and surfaced as user-friendly messages in the chat UI.
- **SC-007**: Conversation history persists across page refreshes for the same user.
- **SC-008**: The chat UI is responsive and usable on mobile devices (320px+ width).
- **SC-009**: No OpenAI dependencies exist in the project — `cohere` is the sole LLM package.
- **SC-010**: The existing task CRUD (Phase 2 web UI) continues to function without regression.

## Assumptions

- The Cohere API key (`CO_API_KEY`) is valid and has access to Command models with tool-use capability.
- The Cohere `chat` endpoint supports tool/function calling (available in Command R+ and later models).
- The existing `tasks` table schema is unchanged; MCP tools are thin wrappers around existing CRUD logic in `routes/tasks.py`.
- The Better Auth JWT flow from Phase 2 is fully functional and issues valid tokens with `sub` claims.
- Conversation history is optional for MVP — the chat is functional in stateless mode (history managed client-side) while persistence is a P3 enhancement.
- The `cohere` Python SDK provides a synchronous or async client compatible with FastAPI's async endpoints.
- Tool call results from DB operations are serializable to JSON for passing back to Cohere as tool results.

## Compatibility Notes

- **Phase 2 backward compatibility**: All existing `/api/tasks` endpoints remain unchanged. The chat endpoint is additive (`/api/{user_id}/chat`).
- **Frontend**: The chat page is a new route (`/chat`) added to the `(protected)` route group. Existing task pages are untouched.
- **Backend**: The chat router is registered alongside the existing task router in `main.py`. No modifications to `routes/tasks.py` are required — MCP tools call the same DB logic directly.
- **Database**: New `conversations` and `messages` tables are created on startup via SQLModel alongside the existing `tasks` table. No migration needed (SQLModel `create_all`).
