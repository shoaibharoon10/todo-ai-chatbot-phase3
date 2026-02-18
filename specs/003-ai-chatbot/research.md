# Research: AI Chatbot with Cohere Tool Use

**Feature**: 003-ai-chatbot | **Date**: 2026-02-18

## Research Summary

All NEEDS CLARIFICATION items from technical context resolved. No open questions remain.

---

## R1: Cohere Python SDK — Package and Version

**Decision**: Use `cohere` v5.20+ (latest) with the **v2 API** (`ClientV2` / `AsyncClientV2`).

**Rationale**: The v2 API is Cohere's current recommended API for all new projects. It supports tool use with a JSON schema format identical to OpenAI's function-calling convention, making tool definitions portable. The package auto-reads `CO_API_KEY` from environment.

**Alternatives considered**:
- v1 API (`cohere.Client`) — deprecated for tool use, uses different tool format
- Raw HTTP calls to Cohere REST API — unnecessary when SDK exists
- OpenAI SDK — prohibited by constitution

---

## R2: Cohere Chat Model for Tool Use

**Decision**: Use `command-a-03-2025` (Command A, March 2025) as the primary model.

**Rationale**: This is Cohere's latest and most capable model for tool use and agentic workflows. It has the best instruction-following and tool-calling accuracy.

**Alternatives considered**:
- `command-r-plus-08-2024` — capable but older, less accurate tool calling
- `command-r-08-2024` — lighter model, suitable for fallback but less reliable for multi-step chains
- `command-r` / `command-r-plus` — original versions, superseded

**Fallback**: If `command-a-03-2025` is unavailable (key tier), fall back to `command-r-plus-08-2024`.

---

## R3: Tool Definition Format

**Decision**: Use OpenAI-compatible JSON function schemas (Cohere v2 native format).

**Format**:
```python
{
    "type": "function",
    "function": {
        "name": "tool_name",
        "description": "What the tool does",
        "parameters": {
            "type": "object",
            "properties": {
                "param1": {"type": "string", "description": "..."},
                "param2": {"type": "integer", "description": "..."}
            },
            "required": ["param1"]
        }
    }
}
```

**Rationale**: This is the v2 native format. No conversion needed. Max 200 fields across all tools per call (well within our 5-tool, ~15-field budget).

---

## R4: Tool-Call Loop Pattern

**Decision**: Implement an iterative while-loop pattern for multi-step tool chains.

**Pattern**:
```
1. Send user message + tools to Cohere
2. While response has tool_calls:
   a. Append assistant message (with tool_calls) to history
   b. Execute each tool call, collect results
   c. Append tool results as role="tool" messages
   d. Call Cohere again with updated history
3. Return final text response
```

**Key implementation detail — tool result format (Cohere-specific)**:
```python
{
    "role": "tool",
    "tool_call_id": tc.id,
    "content": [
        {"type": "document", "document": {"data": json.dumps(result)}}
    ]
}
```

The `document` wrapper is **Cohere-specific** and differs from OpenAI's plain string content. This is critical for correct tool result ingestion.

**Rationale**: This is Cohere's documented pattern. The while-loop supports arbitrary chain depth (list -> delete each, etc.). Max iterations should be capped at 10 to prevent infinite loops.

---

## R5: Async Support for FastAPI

**Decision**: Use `cohere.AsyncClientV2` for all chat endpoint calls.

**Rationale**: FastAPI is async-native. Using the sync client would block the event loop during Cohere API calls (which can take 2-5 seconds). The async client has an identical interface — just `await` each call.

**Initialization**:
```python
import cohere
co = cohere.AsyncClientV2()  # reads CO_API_KEY from env
```

**Note**: Can also be used as async context manager: `async with cohere.AsyncClientV2() as co:`

---

## R6: MCP Tool Implementation Strategy

**Decision**: MCP tools are plain Python functions that reuse existing CRUD logic from `routes/tasks.py` but operate on the SQLModel session directly (no HTTP calls).

**Rationale**: The existing route handlers (`create_task`, `list_tasks`, etc.) use `Depends(get_session)` and `Depends(get_current_user)`. MCP tools need the same DB access but are called programmatically (not via HTTP). Extracting the core logic into shared functions (or calling the session directly) avoids circular imports and HTTP overhead.

**Approach**: Create `backend/tools/task_tools.py` with functions that accept `session` and `user_id` as parameters. Each function performs the DB operation and returns a serializable dict. The chat route handler provides the session and user_id from its own dependency injection.

**Alternatives considered**:
- HTTP self-calls (POST to /api/tasks from chat handler) — adds latency, complicates auth
- Importing route handler functions directly — they depend on FastAPI DI, not cleanly callable
- Shared service layer — over-engineering for 5 thin functions

---

## R7: Conversation History Management

**Decision**: Hybrid approach — persist messages in DB (P3 enhancement), but send recent history to Cohere with each request for context.

**Rationale**: The constitution mandates stateless architecture (no server-side session state). Each chat request must be self-contained. However, for multi-turn conversations, the frontend sends the `conversation_id`, and the backend loads recent messages from DB to build the Cohere message history. This gives conversation continuity without server-side sessions.

**Implementation**:
1. Frontend sends `{ message, conversation_id }`
2. Backend loads last N messages for that conversation from DB
3. Appends new user message
4. Sends full history to Cohere
5. Stores assistant response + tool results in DB
6. Returns response to frontend

**Max history**: Cap at 20 messages to stay within Cohere's context window and keep latency manageable.

---

## R8: Frontend Chat UI Approach

**Decision**: Custom React Client Component using existing Tailwind + shadcn patterns. No third-party chat libraries.

**Rationale**: Constitution Principle IV prohibits third-party chat UI kits. The existing project uses shadcn/ui components (Button, Input, Card, etc.) which provide sufficient building blocks.

**Components**:
- `ChatPage` — page component at `/chat`
- `ChatContainer` — layout wrapper (message list + input)
- `ChatMessageList` — scrollable message display
- `ChatMessage` — individual message bubble (user/assistant/tool)
- `ChatInput` — text input + send button
- `ToolResultCard` — visual indicator for tool execution results

---

## R9: Error Handling Strategy

**Decision**: Catch Cohere SDK exceptions at the chat route level; map to appropriate HTTP status codes.

**Mapping**:
| Cohere Error | HTTP Status | User Message |
|---|---|---|
| `cohere.errors.TooManyRequestsError` | 429 | "Rate limit reached. Please wait a moment." |
| `cohere.errors.ApiError` (5xx) | 502 | "AI service temporarily unavailable." |
| `cohere.errors.AuthenticationError` | 500 | "AI service configuration error." (log internally) |
| Connection timeout | 502 | "Could not reach AI service." |
| Unknown tool name in response | (ignore) | Respond without that tool's result |
| Tool execution DB error | (continue) | Return error to Cohere for user-friendly message |

**Max tool iterations**: 10 (prevent infinite loops from model repeatedly calling tools).
