# Data Model: AI Chatbot

**Feature**: 003-ai-chatbot | **Date**: 2026-02-18

## Entities

### Conversation (SQLModel table — NEW)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | str (UUID) | Primary Key | Generated via `uuid4()` |
| user_id | str | Not null, indexed | Better Auth user ID from JWT `sub` claim |
| created_at | datetime | Not null, auto-set | UTC timestamp, set on creation |
| updated_at | datetime | Not null, auto-set | UTC timestamp, updated on every new message |

**Table name**: `conversations`

**Indexes**:
- `ix_conversations_user_id` on `user_id` — fast user-scoped conversation listing

**SQLModel definition**:
```python
class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

---

### Message (SQLModel table — NEW)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | str (UUID) | Primary Key | Generated via `uuid4()` |
| conversation_id | str (UUID) | Not null, FK -> conversations.id, indexed | Parent conversation |
| user_id | str | Not null, indexed | Denormalized for fast user-scoped queries |
| role | str | Not null | One of: "user", "assistant", "tool" |
| content | str (text) | Not null | Message text content |
| tool_calls_json | str (JSON) \| None | Nullable | JSON-serialized tool calls + results |
| created_at | datetime | Not null, auto-set | UTC timestamp |

**Table name**: `messages`

**Indexes**:
- `ix_messages_conversation_id` on `conversation_id` — fast message listing by conversation
- `ix_messages_user_id` on `user_id` — fast user-scoped message queries

**SQLModel definition**:
```python
class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    conversation_id: str = Field(foreign_key="conversations.id", index=True, nullable=False)
    user_id: str = Field(index=True, nullable=False)
    role: str = Field(nullable=False)  # "user" | "assistant" | "tool"
    content: str = Field(nullable=False)
    tool_calls_json: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

---

### Task (existing — UNCHANGED)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int | Primary Key, auto-increment | Database-generated |
| user_id | str | Not null, indexed | Better Auth user ID from JWT `sub` claim |
| title | str | Not null, 1-200 chars | Validated at API layer via Pydantic |
| description | str \| None | Nullable, max 1000 chars | Optional task details |
| completed | bool | Not null, default False | Toggled via PATCH endpoint |
| created_at | datetime | Not null, auto-set | UTC timestamp |
| updated_at | datetime | Not null, auto-set | UTC timestamp |

**Table name**: `tasks` (set via `__tablename__ = "tasks"`)

No changes to existing Task model.

---

## Pydantic Request/Response Schemas

### ChatRequest (POST /api/{user_id}/chat request body)

```
message: str             # Required, 1-5000 characters
conversation_id: str?    # Optional UUID — omit for new conversation
```

### ChatResponse (POST /api/{user_id}/chat response body)

```
response: str                    # AI-generated text response
tool_calls: list[ToolCallResult] # List of executed tool calls (may be empty)
conversation_id: str             # UUID of the conversation
```

### ToolCallResult (nested in ChatResponse)

```
tool: str          # Tool name (e.g., "add_task")
args: dict         # Arguments passed to the tool
result: dict       # Tool execution result
```

### ConversationRead (for listing conversations)

```
id: str
user_id: str
created_at: str    # ISO 8601
updated_at: str    # ISO 8601
```

### MessageRead (for loading conversation history)

```
id: str
conversation_id: str
role: str          # "user" | "assistant" | "tool"
content: str
tool_calls_json: dict | None
created_at: str    # ISO 8601
```

## Relationships

```
User (1) ──── has many ───→ Conversation (N)
  │                            │
  │                            └── has many ──→ Message (N)
  │
  └──── has many ───→ Task (N)

Conversation (1) ──── has many ───→ Message (N)
```

## State Transitions

```
Conversation lifecycle:
  Created (first chat message) → id assigned, created_at=now
  Updated (each new message)   → updated_at=now
  No deletion endpoint in MVP

Message lifecycle:
  Created (on each chat exchange) → role + content set, created_at=now
  Immutable after creation (no updates or deletes)

  Message flow per chat request:
    1. Store user message (role="user")
    2. Execute tool calls if any (role="tool" per tool result)
    3. Store assistant response (role="assistant")
```
