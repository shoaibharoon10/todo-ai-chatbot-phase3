---
id: "014"
title: Cohere SDK Tool Use Research
stage: general
date: 2026-02-18
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-ai-chatbot
branch: 002-backend-task-api
user: architext
command: research cohere python sdk tool use
labels: ["cohere","tool-use","function-calling","async","sdk","research"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - null
tests:
  - null
---

## Prompt

Research the Cohere Python SDK's chat API with tool use (function calling). I need to understand:

1. What is the current Cohere Python SDK package name and latest version? (pip install cohere)
2. How does Cohere's chat API with tool use work? What's the exact API call pattern?
3. What is the tool definition format (JSON schema)?
4. How do you handle the tool-call loop (model requests tool -> you execute -> send result back)?
5. Which Cohere model supports tool use? (Command R, Command R+, etc.)
6. Does the cohere SDK support async? (important for FastAPI)
7. What does a complete Python example look like for: send message with tools -> model calls tool -> execute tool -> send result back -> get final response?

Search the Cohere documentation website and provide concrete code examples. Focus on the v2 API if available (2025-2026 latest).

## Response snapshot

Provided comprehensive research covering: package name `cohere` at version 5.20.4 (Feb 2026), ClientV2/AsyncClientV2 classes, full tool definition JSON schema format matching OpenAI function calling spec, 4-step tool loop pattern, command-a-03-2025 as recommended model, AsyncClientV2 async support confirmed, and complete end-to-end Python example with multi-step while loop.

## Outcome

- ✅ Impact: Research complete — all 7 questions answered with concrete code examples from official Cohere docs
- 🧪 Tests: none (research task)
- 📁 Files: none modified
- 🔁 Next prompts: implement Cohere chatbot backend with tool use in FastAPI
- 🧠 Reflection: Cohere v2 API closely mirrors OpenAI function-calling pattern; tool results use "document" wrapper format which differs from OpenAI

## Evaluation notes (flywheel)

- Failure modes observed: PyPI page returned JS error; used GitHub releases and web search to confirm version 5.20.4
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): implement /chat endpoint in FastAPI using AsyncClientV2 with tool use loop
