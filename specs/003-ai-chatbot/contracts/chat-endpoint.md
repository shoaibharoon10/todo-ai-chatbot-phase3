# API Contract: Chat Endpoint

**Base URL**: `http://localhost:8000`
**Auth**: Requires `Authorization: Bearer <jwt-token>` header
**Feature**: 003-ai-chatbot | **Date**: 2026-02-18

## Authentication

Same as task endpoints:
```
Authorization: Bearer <jwt-token>
```

JWT verified with:
- Algorithm: HS256
- Secret: `BETTER_AUTH_SECRET` env var (must match frontend's `JWT_SECRET_KEY`)
- Required claims: `sub` (user_id), `iss` ("taskflow-web"), `aud` ("taskflow-api")
- Expiry: Enforced by PyJWT (30m tokens from frontend)

**Additional check**: The `{user_id}` in the URL path MUST match the JWT `sub` claim. Mismatch returns 403.

---

## Endpoints

### POST /api/{user_id}/chat

Send a natural language message to the AI chatbot. The backend calls Cohere's Chat API with MCP tool definitions, executes any tool calls, and returns the AI response.

**Path Parameters**: `user_id` (string) — must match JWT `sub` claim

**Request Body**:
```json
{
  "message": "Add a task called Buy groceries",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| message | string | Yes | 1-5000 characters |
| conversation_id | string (UUID) | No | If omitted, a new conversation is created |

**Response**: `200 OK`
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
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Response Field | Type | Description |
|---|---|---|
| response | string | AI-generated text response |
| tool_calls | array | List of tool calls executed (empty if none) |
| tool_calls[].tool | string | Tool name |
| tool_calls[].args | object | Arguments passed to the tool |
| tool_calls[].result | object | Tool execution result |
| conversation_id | string (UUID) | ID of the conversation (new or existing) |

**No tool calls** (conversational response):
```json
{
  "response": "I'm your task management assistant! I can help you add, list, complete, update, or delete tasks. What would you like to do?",
  "tool_calls": [],
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Multi-tool chain** (e.g., "delete all completed tasks"):
```json
{
  "response": "Done! I deleted 3 completed tasks: 'Buy milk', 'Send email', and 'Clean desk'.",
  "tool_calls": [
    {
      "tool": "list_tasks",
      "args": { "status": "completed" },
      "result": [
        { "id": 2, "title": "Buy milk", "completed": true },
        { "id": 5, "title": "Send email", "completed": true },
        { "id": 8, "title": "Clean desk", "completed": true }
      ]
    },
    { "tool": "delete_task", "args": { "task_id": 2 }, "result": { "deleted": true } },
    { "tool": "delete_task", "args": { "task_id": 5 }, "result": { "deleted": true } },
    { "tool": "delete_task", "args": { "task_id": 8 }, "result": { "deleted": true } }
  ],
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### GET /api/{user_id}/conversations

List conversations for the authenticated user (most recent first).

**Path Parameters**: `user_id` (string)

**Response**: `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "abc123",
    "created_at": "2026-02-18T10:00:00",
    "updated_at": "2026-02-18T10:05:00"
  }
]
```

---

### GET /api/{user_id}/conversations/{conversation_id}/messages

Load message history for a conversation.

**Path Parameters**: `user_id` (string), `conversation_id` (string UUID)

**Response**: `200 OK`
```json
[
  {
    "id": "msg-uuid-1",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "user",
    "content": "Add a task called Buy groceries",
    "tool_calls_json": null,
    "created_at": "2026-02-18T10:00:00"
  },
  {
    "id": "msg-uuid-2",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "assistant",
    "content": "Done! I've added 'Buy groceries' to your tasks.",
    "tool_calls_json": "[{\"tool\": \"add_task\", \"args\": {\"title\": \"Buy groceries\"}, \"result\": {\"id\": 7}}]",
    "created_at": "2026-02-18T10:00:01"
  }
]
```

---

## MCP Tool Definitions

These are passed to Cohere's Chat API as the `tools` parameter:

### add_task

```json
{
  "type": "function",
  "function": {
    "name": "add_task",
    "description": "Create a new task for the user. Returns the created task with its ID.",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Task title (required, 1-200 characters)"
        },
        "description": {
          "type": "string",
          "description": "Optional task description (max 1000 characters)"
        }
      },
      "required": ["title"]
    }
  }
}
```

### list_tasks

```json
{
  "type": "function",
  "function": {
    "name": "list_tasks",
    "description": "List the user's tasks. Can filter by status and sort order. Returns an array of tasks.",
    "parameters": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["all", "pending", "completed"],
          "description": "Filter by completion status. Default: all"
        },
        "sort": {
          "type": "string",
          "enum": ["newest", "oldest", "title"],
          "description": "Sort order. Default: newest first"
        }
      },
      "required": []
    }
  }
}
```

### complete_task

```json
{
  "type": "function",
  "function": {
    "name": "complete_task",
    "description": "Toggle a task's completion status. If pending, marks it completed. If completed, marks it pending. Returns the updated task.",
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "integer",
          "description": "The ID of the task to toggle"
        }
      },
      "required": ["task_id"]
    }
  }
}
```

### delete_task

```json
{
  "type": "function",
  "function": {
    "name": "delete_task",
    "description": "Permanently delete a task. Returns confirmation of deletion.",
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "integer",
          "description": "The ID of the task to delete"
        }
      },
      "required": ["task_id"]
    }
  }
}
```

### update_task

```json
{
  "type": "function",
  "function": {
    "name": "update_task",
    "description": "Update a task's title, description, or completion status. Only provided fields are changed. Returns the updated task.",
    "parameters": {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "integer",
          "description": "The ID of the task to update"
        },
        "title": {
          "type": "string",
          "description": "New title (1-200 characters)"
        },
        "description": {
          "type": "string",
          "description": "New description (max 1000 characters)"
        },
        "completed": {
          "type": "boolean",
          "description": "Set completion status directly"
        }
      },
      "required": ["task_id"]
    }
  }
}
```

---

## Error Responses

| Status | Meaning | When |
|--------|---------|------|
| 401 | Unauthorized | Missing, invalid, expired, or malformed JWT |
| 403 | Forbidden | URL `user_id` doesn't match JWT `sub` claim |
| 404 | Not Found | Conversation not found or not owned by user |
| 422 | Unprocessable Entity | Missing `message` field, message too long, or invalid `conversation_id` |
| 429 | Too Many Requests | Cohere API rate limit hit |
| 502 | Bad Gateway | Cohere API unreachable or returned 5xx |

Error response body:
```json
{
  "detail": "Human-readable error message"
}
```

---

## Frontend Integration Notes

The frontend `lib/api.ts` needs new functions:

```typescript
// Send chat message
sendChatMessage(userId: string, message: string, conversationId?: string): Promise<ChatResponse>
  → POST /api/{userId}/chat

// Load conversations
getConversations(userId: string): Promise<Conversation[]>
  → GET /api/{userId}/conversations

// Load messages for a conversation
getMessages(userId: string, conversationId: string): Promise<Message[]>
  → GET /api/{userId}/conversations/{conversationId}/messages
```

All calls go through the existing `request()` function with automatic JWT attachment.
