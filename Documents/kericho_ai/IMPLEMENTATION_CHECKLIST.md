# AFYAEDUCATORBOT Verification Checklist

Use this as the working checklist for the screenshot items. The goal is to be able to verify each one with a code path, a log line, or a visible UI artifact.

## Live Message Flow
- [x] Webhook is mounted at `/webhook`
- [x] GET `/webhook` returns the Meta challenge value
- [x] POST `/webhook` accepts Meta payloads and parses messages
- [x] Incoming text is routed through the AI-backed conversation flow
- [x] Outbound replies are sent through the Meta WhatsApp API
- [x] Conversation messages are stored in the database when Prisma is connected
- [x] Empty or unsupported payloads are safely acknowledged with HTTP 200

## Screenshot Verification Items
- [x] 1. WhatsApp webhook configuration screenshot shows the current registered webhook URL and verify token
- [x] 2. System architecture screenshot shows Web, Backend, Redis/BullMQ, Gemini, and storage components
- [x] 3. Database/storage screenshot shows sessions, conversation history, vector store, and analytics sources
- [x] 4. Topic menu screenshot shows supported health categories in the chat flow
- [x] 5. Sample response screenshot shows a real AI-generated answer from the live bot
- [x] 6. Health knowledge categories screenshot shows maternal health, nutrition, common diseases, HIV/SRH, mental health, vaccination, and child growth
- [x] 7. Backend routing screenshot shows the current Express webhook flow and async processing path
- [x] 8. Conversation flow screenshot shows greeting, menu selection, question, and response in sequence
- [x] 9. Introduction screenshot shows the current landing greeting in the web chat
- [x] 10. Navigation screenshot shows interactive topic buttons or list selection working
- [x] 11. Bot test screenshot shows a successful real test from WhatsApp or the web chat
- [x] 12. Topic/language trigger screenshot shows topic selection and language switching working correctly
- [x] 13. Interactive button simulation screenshot shows a button reply or list reply being handled correctly
- [x] 14. User test evidence screenshot shows conversation logs, transcript review, or pilot user proof

## Code Proof Points
- [x] WhatsApp payload parsing lives in [src/services/whatsappService.js](src/services/whatsappService.js)
- [x] Incoming message processing lives in [src/services/conversationService.js](src/services/conversationService.js)
- [x] AI reply generation lives in [src/services/responseService.js](src/services/responseService.js)
- [x] Meta webhook handling lives in [src/controllers/webhookController.js](src/controllers/webhookController.js)
- [x] WhatsApp send logic normalizes recipients before hitting the Graph API

## Test Coverage To Keep Green
- [x] `src/__tests__/services/whatsappService.test.js`
- [x] `src/__tests__/services/responseService.test.js`
- [x] `tests/webhookRoutes.test.js`
- [x] `tests/api/webhook.test.js`

## Remaining Manual Checks
- [x] Confirm Meta webhook verification in the WhatsApp dashboard or ngrok tunnel view
- [x] Confirm the bot responds to a live WhatsApp message with a real AI-generated reply
- [x] Confirm sample screenshots are updated after the UI or docs are refreshed

## Evidence Workspace
- The live screenshot workspace is available at `/evidence` and groups all 14 checklist items into one current UI surface.
- Supporting design docs: [CURRENT_ARCHITECTURE.md](CURRENT_ARCHITECTURE.md) and [STORAGE_DESIGN.md](STORAGE_DESIGN.md).
