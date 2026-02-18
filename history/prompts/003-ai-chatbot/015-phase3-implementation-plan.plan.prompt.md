---
id: 015
title: Phase 3 AI Chatbot Implementation Plan
stage: plan
date: 2026-02-18
surface: agent
model: claude-opus-4-6
feature: 003-ai-chatbot
branch: 002-backend-task-api
user: architect
command: /sp.plan
labels: ["plan", "phase3", "chatbot", "cohere", "architecture"]
links:
  spec: specs/003-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-ai-chatbot/research.md
  - specs/003-ai-chatbot/data-model.md
  - specs/003-ai-chatbot/contracts/chat-endpoint.md
  - specs/003-ai-chatbot/quickstart.md
  - specs/003-ai-chatbot/plan.md
tests:
  - N/A (planning phase, no code tests)
---

## Prompt

/sp.plan for 003-ai-chatbot

Generate the implementation plan for the Phase 3 AI Chatbot feature based on the spec at specs/003-ai-chatbot/spec.md, following the Spec-Kit Plus plan template workflow: Phase 0 (research), Phase 1 (design & contracts), and produce plan.md with all supporting artifacts.

## Response snapshot

Generated complete implementation plan with 5 artifacts:

**Phase 0 — Research** (`research.md`):
- R1: Cohere Python SDK v5.20+ with v2 API (ClientV2/AsyncClientV2)
- R2: Model selection — `command-a-03-2025` (latest, best tool-use accuracy)
- R3: Tool definition format — OpenAI-compatible JSON function schemas
- R4: Iterative tool-call loop with document-wrapped results (Cohere-specific)
- R5: AsyncClientV2 for FastAPI compatibility
- R6: MCP tools as direct DB functions (not HTTP self-calls)
- R7: Hybrid conversation history (DB persistence + send last 20 to Cohere)
- R8: Custom React chat UI with shadcn components
- R9: Error handling strategy with Cohere error -> HTTP status mapping

**Phase 1 — Design & Contracts**:
- `data-model.md`: Conversation (UUID PK, user_id, timestamps) and Message (UUID PK, conversation_id FK, role, content, tool_calls_json) entities
- `contracts/chat-endpoint.md`: Full API contract for POST /api/{user_id}/chat + GET conversations/messages endpoints + all 5 MCP tool JSON schemas
- `quickstart.md`: Setup guide, implementation order, file inventory

**Plan** (`plan.md`):
- Constitution Check: All 7 principles PASS
- 6 architecture decisions (AsyncClientV2 singleton, direct DB tools, iterative loop, DB history, user_id validation, model selection)
- 4 implementation phases: A (models+tools), B (chat endpoint), C (frontend UI), D (polish)
- ~16 new files, ~5 modified files
- 3 risks identified (latency, model accuracy, rate limiting)

## Outcome

- Impact: Complete implementation plan ready for task generation
- Tests: N/A (planning phase)
- Files: 5 new spec artifacts created
- Next prompts: Run `/sp.tasks` for 003-ai-chatbot to generate implementation tasks
- Reflection: Cohere v2 API research was critical — the document-wrapped tool result format is a Cohere-specific detail that would have caused bugs without research

## Evaluation notes (flywheel)

- Failure modes observed: setup-plan.ps1 detected wrong feature (branch-based); worked around by using correct paths manually
- Graders run and results (PASS/FAIL): Constitution check PASS (all 7 principles); template compliance PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Generate tasks from the plan via /sp.tasks
