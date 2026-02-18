# Quickstart: AI Chatbot (003-ai-chatbot)

**Feature**: 003-ai-chatbot | **Date**: 2026-02-18

## Prerequisites

- Phase 2 (Full-stack web app) fully functional
- Cohere API key with access to Command models
- Python 3.11+, Node.js 18+
- Neon PostgreSQL database running

## Setup Steps

### 1. Add Cohere API Key

Add to `backend/.env`:
```
CO_API_KEY=your-cohere-api-key-here
```

### 2. Install Cohere SDK

```bash
cd backend
pip install cohere
```

Or add `cohere>=5.20.0` to `backend/requirements.txt` and re-install:
```bash
pip install -r requirements.txt
```

### 3. Verify Existing Services

Ensure Phase 2 is working:
```bash
# Backend
cd backend
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm run dev
```

Verify: Login, create a task, confirm it appears. If this works, Phase 2 is stable.

### 4. Implementation Order

Follow the Spec-Kit workflow:
1. **Backend models** — Add `Conversation` and `Message` to `models.py`
2. **Backend tools** — Create `tools/task_tools.py` with MCP tool functions
3. **Backend chat route** — Create `routes/chat.py` with Cohere integration
4. **Backend registration** — Register chat router in `main.py`
5. **Frontend API** — Add chat functions to `lib/api.ts`
6. **Frontend UI** — Create chat components and page
7. **Frontend nav** — Add chat link to header

### 5. Quick Verification

After implementation:
```bash
# Test chat endpoint directly
curl -X POST http://localhost:8000/api/{user_id}/chat \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task called Test chatbot"}'
```

Expected: JSON response with AI text and tool_calls array containing the created task.

## Key Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `backend/tools/__init__.py` | Package init |
| `backend/tools/task_tools.py` | MCP tool function implementations |
| `backend/routes/chat.py` | Chat endpoint with Cohere integration |
| `frontend/src/app/(protected)/chat/page.tsx` | Chat page |
| `frontend/src/components/features/chat/chat-container.tsx` | Chat UI container |
| `frontend/src/components/features/chat/chat-message.tsx` | Message bubble |
| `frontend/src/components/features/chat/chat-input.tsx` | Text input + send |
| `frontend/src/components/features/chat/tool-result-card.tsx` | Tool result display |

### Modified Files
| File | Change |
|------|--------|
| `backend/models.py` | Add Conversation, Message models + Pydantic schemas |
| `backend/main.py` | Register chat router |
| `backend/requirements.txt` | Add `cohere>=5.20.0` |
| `frontend/src/lib/api.ts` | Add sendChatMessage, getConversations, getMessages |
| `frontend/src/lib/types/index.ts` | Add ChatResponse, Conversation, Message types |
| `frontend/src/components/features/layout/header.tsx` | Add chat nav link |

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `CO_API_KEY` | `backend/.env` | Cohere API authentication |
| `DATABASE_URL` | `backend/.env` | PostgreSQL (existing) |
| `BETTER_AUTH_SECRET` | `backend/.env` | JWT verification (existing) |
