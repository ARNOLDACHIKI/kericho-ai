---
name: afyaeducatorbot-implementation
description: "Use when implementing or testing AFYAEDUCATORBOT: a production-grade Node.js + WhatsApp Cloud API healthcare assistant with real-time LLM replies, conversational memory, multilingual support, safety handling, and no hardcoded production replies."
---

You are working inside the AFYAEDUCATORBOT codebase.

AFYAEDUCATORBOT is a production-grade AI healthcare conversational system running on Node.js + WhatsApp Cloud API with optional RAG knowledge support. This is not a static chatbot and it must not behave like one.

## Core Requirement

- Do not hardcode conversational replies for greetings, menus, follow-ups, clarifications, or normal conversation.
- Do not return the same reply for the same input unless the LLM and context genuinely produce it.
- Generate responses in real time from the current message, the conversation history, the detected language, and any retrieved knowledge context.
- Make the assistant feel warm, human, emotionally aware, and context-sensitive.
- Prefer dynamic LLM generation for every response path.
- If any area still requires the user’s input, clearly isolate it and do not block the rest of the implementation.

## System Name

The system name must be AFYAEDUCATORBOT.

## Conversation Behavior Rules

The assistant must:

- Detect greetings naturally and respond with a human-like greeting that varies with context.
- Ask intelligent follow-up questions when symptoms or health issues are mentioned.
- Generate a contextual menu or help response when the user asks for help, menu, options, or what the bot can do.
- Handle unclear, short, or vague inputs by asking for clarification instead of repeating a static fallback.
- Continue conversations using memory so it does not repeat the same question twice.
- Respond in the same language used by the user whenever possible.
- Support English, Kiswahili, and Kalenjin dialects where possible, including language awareness for low-resource forms.
- Keep medical safety soft and conversational; do not sound robotic or repetitive.
- Use empathetic language naturally, such as acknowledging concern, discomfort, urgency, or uncertainty.

## Required Processing Flow

Every incoming WhatsApp message should conceptually pass through this flow:

1. Receive message from WhatsApp webhook.
2. Detect the user’s language.
3. Detect intent such as greeting, symptom, menu/help, unknown, or follow-up.
4. Retrieve memory or conversation history.
5. Build context from the current message plus prior exchanges.
6. Query the LLM for a response.
7. Apply safety and medical guidance rules.
8. Send the final WhatsApp reply.
9. Store the message and response for future context.

## AI Response Requirements

The response engine must:

- Generate a unique reply for each use when context changes.
- Be aware of the current language and mirror it.
- Preserve tone and cultural context.
- Avoid generic repeated disclaimers except when required for safety.
- Adapt to the conversation history.
- Handle health questions without pretending to diagnose.
- Use optional retrieval-augmented context where available.

## Language Intelligence Requirements

Implement logic or prompts so the system can:

- Identify the user language before responding.
- Reply in English when English is used.
- Reply in Kiswahili when Kiswahili is used.
- Reply in the user’s Kalenjin dialect when that is the user’s language and the model has enough context.
- Preserve meaning rather than translating blindly.
- Support mixed-language input when users switch between languages.

## Memory Requirements

The system should retain and use conversational memory so it can:

- Remember recent user messages and assistant replies.
- Avoid repeating the same follow-up question.
- Continue unfinished conversations.
- Improve contextual responses over time.
- Use stored conversation history, vector memory, or session memory as available in the project.

## Healthcare Safety Requirements

The assistant must:

- Offer soft medical disclaimers when needed.
- Escalate urgent symptoms with clear safety guidance.
- Stay calm, reassuring, and non-judgmental.
- Avoid overusing warning text in every message.
- Never output a false diagnosis.

## No-Hardcode Rule

For production conversation flow:

- No static greeting strings.
- No fixed menu blocks.
- No hardcoded normal conversation templates.
- No repeat-by-default fallback answers.
- No fake intelligence labels when the reply is actually static.

Use LLM-driven generation for the real response content.

## Testing and Verification Requirements

You must implement or update tests and validation for each feature below. Keep the sequence in this order:

### Step 1: Greeting Test

Input examples:
- hi
- hello
- morning

Expected result:
- A human-like greeting response.
- The reply should vary across context and not use a fixed template.

### Step 2: Symptom Follow-up Test

Input example:
- I have headache

Expected result:
- A relevant follow-up question, not a diagnosis.
- The reply should sound human and caring.

### Step 3: Menu/Help Test

Input examples:
- menu
- help
- what can you do

Expected result:
- A dynamic structured help or menu response based on context.
- No static copied block.

### Step 4: Conversation Memory Test

Input sequence:
- I feel dizzy
- it started yesterday

Expected result:
- The system remembers the first message when answering the second.
- It should avoid asking the same question again.

### Step 5: Unknown Input Test

Input examples:
- ok
- hmm
- ???
- 123

Expected result:
- A clarification response that keeps the conversation moving.
- No error.
- No robotic fallback.

### Step 6: Multi-language Test

Input examples:
- Swahili messages
- Kalenjin messages where supported

Expected result:
- Response in the same language or dialect as the user when possible.
- Preserve meaning and tone.

### Step 7: End-to-End WhatsApp Delivery Test

Expected result:
- Webhook verification works.
- Incoming message reaches the controller.
- LLM response is generated.
- Message is sent successfully.
- Conversation memory is updated.

## Implementation Priorities

When editing the codebase, prioritize:

1. Webhook controller and route flow.
2. Response orchestration service.
3. Conversation memory storage and retrieval.
4. AI and language detection services.
5. WhatsApp send path using the Meta Cloud API.
6. Tests that prove each behavior works.

## Screenshot-Based Expectations

Use the screenshot and current project documentation as product guidance for:

- Topic flow expectations.
- Introductory greeting behavior.
- Menu and options structure.
- Health category navigation.
- Chat flow from user message to assistant reply.
- Admin-side evidence or logs if the project exposes them.

The implementation should align with the visual flow shown, but do not copy static text from the screenshot into production replies.

## Deliverables

You should make code changes that ensure:

- AFYAEDUCATORBOT responds dynamically in real time.
- Responses vary with context and language.
- Hardcoded production replies are removed from the conversation path.
- Tests cover all required behaviors.
- The system keeps improving with stored conversation history and context.

## Completion Rule

Do not stop until the requested features are implemented, tested, and understood. If anything still depends on user input, list only those specific items and continue with everything else that can be completed immediately.