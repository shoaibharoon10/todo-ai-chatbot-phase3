# Implementation Plan: AI Chatbot with Cohere Tool Use

**Branch**: `003-ai-chatbot` | **Date**: 2026-02-18 | **Spec**: `@specs/003-ai-chatbot/spec.md`
**Input**: Feature specification from `/specs/003-ai-chatbot/spec.md`

## Summary

Integrate an AI chatbot into the existing full-stack todo app using Cohere's v2 Chat API with tool calling. The chatbot enables natural language task management (add, list, complete, delete, update tasks) through 5 MCP tools executed via an iterative tool-call loop. Backend uses FastAPI with `cohere.AsyncClientV2`; frontend adds a custom chat page with shadcn/ui components. Conversation history persisted in PostgreSQL via new `conversations` and `messages` tables.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, SQLModel, `cohere` v5.20+ (AsyncClientV2), Next.js 16, Tailwind CSS 4, shadcn/ui
**Storage**: Neon Serverless PostgreSQL via `DATABASE_URL`; new tables: `conversations`, `messages`
**Testing**: Manual E2E (chat endpoint + UI); curl for API contract verification
**Target Platform**: Web application (desktop + mobile responsive)
**Project Type**: Web application (monorepo: frontend + backend)
**Performance Goals**: Single-tool chat responses < 5s; multi-step chains < 15s
**Constraints**: Cohere API latency (2-5s per call); max 10 tool iterations per request; max 20 messages history sent to Cohere per request
**Scale/Scope**: Single-user demo app; ~8 new backend files, ~8 new frontend files, ~5 modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Spec-First Development | Spec exists at `specs/003-ai-chatbot/spec.md` | PASS |
| II | User Isolation | All tools scoped to `user_id` from JWT; chat endpoint validates `{user_id}` matches JWT `sub` | PASS |
| III | Stateless JWT Auth | Chat endpoint uses same `get_current_user` dependency; adds 403 for user_id mismatch | PASS |
| IV | Immutable Tech Stack | Uses Cohere API (Command models) — no OpenAI. Custom chat UI — no ChatKit. All other stack unchanged. | PASS |
| V | API-First Design | Chat endpoint: `POST /api/{user_id}/chat`. RESTful, JSON, Pydantic models. | PASS |
| VI | Quality & Responsiveness | Chat UI responsive (Tailwind mobile-first). Error handling for Cohere API failures. Tool test coverage. | PASS |
| VII | AI Chatbot Architecture | Cohere v2 API, MCP tools as skills, orchestrator pattern with iterative tool-call loop, stateless. | PASS |

**All gates pass. No violations.**

## Project Structure

### Documentation (this feature)

```text
specs/003-ai-chatbot/
├── plan.md              # This file
├── research.md          # Phase 0 output — Cohere API research
├── data-model.md        # Phase 1 output — Conversation, Message entities
├── quickstart.md        # Phase 1 output — setup guide
├── contracts/
│   └── chat-endpoint.md # Phase 1 output — full API contract
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── main.py              # MODIFY: register chat router
├── models.py            # MODIFY: add Conversation, Message, Pydantic schemas
├── db.py                # UNCHANGED
├── auth.py              # UNCHANGED
├── requirements.txt     # MODIFY: add cohere>=5.20.0
├── routes/
│   ├── __init__.py      # UNCHANGED
│   ├── tasks.py         # UNCHANGED
│   └── chat.py          # NEW: chat endpoint with Cohere integration
└── tools/
    ├── __init__.py      # NEW: package init
    └── task_tools.py    # NEW: MCP tool implementations

frontend/
├── src/
│   ├── app/
│   │   └── (protected)/
│   │       ├── tasks/           # UNCHANGED
│   │       └── chat/
│   │           └── page.tsx     # NEW: chat page
│   ├── components/
│   │   └── features/
│   │       ├── tasks/           # UNCHANGED
│   │       ├── layout/
│   │       │   └── header.tsx   # MODIFY: add chat nav link
│   │       └── chat/
│   │           ├── chat-container.tsx    # NEW: chat layout wrapper
│   │           ├── chat-message-list.tsx # NEW: scrollable messages
│   │           ├── chat-message.tsx      # NEW: message bubble
│   │           ├── chat-input.tsx        # NEW: input + send
│   │           └── tool-result-card.tsx  # NEW: tool result display
│   └── lib/
│       ├── api.ts               # MODIFY: add chat API functions
│       └── types/
│           └── index.ts         # MODIFY: add chat types
```

**Structure Decision**: Extends existing monorepo structure. Backend gets a new `tools/` package for MCP tool functions (separated from routes for clean dependency — tools operate on sessions directly, not via HTTP). Frontend gets a new `chat/` feature component group following existing `tasks/` pattern.

## Architecture Decisions

### AD1: Cohere AsyncClientV2 as Singleton

**Decision**: Initialize `cohere.AsyncClientV2()` once at module level in `routes/chat.py`. It reads `CO_API_KEY` from environment automatically.

**Rationale**: FastAPI reuses the module across requests. A single client instance reuses HTTP connections (connection pooling). No need for dependency injection — the client is stateless.

**Reference**: `backend/routes/chat.py:1-5` (to be created)

### AD2: MCP Tools as Direct DB Functions (Not HTTP Self-Calls)

**Decision**: MCP tool functions in `tools/task_tools.py` accept `session: Session` and `user_id: str` as parameters and perform DB operations directly using SQLModel. They do NOT call the REST API endpoints.

**Rationale**: HTTP self-calls would add latency, require auth token forwarding, and create circular dependency risks. Direct DB access is simpler and faster. The tool functions mirror the route handler logic but are callable programmatically.

**Impact**: Slight code duplication between `routes/tasks.py` handlers and `tools/task_tools.py`. Acceptable for 5 thin functions (~10 lines each). Refactoring into a shared service layer is over-engineering for this scope.

### AD3: Iterative Tool-Call Loop with Max Iterations

**Decision**: The chat endpoint runs a `while response.message.tool_calls` loop, capped at 10 iterations. Each iteration executes all tool calls from that response, sends results back to Cohere, and gets the next response.

**Rationale**: Multi-step chains (e.g., "delete all completed tasks" = list + N deletes) require multiple Cohere calls. Cap at 10 prevents infinite loops from model confusion. 10 iterations supports chains of up to ~30 tool calls (3 per iteration average), which covers all realistic use cases.

### AD4: Conversation History from DB (Not Client-Side)

**Decision**: When `conversation_id` is provided, the backend loads the last 20 messages from DB and includes them in the Cohere API call for context. New messages are stored after each exchange.

**Rationale**: This keeps the frontend simple (just sends message + conversation_id) while giving Cohere conversation context. The 20-message cap keeps the Cohere request within reasonable token limits (~4000 tokens of context). Older messages are still in DB for frontend display but not sent to Cohere.

### AD5: User ID Validation on Chat Endpoint

**Decision**: The chat endpoint checks that the URL `{user_id}` matches the JWT `sub` claim, returning 403 Forbidden on mismatch. This is in addition to the standard JWT verification.

**Rationale**: Constitution Principle II requires this. The existing task endpoints under `/api/tasks` don't have `{user_id}` in the URL (user comes from JWT only). The chat endpoint at `/api/{user_id}/chat` has the URL parameter per constitution Principle V, so the mismatch check is needed.

### AD6: Cohere Model Selection

**Decision**: Use `command-a-03-2025` as primary model. Configurable via `COHERE_MODEL` env var with that default.

**Rationale**: Latest Cohere model with best tool-use accuracy. Making it configurable allows fallback to `command-r-plus-08-2024` without code changes.

## Implementation Phases

### Phase A: Backend Foundation (models + tools)

1. Add `Conversation` and `Message` SQLModel classes to `models.py`
2. Add Pydantic schemas: `ChatRequest`, `ChatResponse`, `ToolCallResult`, `ConversationRead`, `MessageRead`
3. Add `cohere>=5.20.0` to `requirements.txt`
4. Create `tools/__init__.py` and `tools/task_tools.py` with 5 MCP tool functions
5. Verify: import tools, run tool functions with a test session

### Phase B: Backend Chat Endpoint

1. Create `routes/chat.py` with:
   - Cohere AsyncClientV2 initialization
   - Tool definitions array
   - Tool dispatch map (name -> function)
   - `POST /api/{user_id}/chat` handler with tool-call loop
   - Conversation/message persistence
   - Error handling (Cohere errors -> HTTP errors)
2. Register chat router in `main.py`
3. Add conversation list and message history endpoints
4. Verify: curl chat endpoint with JWT, confirm tool execution and response

### Phase C: Frontend Chat UI

1. Add TypeScript types for `ChatResponse`, `Conversation`, `Message`
2. Add API functions: `sendChatMessage`, `getConversations`, `getMessages`
3. Create chat components: `ChatContainer`, `ChatMessageList`, `ChatMessage`, `ChatInput`, `ToolResultCard`
4. Create chat page at `(protected)/chat/page.tsx`
5. Add chat link to header navigation
6. Verify: full E2E — login, navigate to chat, send message, see response

### Phase D: Polish & Edge Cases

1. Handle Cohere API errors gracefully in UI
2. Add loading/typing indicator
3. Add empty state for new conversations
4. Mobile responsiveness testing
5. Verify: error scenarios, mobile layout, multi-step chains

## Complexity Tracking

> No constitution violations. No complexity justifications needed.

| Aspect | Complexity | Justification |
|--------|-----------|---------------|
| New tables (2) | Low | Simple schema, no migrations needed (SQLModel create_all) |
| Cohere integration | Medium | Well-documented v2 API; async client; iterative loop pattern |
| MCP tools (5) | Low | Thin wrappers around existing CRUD logic |
| Chat UI | Medium | Custom component; no library to learn; follows existing patterns |
| Total new files | ~16 | Spread across backend (3) and frontend (6), plus specs (5) |

## Risks & Mitigations

1. **Cohere API latency** — Chat responses may feel slow (2-5s per API call, worse for multi-step). Mitigation: typing indicator in UI; consider streaming in future.
2. **Cohere model accuracy** — Model may misinterpret commands or call wrong tools. Mitigation: clear tool descriptions; system prompt constraining behavior; ignore unknown tool calls.
3. **Rate limiting** — Cohere free tier may have strict rate limits. Mitigation: 429 handling in both backend and frontend; user-friendly retry message.
