---
id: 017
title: Implement Chatbot Backend and Frontend
stage: green
date: 2026-02-18
surface: agent
model: claude-opus-4-6
feature: 003-ai-chatbot
branch: 002-backend-task-api
user: Shoaib Haroon
command: /sp.implement
labels: ["implementation", "cohere", "chat", "mcp-tools", "frontend", "backend"]
links:
  spec: specs/003-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/tools/task_tools.py
  - backend/routes/chat.py
  - backend/main.py
  - backend/models.py
  - backend/requirements.txt
  - backend/tools/__init__.py
  - backend/.env
  - frontend/src/types/index.ts
  - frontend/src/lib/api.ts
  - frontend/src/components/features/chat/chat-input.tsx
  - frontend/src/components/features/chat/tool-result-card.tsx
  - frontend/src/components/features/chat/chat-message.tsx
  - frontend/src/components/features/chat/chat-message-list.tsx
  - frontend/src/components/features/chat/chat-container.tsx
  - frontend/src/app/(protected)/chat/page.tsx
  - frontend/src/components/features/layout/header.tsx
  - frontend/src/components/features/layout/mobile-nav.tsx
  - specs/003-ai-chatbot/tasks.md
tests:
  - Manual E2E verification via curl and browser (pending)
---

## Prompt

/sp.implement for 003-ai-chatbot

## Response snapshot

Executed implementation phases 1-4 plus portions of phases 10-11 for the AI Chatbot feature:

**Phase 1 (Setup) - T001-T003**: Added cohere SDK dependency, created tools package, configured CO_API_KEY.

**Phase 2 (Foundational) - T004-T017**:
- T004-T006: Added Conversation and Message SQLModel classes + all Pydantic schemas to models.py
- T007-T011: Implemented 5 MCP tool functions (add_task, list_tasks, complete_task, delete_task, update_task) in backend/tools/task_tools.py as direct DB operations
- T012-T016: Created backend/routes/chat.py with Cohere AsyncClientV2 integration, iterative tool-call loop (max 10 iterations), Cohere document-format tool results, error handling (429/502), system prompt, and conversation/message list endpoints
- T017: Registered chat router in main.py

**Phase 4 (Chat UI) - T021-T029**:
- T021-T022: Added TypeScript types and API functions for chat
- T023-T025: Created chat-input, tool-result-card, and chat-message components
- T026-T027: Created chat-message-list (with typing indicator) and chat-container (with history loading, error handling)
- T028: Created /chat page
- T029: Added Tasks/Chat navigation to header and mobile nav

**Also completed**: T043 (conversation persistence on mount), T046 (typing indicator), T047 (frontend error handling).

Total: 32 tasks completed out of 50. Remaining 18 are manual verification tasks (E2E testing via curl/browser).

## Outcome

- ✅ Impact: Full-stack AI chatbot implementation — backend Cohere integration with 5 MCP tools + frontend chat UI with message history
- 🧪 Tests: Zero TypeScript diagnostics. Manual E2E verification pending.
- 📁 Files: 18 files created/modified (3 new backend, 6 new frontend, 9 modified)
- 🔁 Next prompts: Run backend server + frontend dev server, test chat endpoint via curl, verify in browser
- 🧠 Reflection: Implemented all code tasks in a single session. Used crypto.randomUUID() instead of uuid package to avoid adding a dependency. All Cohere-specific patterns (document-wrapped tool results, AsyncClientV2, iterative tool-call loop) implemented per research.md findings.

## Evaluation notes (flywheel)

- Failure modes observed: None during implementation. All TS diagnostics clean.
- Graders run and results (PASS/FAIL): N/A (manual E2E testing pending)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run E2E test — curl POST /api/{user_id}/chat with a valid JWT to verify Cohere tool-call pipeline works end-to-end.
