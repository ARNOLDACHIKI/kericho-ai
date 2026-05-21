# How the System Works

## Overview

AFYAEDUCATORBOT is a WhatsApp healthcare education assistant with an admin monitoring dashboard.

The system has two main user-facing surfaces:
- WhatsApp message processing through the Meta Cloud API webhook.
- An admin dashboard that shows health, usage, logs, emergencies, and recent message activity.

## Message Flow

1. A user sends a WhatsApp message.
2. Meta forwards the payload to `POST /webhook`.
3. `parseIncomingMessage()` extracts the sender, text, message ID, and phone number ID.
4. `conversationService.processIncomingMessage()` stores the user message, builds the reply, and stores the assistant response.
5. `responseService.buildAssistantReply()` generates the actual answer.
6. `aiService.generateAiResponse()` tries providers in order:
   - Gemini
   - Ollama local fallback
   - OpenAI fallback
   - safety fallback if all providers fail
7. `whatsappService.sendMessage()` delivers the reply to WhatsApp.
8. Duplicate webhook messages are ignored by message ID to avoid repeated replies.

## Storage

The current persistent storage is PostgreSQL through Prisma.

Core models:
- `User`
- `ConversationMessage`
- `Feedback`
- `KnowledgeArticle`
- `Admin`

## Admin Monitoring

The admin dashboard now shows:
- Summary counts
- Recent messages
- Emergency alerts
- Health status
- Log files and recent activity
- Degraded mode fallback for message listing when the database is unavailable

Relevant endpoints:
- `POST /auth/login`
- `GET /admin/health`
- `GET /admin/stats`
- `GET /admin/users`
- `GET /admin/messages`
- `GET /admin/emergencies`
- `GET /admin/feedback`
- `GET /admin/topics`
- `GET /admin/logs`

## Evidence Workspace

A live evidence page is available at `/evidence` for the remaining screenshot checklist items.

## Current Login Details

For local development, use:
- Username: `admin`
- Password: `ChangeMe123!`
