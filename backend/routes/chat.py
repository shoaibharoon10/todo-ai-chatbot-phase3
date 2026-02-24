import json
import logging
import os
from datetime import datetime, timezone

import cohere
from cohere.core.api_error import ApiError as CohereApiError
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import (
    ChatRequest,
    ChatResponse,
    Conversation,
    ConversationRead,
    Message,
    MessageRead,
    ToolCallResult,
)
from tools.task_tools import (
    add_tag,
    add_task,
    complete_task,
    delete_task,
    get_stats,
    list_tasks,
    tag_task,
    update_task,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Cohere client — reads CO_API_KEY from env automatically
co = cohere.AsyncClientV2()

COHERE_MODEL = os.getenv("COHERE_MODEL", "command-a-03-2025")

def _build_system_prompt(
    user_name: str | None = None, user_email: str | None = None
) -> str:
    """Build a personalised system prompt using the authenticated user's identity."""
    if user_name and user_email:
        identity = (
            f"The user's name is {user_name} and their email is {user_email}. "
            f"Address them by name when greeting them. "
            f"If they ask 'who am I?' or about their identity, tell them their name is {user_name} "
            f"and their email is {user_email}."
        )
    elif user_name:
        identity = (
            f"The user's name is {user_name}. Address them by name when greeting them. "
            f"If they ask 'who am I?', tell them their name is {user_name}."
        )
    elif user_email:
        identity = (
            f"The user's email is {user_email}. "
            f"If they ask 'who am I?', tell them their email is {user_email}."
        )
    else:
        identity = "The user is logged in but their name is not available."

    return (
        "You are a friendly personal assistant built into the TaskFlow app. "
        f"{identity} "
        "You can help with general questions, casual conversation, and any topic the user raises. "
        "When the user greets you (e.g. 'hello', 'hi', 'hey'), respond warmly and use their name. "
        "You also specialise in task management: you can add, list, complete, delete, and update "
        "the user's tasks using the available tools. "
        "When a user asks to manage their tasks, use the appropriate tool and always confirm "
        "what you did after executing it."
    )

# MCP tool definitions (Cohere v2 / OpenAI-compatible JSON function schemas)
TOOLS = [
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
                        "description": "Task title (required, 1-200 characters)",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional task description (max 1000 characters)",
                    },
                    "due_date": {
                        "type": "string",
                        "description": (
                            "ISO 8601 UTC datetime for when the task is due "
                            "(e.g. '2026-02-25T00:00:00Z'). Compute from natural language: "
                            "'due tomorrow' → next day at midnight UTC, "
                            "'due next Monday' → next Monday midnight UTC. Omit if not mentioned."
                        ),
                    },
                    "recurrence_rule": {
                        "type": "string",
                        "description": (
                            "RFC 5545 RRULE string for recurring tasks. Generate from natural language: "
                            "'every day' → 'FREQ=DAILY', "
                            "'every weekday' → 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', "
                            "'every Monday' → 'FREQ=WEEKLY;BYDAY=MO', "
                            "'every month' → 'FREQ=MONTHLY', "
                            "'weekly' → 'FREQ=WEEKLY'. Omit for non-recurring tasks."
                        ),
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": (
                            "Task priority. Infer from user language: "
                            "'urgent'/'critical'/'ASAP' → 'urgent'; "
                            "'important'/'high priority' → 'high'; "
                            "'whenever'/'low priority'/'not important' → 'low'. "
                            "Omit if not specified (defaults to 'medium')."
                        ),
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "List of tag names to apply to this task. Tags are created automatically "
                            "if they don't exist. Example: ['work', 'shopping']."
                        ),
                    },
                    "notes": {
                        "type": "string",
                        "description": (
                            "Freeform notes or additional context for the task (max 5000 chars). "
                            "Use when user says 'add a note', 'remind me to', 'with the following details', "
                            "or provides detailed context beyond the title. "
                            "Example: 'remember to bring the signed contract'."
                        ),
                    },
                    "reminder_offset_minutes": {
                        "type": "integer",
                        "description": (
                            "Minutes before due_date to fire a browser notification "
                            "(e.g. 15, 30, 60, 120, 1440). Only used when due_date is also set."
                        ),
                    },
                },
                "required": ["title"],
            },
        },
    },
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
                        "description": "Filter by completion status. Default: all",
                    },
                    "sort": {
                        "type": "string",
                        "enum": ["newest", "oldest", "title"],
                        "description": "Sort order. Default: newest first",
                    },
                },
                "required": [],
            },
        },
    },
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
                        "description": "The ID of the task to toggle",
                    },
                },
                "required": ["task_id"],
            },
        },
    },
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
                        "description": "The ID of the task to delete",
                    },
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update a task's title, description, completion status, or due date. Only provided fields are changed. Returns the updated task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task to update",
                    },
                    "title": {
                        "type": "string",
                        "description": "New title (1-200 characters)",
                    },
                    "description": {
                        "type": "string",
                        "description": "New description (max 1000 characters)",
                    },
                    "completed": {
                        "type": "boolean",
                        "description": "Set completion status directly",
                    },
                    "due_date": {
                        "type": "string",
                        "description": (
                            "ISO 8601 UTC datetime for when the task is due "
                            "(e.g. '2026-02-25T00:00:00Z'). Pass 'null' to clear an existing due date. "
                            "Compute from natural language: 'due tomorrow' → next day at midnight UTC."
                        ),
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "urgent"],
                        "description": (
                            "New priority for the task. Infer from user language: "
                            "'urgent'/'critical'/'ASAP' → 'urgent'; "
                            "'important'/'high priority' → 'high'; "
                            "'whenever'/'low priority' → 'low'."
                        ),
                    },
                    "notes": {
                        "type": "string",
                        "description": (
                            "New notes content for the task (max 5000 chars). "
                            "Use when user says 'add a note to task', 'update notes', or provides extra context. "
                            "Example: 'call client at 3pm'."
                        ),
                    },
                    "clear_notes": {
                        "type": "boolean",
                        "description": "Set to true to remove/clear existing notes from the task.",
                    },
                    "reminder_offset_minutes": {
                        "type": "integer",
                        "description": (
                            "Minutes before due_date to fire a browser notification "
                            "(e.g. 15, 30, 60, 120, 1440). Only used when due_date is also set."
                        ),
                    },
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stats",
            "description": (
                "Returns task productivity statistics: total tasks, completed, pending, "
                "overdue count, and completion rate. Use when the user asks about their "
                "progress, productivity, how many tasks they have done, or how they are doing."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_tag",
            "description": "Create a new tag for the user (idempotent — returns existing tag if name already exists). Use this to create tags before applying them.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Tag name (1-50 characters)",
                    },
                    "color": {
                        "type": "string",
                        "description": "Hex colour for the tag (e.g. '#6366f1'). Defaults to indigo if omitted.",
                    },
                },
                "required": ["name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "tag_task",
            "description": "Apply a tag to a task by task ID and tag name. The tag is created automatically if it does not exist.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task to tag",
                    },
                    "tag_name": {
                        "type": "string",
                        "description": "Name of the tag to apply to the task",
                    },
                },
                "required": ["task_id", "tag_name"],
            },
        },
    },
]

# Map tool names to their implementation functions
TOOL_DISPATCH = {
    "add_task": add_task,
    "list_tasks": list_tasks,
    "complete_task": complete_task,
    "delete_task": delete_task,
    "update_task": update_task,
    "add_tag": add_tag,
    "tag_task": tag_task,
    "get_stats": get_stats,
}


def _execute_tool(
    tool_name: str, args: dict, session: Session, user_id: str
) -> dict | list:
    """Execute a tool by name with the given arguments."""
    fn = TOOL_DISPATCH.get(tool_name)
    if not fn:
        return {"error": f"Unknown tool: {tool_name}"}
    try:
        return fn(session=session, user_id=user_id, **args)
    except Exception as e:
        logger.error("Tool execution error (%s): %s", tool_name, e)
        return {"error": f"Tool execution failed: {str(e)}"}


def _result_to_document_data(result: dict | list) -> dict[str, str]:
    """Convert a tool result to a Cohere Document.data dict.

    Cohere V2 requires Document.data to be Dict[str, Any] (not a JSON string),
    and all values should be strings to avoid type validation issues
    (e.g., integer 'id' fields are rejected).
    """
    if isinstance(result, list):
        return {"items": json.dumps(result, default=str), "count": str(len(result))}
    if isinstance(result, dict):
        return {str(k): str(v) if v is not None else "" for k, v in result.items()}
    return {"result": str(result)}


# T013: POST /api/{user_id}/chat
@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(
    user_id: str,
    body: ChatRequest,
    jwt_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Verify URL user_id matches JWT sub
    if user_id != jwt_user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    # Create or load conversation
    conversation_id = body.conversation_id
    if conversation_id:
        conversation = session.exec(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conversation.updated_at = datetime.now(timezone.utc)
        session.add(conversation)
        session.commit()
    else:
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        conversation_id = conversation.id

    # Load last 20 messages for context
    history_msgs = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    ).all()
    history_msgs = list(reversed(history_msgs))

    # Build Cohere messages array with personalised system prompt
    system_prompt = _build_system_prompt(body.user_name, body.user_email)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history_msgs:
        if msg.role in ("user", "assistant"):
            messages.append({"role": msg.role, "content": msg.content})

    # Add the new user message
    messages.append({"role": "user", "content": body.message})

    # Store user message in DB
    user_msg = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role="user",
        content=body.message,
    )
    session.add(user_msg)
    session.commit()

    # Call Cohere with tool-call loop
    tool_calls_executed: list[ToolCallResult] = []

    try:
        response = await co.chat(
            model=COHERE_MODEL,
            messages=messages,
            tools=TOOLS,
        )

        iterations = 0
        max_iterations = 10

        while response.message.tool_calls and iterations < max_iterations:
            iterations += 1

            # Append assistant message with tool calls to history
            messages.append(
                {
                    "role": "assistant",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in response.message.tool_calls
                    ],
                }
            )

            # Execute each tool call
            for tc in response.message.tool_calls:
                tool_name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments)
                except (json.JSONDecodeError, TypeError):
                    args = {}

                if tool_name not in TOOL_DISPATCH:
                    logger.warning("Unknown tool requested: %s", tool_name)
                    result = {"error": f"Unknown tool: {tool_name}"}
                else:
                    result = _execute_tool(tool_name, args, session, user_id)

                tool_calls_executed.append(
                    ToolCallResult(tool=tool_name, args=args, result=result)
                )

                # Append tool result in Cohere document format.
                # Document.data must be Dict[str, Any] (not a JSON string)
                # and the document needs a string id field.
                doc_data = _result_to_document_data(result)
                logger.debug(
                    "Tool %s result doc_data: %s", tool_name, doc_data
                )
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": [
                            {
                                "type": "document",
                                "document": {
                                    "id": f"{tool_name}_{tc.id}",
                                    "data": doc_data,
                                },
                            }
                        ],
                    }
                )

            # Call Cohere again with updated history
            response = await co.chat(
                model=COHERE_MODEL,
                messages=messages,
                tools=TOOLS,
            )

        # Extract final text response
        final_text = ""
        if response.message.content:
            for block in response.message.content:
                if hasattr(block, "text"):
                    final_text += block.text

        if not final_text:
            final_text = "I processed your request."

    except cohere.TooManyRequestsError:
        raise HTTPException(
            status_code=429, detail="Rate limit reached. Please wait a moment."
        )
    except cohere.BadRequestError as e:
        logger.error("Cohere BadRequestError: %s", e)
        raise HTTPException(
            status_code=502, detail="AI service request error. Please try again."
        )
    except CohereApiError as e:
        logger.error("Cohere API error: %s", e)
        raise HTTPException(
            status_code=502, detail="AI service temporarily unavailable."
        )
    except Exception as e:
        logger.error("Unexpected error in chat: %s", e)
        raise HTTPException(
            status_code=502, detail="Could not reach AI service."
        )

    # Store assistant response in DB
    assistant_msg = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role="assistant",
        content=final_text,
        tool_calls_json=(
            json.dumps(
                [tc.model_dump() for tc in tool_calls_executed], default=str
            )
            if tool_calls_executed
            else None
        ),
    )
    session.add(assistant_msg)
    session.commit()

    return ChatResponse(
        response=final_text,
        tool_calls=tool_calls_executed,
        conversation_id=conversation_id,
    )


# T015: GET /api/{user_id}/conversations
@router.get("/{user_id}/conversations", response_model=list[ConversationRead])
def list_conversations(
    user_id: str,
    jwt_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user_id != jwt_user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    conversations = session.exec(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    ).all()
    return conversations


# T016: GET /api/{user_id}/conversations/{conversation_id}/messages
@router.get(
    "/{user_id}/conversations/{conversation_id}/messages",
    response_model=list[MessageRead],
)
def get_conversation_messages(
    user_id: str,
    conversation_id: str,
    jwt_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user_id != jwt_user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    # Verify conversation belongs to user
    conversation = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()
    return messages
