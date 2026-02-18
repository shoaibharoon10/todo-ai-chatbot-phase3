---
id: 012
title: Phase 3 Constitution Ratification with Cohere API
stage: constitution
date: 2026-02-18
surface: agent
model: claude-opus-4-6
feature: none
branch: 002-backend-task-api
user: architect
command: constitution-amendment
labels: ["constitution", "phase3", "cohere", "chatbot", "amendment"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A (governance document, no code tests)
---

## Prompt

Ratify an updated version of the project constitution to incorporate Phase 3 (AI Chatbot) with Cohere API integration.

1. **Read Existing Constitution**: Load and reference the current constitution at .specify/memory/constitution.md (v1.0.0).

2. **Key Updates**:
   - **Tech Stack Changes for Phase 3**: Replace OpenAI Agents SDK and OpenAI ChatKit with Cohere API (use Cohere's Command models for chat completions with tool use). Use Cohere API key (env var: CO_API_KEY) for agent logic, natural language processing, and tool calls. Adapt agent behavior (orchestrator with subagents/skills) using Cohere's chat API with tools. Frontend chat UI: Integrate into existing Next.js (custom chat component instead of ChatKit), with domain allowlist if needed (but no OpenAI-specific config).
   - **Integration with Existing Backend**: Ensure AI chatbot integrates into the full-stack app (FastAPI backend with SQLModel, Neon PostgreSQL, Better Auth/JWT). MCP tools (add_task, list_tasks, etc.) remain stateless, persisted in DB. Chat endpoint: /api/{user_id}/chat, secured with JWT.
   - **Subagents/Skills**: Define MCP tools as skills; Use Cohere's tool calling for agent to invoke tools as subagents (e.g., chain tools for complex flows like list then delete). Add potential for extra subagents if spec'd (e.g., reminder subagent using update_task).
   - **Phases Update**: Add phase3-chatbot with features [task-crud, authentication, chatbot].
   - **Dependencies**: Add Cohere SDK to backend/requirements.txt (cohere package). No OpenAI dependencies.
   - **Other Rules**: No manual coding; Follow Spec-Kit Plus workflow (spec -> plan -> tasks -> implement). Ensure stateless architecture, error handling, NL commands as per Phase III spec.
   - **Version**: Bump to v1.1.0, ratification date: 2026-02-18.

3. **Output**: Full updated constitution.md content in markdown. Confirm ratification and save. Suggest next: Run fixes prompt for Phase 3.

## Response snapshot

Updated constitution from v1.0.0 to v1.1.0 with the following changes:

- **Principle II**: Added chatbot user isolation clause (AI responses scoped to authenticated user's data).
- **Principle III**: Extended JWT requirement to explicitly cover the chat endpoint.
- **Principle IV**: Added Cohere API (Command models) to locked tech stack. Added explicit prohibition of OpenAI dependencies. Added custom chat UI requirement (no third-party chat kits).
- **Principle V**: Added `POST /api/{user_id}/chat` endpoint specification with JWT security.
- **Principle VI**: Added chatbot-specific test focus areas (NL commands, tool persistence) and chat UI error handling requirements.
- **Principle VII (NEW)**: Full AI Chatbot Architecture principle covering Cohere API usage, stateless architecture, MCP tools as skills (add_task, list_tasks, update_task, delete_task, complete_task), orchestrator pattern with iterative tool-call loops, subagent extensibility, and NL-to-tool mapping examples.
- **Tech Stack & Conventions**: Added chat UI frontend conventions, Cohere backend conventions, phase3-chatbot config, and `cohere` dependency.
- **Workflow & Standards**: Updated project scope to Phase III current, added `CO_API_KEY` environment variable.

Sync Impact Report confirms all templates remain compatible (additive changes only).

## Outcome

- Impact: Constitution amended from v1.0.0 to v1.1.0 with Phase 3 AI Chatbot architecture
- Tests: N/A (governance document)
- Files: .specify/memory/constitution.md
- Next prompts: Create Phase 3 spec (`/sp.specify` for 003-ai-chatbot), then plan and tasks
- Reflection: Clean additive amendment; no backward-incompatible changes to Phase 2 stack

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Manual review PASS — all v1.0.0 principles preserved, new principle added, version bumped correctly
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Create Phase 3 feature spec based on ratified constitution
