# Current Database and Storage Design

## Operational Storage

### PostgreSQL via Prisma
The bot currently stores its operational records in PostgreSQL using Prisma.

### Main Models
- `User`
  - WhatsApp number
  - preferred language
  - subscription state
  - timestamps
- `ConversationMessage`
  - incoming user messages
  - assistant replies
  - topic tags
  - escalation flag
  - source and timestamps
- `Feedback`
  - ratings and comments tied to users/messages
- `KnowledgeArticle`
  - topic content for knowledge-base style responses
- `Admin`
  - admin login credentials for dashboard access

## Session and Conversation State

- Session handling is available through the `services/sessionService*` files.
- Conversation history is preserved through `ConversationMessage` rows.
- Current history retrieval uses Prisma queries and the `/api/chat/:phoneNumber` endpoint.

## Analytics Sources

The current analytics views are assembled from:
- admin stats endpoint
- message history endpoint
- emergency messages endpoint
- feedback endpoint
- application logs

## Knowledge Storage

The bot currently uses:
- health knowledge JSON files for topic responses
- FAQ JSON data for common queries
- knowledge articles in PostgreSQL for structured content

## Vector Store Note

A dedicated vector store is not yet a production dependency in the current runtime. The evidence workspace still includes the slot for future ChromaDB / embedding-backed retrieval so the design screenshot can show the planned storage layer clearly.
