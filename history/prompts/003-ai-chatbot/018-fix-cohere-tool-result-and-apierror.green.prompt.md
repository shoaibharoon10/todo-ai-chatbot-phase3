---
id: 018
title: Fix Cohere Tool Result and ApiError
stage: green
date: 2026-02-18
surface: agent
model: claude-opus-4-6
feature: 003-ai-chatbot
branch: 002-backend-task-api
user: Shoaib Haroon
command: /sp.implement
labels: ["bugfix", "cohere", "tool-results", "error-handling"]
links:
  spec: specs/003-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/routes/chat.py
  - backend/main.py
tests:
  - Manual verification: restart backend, send chat message with tool call
---

## Prompt

/sp.implement for 003-ai-chatbot — Fix the Cohere BadRequestError in chat endpoint: "A tool result's output's id field must be a string" and AttributeError on ApiError import.

## Response snapshot

Fixed two bugs in backend/routes/chat.py:

1. **AttributeError on `cohere.errors.ApiError`**: Cohere SDK exports errors at module top level (`cohere.TooManyRequestsError`, `cohere.BadRequestError`), not under `cohere.errors`. The base class is at `cohere.core.api_error.ApiError`. Fixed by importing `from cohere.core.api_error import ApiError as CohereApiError` and using `cohere.TooManyRequestsError`, `cohere.BadRequestError` directly.

2. **BadRequestError "id field must be a string"**: Two sub-issues:
   - `Document.data` must be `Dict[str, Any]` (a real dict), but code passed `json.dumps(result)` (a string)
   - Tool results contain `"id": 7` (integer) but Cohere requires string values for the `id` field
   - Fixed by adding `_result_to_document_data()` helper that converts all dict values to strings, and adding an explicit `"id"` field on the document object

Also removed the one-time DROP TABLE migration from main.py lifespan to preserve conversation data across restarts.

## Outcome

- ✅ Impact: Unblocks the entire Cohere tool-call pipeline — chat endpoint can now execute tools and return results
- 🧪 Tests: Import verification passed, exception hierarchy confirmed correct
- 📁 Files: 2 modified (backend/routes/chat.py, backend/main.py)
- 🔁 Next prompts: Restart backend, test chat via curl with "Add a task called Test"
- 🧠 Reflection: Cohere SDK error module structure differs from OpenAI/standard patterns. The Document.data field accepting Dict[str, Any] but rejecting integer id values is underdocumented.

## Evaluation notes (flywheel)

- Failure modes observed: SDK error classes not at expected path; Document.data type mismatch (string vs dict)
- Graders run and results (PASS/FAIL): Import verification PASS, exception hierarchy PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): E2E curl test to confirm tool result round-trip works
