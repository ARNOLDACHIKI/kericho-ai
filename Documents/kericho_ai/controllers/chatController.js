/**
 * Chat controller with simple session/context handling.
 * - Uses async session service (supports Redis or memory)
 * - Uses improved topic detection and duration parsing
 * - Starts simple follow-up flows (asks duration) for detected topics
 * - Integrates guided symptom checker flows
 */

const { findFAQ } = require("../services/knowledgeService");
const sessionService = require("../services/sessionService");
const dbService = require("../services/dbService");
const { processIncomingMessage } = require("../src/services/conversationService");
const { detectTopic, parseDuration } = require("../src/utils/topicDetection");
const env = require("../src/config/env");
const locationService = require("../services/locationService");
const {
  extractLocationContext,
  findNearbyFacilities,
  formatFacilityResponse,
  isFacilityRequest,
} = locationService;
const getCoordinates = locationService.getCoordinates || (async () => null);
const getNearbyHospitals = locationService.getNearbyHospitals || (async () => []);
const formatDirectionsResponse =
  locationService.formatDirectionsResponse || (() => "I couldn't find nearby hospitals. Please try again with a clearer location.");
const isDirectionsRequest = locationService.isDirectionsRequest || (() => false);
const {
  detectEmergency,
  getEmergencyResponse,
  logEmergency,
} = require("../services/emergencyService");
const { detectLanguage, translateText } = require("../services/languageService");
const { getCache, setCache, buildCacheKey } = require("../services/cacheService");
const { addToQueue } = require("../services/queueService");
const {
  detectSymptom,
  startFlow,
  processStep,
  getFinalAdvice,
} = require("../services/symptomService");
const { PrismaClient } = require("@prisma/client");
const logger = require("../src/lib/logger");
const { isGreeting } = require("../src/utils/greetingDetection");
const { generateAiResponse } = require("../src/services/aiService");

const prisma = new PrismaClient();

function parseFeedbackCommand(message) {
  const text = String(message || "").trim();

  if (!text) {
    return null;
  }

  const rateMatch = text.match(/^rate\s+([1-5])(?:\s*[:\-]?\s*(.*))?$/i);
  if (rateMatch) {
    const comment = String(rateMatch[2] || "").trim();
    return {
      rating: parseInt(rateMatch[1], 10),
      comment: comment || null,
    };
  }

  const feedbackMatch = text.match(/^feedback\s*:\s*(.+)$/i);
  if (feedbackMatch) {
    return {
      rating: null,
      comment: String(feedbackMatch[1] || "").trim() || null,
    };
  }

  return null;
}

function getFeedbackPrompt(language) {
  return language === "sw"
    ? "Je, hii ilikusaidia? Jibu kwa 'rate 1-5'"
    : "Was this helpful? Reply with 'rate 1-5'";
}

function appendFeedbackPrompt(message, language, shouldPrompt) {
  if (!shouldPrompt) {
    return message;
  }

  const prompt = getFeedbackPrompt(language);
  return `${message}\n\n${prompt}`.trim();
}

const CACHE_TTLS = {
  faq: 60 * 60 * 1000,
  location: 10 * 60 * 1000,
};

function buildMessageCacheKey({ message, language, type, locationContext, session }) {
  return buildCacheKey(
    "legacy-chat-response",
    type,
    language,
    String(message || "").trim().toLowerCase(),
    locationContext?.label || locationContext?.query || "",
    locationContext?.coordinates ? `${locationContext.coordinates.latitude},${locationContext.coordinates.longitude}` : "",
    session?.location?.label || session?.location?.query || "",
    session?.location?.coordinates ? `${session.location.coordinates.latitude},${session.location.coordinates.longitude}` : "",
    session?.step || "",
    session?.topic || "",
    session?.inSymptomFlow ? "symptom-flow" : ""
  );
}

function cacheResponse(cacheKey, payload, ttlMs) {
  if (cacheKey) {
    setCache(cacheKey, payload, ttlMs);
  }

  return payload;
}

async function handleIncomingMessage(req, res) {
  try {
    const incomingMessage = req.body?.message || req.body?.text || "";
    const from = req.body?.from || req.body?.phone || "unknown";
    const feedbackCommand = parseFeedbackCommand(incomingMessage);

    if (feedbackCommand) {
      const userLang = detectLanguage(incomingMessage);
      const session = await sessionService.getSession(from);

      if (feedbackCommand.rating === null && !feedbackCommand.comment) {
        const invalidMsg = userLang === "sw"
          ? "Tafadhali tuma 'rate 1-5' au 'feedback: ujumbe wako'."
          : "Please send 'rate 1-5' or 'feedback: your message'.";
        const outInvalid = await translateText(invalidMsg, userLang);
        return res.status(200).json({ message: outInvalid, source: "feedback" });
      }

      const savedFeedback = await dbService.saveFeedback({
        phoneNumber: from,
        rating: feedbackCommand.rating,
        comment: feedbackCommand.comment,
        preferredLanguage: userLang,
      });

      logger.info(
        {
          from,
          rating: savedFeedback.rating,
          feedbackId: savedFeedback.id,
        },
        "Feedback command handled"
      );

      await sessionService.updateSession(from, {
        lastFeedbackAt: new Date().toISOString(),
        lastFeedbackRating: savedFeedback.rating,
        lastFeedbackComment: savedFeedback.comment,
        lastFeedbackPromptAt: session.lastFeedbackPromptAt || null,
        feedbackFlaggedForReview: (savedFeedback.rating || 0) > 0 && savedFeedback.rating < 3,
      });

      const outReply = userLang === "sw"
        ? "Asante kwa maoni yako. Tutaendelea kuboresha huduma."
        : "Thanks for your feedback. We will keep improving the service.";

      logger.info({ from, source: "feedback" }, "Feedback response sent");

      return res.status(200).json({
        message: outReply,
        source: "feedback",
        feedback: {
          id: savedFeedback.id,
          rating: savedFeedback.rating,
          comment: savedFeedback.comment,
        },
      });
    }
    const incomingLocation = extractLocationContext({
      text: incomingMessage,
      location: req.body?.location || req.body?.message?.location,
      coordinates: req.body?.coordinates,
      locationName: req.body?.locationName,
    });

    logger.info({ from, message: incomingMessage }, "Chat message received");

    // Reset condition
    const userLang = detectLanguage(incomingMessage);
    if (/^\s*(menu|start)\s*$/i.test(incomingMessage)) {
      await sessionService.clearSession(from);
      const restartMsg = userLang === "sw" ? "Habari, kikao kimeanzishwa upya. Naweza kukusaidia vipi?" : "Session restarted. How can I help?";
      const out = await translateText(restartMsg, userLang);
      return res.status(200).json({ message: out, source: "session" });
    }

    // ============================================================
    // SUBSCRIPTION HANDLER - Check early (subscribe/unsubscribe)
    // ============================================================
    if (/^\s*subscribe\s*$/i.test(incomingMessage)) {
      try {
        await prisma.user.upsert({
          where: { whatsappNumber: from },
          update: { isSubscribed: true },
          create: { whatsappNumber: from, preferredLanguage: userLang, isSubscribed: true },
        });
        const subscribeMsg = userLang === "sw" ? "✓ Umejifungisha kwa vidokezo vya kila siku." : "✓ You are now subscribed to daily health tips!";
        const out = await translateText(subscribeMsg, userLang);
        return res.status(200).json({ message: out, source: "subscription", isSubscribed: true });
      } catch (error) {
        logger.error({ error: error.message }, "Subscribe handling failed");
        return res.status(200).json({ message: "Error processing subscription.", source: "error" });
      }
    }

    if (/^\s*unsubscribe\s*$/i.test(incomingMessage)) {
      try {
        await prisma.user.upsert({
          where: { whatsappNumber: from },
          update: { isSubscribed: false },
          create: { whatsappNumber: from, preferredLanguage: userLang, isSubscribed: false },
        });
        const unsubscribeMsg = userLang === "sw" ? "✓ Umefukuzwa kwa vidokezo vya kila siku." : "✓ You have been unsubscribed from daily health tips.";
        const out = await translateText(unsubscribeMsg, userLang);
        return res.status(200).json({ message: out, source: "subscription", isSubscribed: false });
      } catch (error) {
        logger.error({ error: error.message }, "Unsubscribe handling failed");
        return res.status(200).json({ message: "Error processing unsubscription.", source: "error" });
      }
    }

    // ============================================================
    // EXIT OPTIONS - Cancel any active flow
    // ============================================================
    if (/^\s*(stop|menu|back|cancel)\s*$/i.test(incomingMessage)) {
      await sessionService.clearSession(from);
      const exitMsg = userLang === "sw" ? "Session cleared. How can I help you?" : "Session cleared. How can I help you?";
      const outExit = await translateText(exitMsg, userLang);
      return res.status(200).json({ message: outExit, source: "session" });
    }

    // ============================================================
    // SYMPTOM CHECKER FLOW - Multi-step guided interview
    // ============================================================
    const session = await sessionService.getSession(from);
    const faq = findFAQ(incomingMessage);
    const wantsLocation = isFacilityRequest(incomingMessage) || isDirectionsRequest(incomingMessage);
    const cacheKey =
      (faq || wantsLocation) && !session.inSymptomFlow && session.step !== "awaiting_duration"
        ? buildMessageCacheKey({
            message: incomingMessage,
            language: userLang,
            type: faq ? "faq" : "location",
            locationContext: incomingLocation,
            session,
          })
        : null;

    if (cacheKey) {
      const cachedResponse = getCache(cacheKey);
      if (cachedResponse) {
        logger.info({ from, cacheKey }, "Legacy chat response served from cache");
        return res.status(200).json(cachedResponse);
      }
    }

    // Check if user is in an active symptom flow
    if (session.inSymptomFlow) {
      const processResult = processStep(
        {
          currentSymptom: session.currentSymptom,
          currentStepIndex: session.currentStepIndex || 0,
          answers: session.symptomAnswers || {},
        },
        incomingMessage,
        userLang
      );

      if (processResult.error) {
        logger.error({ error: processResult.error }, "Symptom flow processing failed");
        const errorMsg = userLang === "sw" ? "Kosa la kufanya kazi. Karibu tena." : "Something went wrong. Please try again.";
        const outErr = await translateText(errorMsg, userLang);
        return res.status(200).json({ message: outErr, source: "error" });
      }

      // Store updated state
      await sessionService.updateSession(from, {
        currentStepIndex: processResult.stepIndex,
        symptomAnswers: processResult.answers,
      });

      // Check if flow is complete
      if (processResult.isComplete) {
        // Return final advice with safety message
        const advice = processResult.advice;
        const finalMsg = `${advice}\n\n⚠️ REMINDER: This is not a medical diagnosis. Always consult a healthcare provider.`;
        const outAdvice = await translateText(finalMsg, userLang);

        // Clear flow from session
        await sessionService.updateSession(from, {
          inSymptomFlow: false,
          currentSymptom: null,
          currentStepIndex: 0,
          symptomAnswers: {},
        });

        return res.status(200).json({
          message: outAdvice,
          source: "symptom_checker",
          flowComplete: true,
        });
      }

      // More questions remain
      const nextQuestion = processResult.question;
      const progress = userLang === "sw" ? `(Swali ${processResult.stepIndex + 1} kati ya ${session.flowTotalSteps})` : `(Question ${processResult.stepIndex + 1} of ${session.flowTotalSteps})`;
      const questionWithProgress = `${nextQuestion}\n${progress}`;
      const outNext = await translateText(questionWithProgress, userLang);

      return res.status(200).json({
        message: outNext,
        source: "symptom_checker",
        stepIndex: processResult.stepIndex,
      });
    }

    // Check if user is mentioning a symptom (start new flow)
    const detectedSymptom = detectSymptom(incomingMessage);
    if (detectedSymptom) {
      const firstQuestion = startFlow(detectedSymptom, userLang);
      if (firstQuestion) {
        const totalSteps = require("../services/symptomService").getTotalSteps(detectedSymptom);

        // Store flow state in session
        await sessionService.updateSession(from, {
          inSymptomFlow: true,
          currentSymptom: detectedSymptom,
          currentStepIndex: 0,
          symptomAnswers: {},
          flowTotalSteps: totalSteps,
          lastMessage: incomingMessage,
        });

        const progress = userLang === "sw" ? `(Swali 1 kati ya ${totalSteps})` : `(Question 1 of ${totalSteps})`;
        const intro = userLang === "sw" ? `I'll help you with ${detectedSymptom}. Let me ask a few questions.\n\n` : `I'll help you with ${detectedSymptom}. Let me ask a few questions.\n\n`;
        const questionWithProgress = `${intro}${firstQuestion.question}\n${progress}`;
        const outQuestion = await translateText(questionWithProgress, userLang);

        return res.status(200).json({
          message: outQuestion,
          source: "symptom_checker",
          flowStarted: true,
          stepIndex: 0,
        });
      }
    }

    // ============================================================
    // EMERGENCY DETECTION - Check FIRST before other flows
    // ============================================================
    if (detectEmergency(incomingMessage)) {
      logEmergency({
        userId: from,
        message: incomingMessage,
        timestamp: new Date().toISOString(),
      });

      // Try to get location to suggest facilities
      const effectiveLocation = incomingLocation || (await sessionService.getSession(from)).location || null;
      let emergencyResponse = getEmergencyResponse({
        facilities: effectiveLocation ? findNearbyFacilities(effectiveLocation) : null,
        location: effectiveLocation ? (effectiveLocation.label || effectiveLocation.query) : null,
      });

      const translated = await translateText(emergencyResponse, userLang);
      return res.status(200).json({
        message: translated,
        source: "emergency",
        priority: "HIGH",
        escalationSuggested: true,
      });
    }

    if (incomingLocation) {
      await sessionService.updateSession(from, {
        location: incomingLocation,
        lastMessage: incomingMessage,
      });
    }

    if (wantsLocation) {
      const effectiveLocation = incomingLocation || session.location || null;

      if (!effectiveLocation) {
        const askLoc = userLang === "sw" ? "Tafadhali niambie eneo lako ili niweze kupendekeza vituo vya afya karibu." : "Please tell me your location so I can suggest nearby health facilities.";
        const outAsk = await translateText(askLoc, userLang);
        const payload = {
          message: outAsk,
          source: "location",
        };
        return res.status(200).json(cacheResponse(cacheKey, payload, CACHE_TTLS.location));
      }

      if (env.GOOGLE_MAPS_API_KEY) {
        try {
          let coordinates = effectiveLocation.coordinates || null;

          if (!coordinates) {
            const locationText = effectiveLocation.label || effectiveLocation.query || incomingMessage;
            const resolved = await getCoordinates(locationText);

            if (resolved) {
              coordinates = {
                latitude: resolved.latitude,
                longitude: resolved.longitude,
              };
            }
          }

          if (!coordinates) {
            throw new Error("Location not found");
          }

          const hospitals = await getNearbyHospitals(coordinates.latitude, coordinates.longitude);
          const reply = formatDirectionsResponse(hospitals, effectiveLocation.label || effectiveLocation.query || "your location");
          const outReply = await translateText(reply, userLang);
          const payload = {
            message: outReply,
            source: "google_maps",
            location: effectiveLocation,
          };

          return res.status(200).json(cacheResponse(cacheKey, payload, CACHE_TTLS.location));
        } catch (error) {
          logger.error({ error: error.message }, "Google Maps lookup failed");
          const errorMsg =
            "I couldn't find nearby hospitals. Please try again with a clearer location. If this is urgent, please go immediately to the nearest hospital.";
          const outError = await translateText(errorMsg, userLang);
          return res.status(200).json({
            message: outError,
            source: "google_maps_error",
          });
        }
      }

      const facilities = findNearbyFacilities(effectiveLocation);
      const response = formatFacilityResponse(
        facilities,
        effectiveLocation.label || effectiveLocation.query || "your location"
      );

      const outResp = await translateText(response, userLang);
      const payload = {
        message: outResp,
        source: "location",
        location: effectiveLocation,
      };
      return res.status(200).json(cacheResponse(cacheKey, payload, CACHE_TTLS.location));
    }

    if (incomingLocation) {
      const savedMsg = userLang === "sw" ? `Eneo limehifadhiwa kwa ${incomingLocation.label}. Uliza kuhusu vituo vya afya wakati wowote.` : `Location saved for ${incomingLocation.label}. Ask me for nearby health facilities anytime.`;
      const outSaved = await translateText(savedMsg, userLang);
      return res.status(200).json({
        message: outSaved,
        source: "location",
        location: incomingLocation,
      });
    }

    // If awaiting duration, try to parse it
    if (session.step === "awaiting_duration") {
      const duration = parseDuration(incomingMessage);
      if (!duration) {
        const askDur = userLang === "sw" ? "Tafadhali niambie kwa muda gani (mfano: 'siku 2')." : "Please tell me how long (e.g., '2 days').";
        const outAskDur = await translateText(askDur, userLang);
        return res.status(200).json({ message: outAskDur, source: "session" });
      }

      // Simple advice based on topic
      let advice = `I am not a doctor. You reported ${session.topic} for ${duration.raw}. `;
      if (session.topic === "headache") {
        advice += "General advice: rest, hydrate, consider paracetamol if appropriate. Seek care for severe or sudden headaches.";
      } else if (session.topic === "malaria") {
        advice += "If you have fever and suspect malaria, get tested at a health facility as soon as possible.";
      } else if (session.topic === "hiv_aids") {
        advice += "Seek testing at a clinic. If exposed within 72 hours, ask about PEP treatment.";
      } else {
        advice += "Please visit a health facility if symptoms persist or worsen.";
      }

      await sessionService.updateSession(from, { lastMessage: incomingMessage, step: null });
      const fullAdvice = `${advice} If severe, seek urgent care.`;
      const outAdvice = await translateText(fullAdvice, userLang);
      return res.status(200).json({ message: outAdvice, source: "session" });
    }

    // Topic detection and follow-up
    const topic = detectTopic(incomingMessage);
    if (topic) {
      await sessionService.updateSession(from, { topic, step: "awaiting_duration", lastMessage: incomingMessage });
      const qEn = `How long have you had ${topic.replace(/_/g, ' ')}? (e.g., 2 days)`;
      const qSw = `Umekuwa na ${topic.replace(/_/g, ' ')} kwa muda gani? (mfano: siku 2)`;
      const question = userLang === "sw" ? qSw : qEn;
      const outQuestion = await translateText(question, userLang);
      return res.status(200).json({ message: outQuestion, source: "session" });
    }

    // FAQ check
    if (faq) {
      const answer = faq.answer || faq.answer_en || faq.answer_sw || "";
      const translatedAnswer = await translateText(answer, userLang);
      const payload = { message: translatedAnswer, source: "faq", question: faq.question };
      return res.status(200).json(cacheResponse(cacheKey, payload, CACHE_TTLS.faq));
    }

    // Greeting detection - handle with dynamic AI response
    if (isGreeting(incomingMessage)) {
      try {
        const aiResponse = await generateAiResponse({
          userMessage: incomingMessage,
          language: userLang,
          history: ""
        });

        if (aiResponse && aiResponse.reply) {
          await sessionService.updateSession(from, { lastMessage: incomingMessage });
          logger.info({ from, detectedIntent: "greeting", responseSource: "ai" }, "Greeting response sent");
          
          return res.status(200).json({
            message: aiResponse.reply,
            source: "greeting",
          });
        }
      } catch (greetingError) {
        logger.error({ error: greetingError.message }, "Greeting AI response failed, using fallback");
      }
    }

    // Default
    const defaultMsg = userLang === "sw" ? "Sijaelewa vizuri, tafadhali eleza zaidi." : "Message received";
    const outDefault = await translateText(defaultMsg, userLang);
    const shouldPrompt = !session.lastFeedbackPromptAt;

    if (shouldPrompt) {
      await sessionService.updateSession(from, {
        lastFeedbackPromptAt: new Date().toISOString(),
      });
    }

    logger.info({ from, detectedIntent: "default", responseSource: "pending-ai" }, "Response sent");

    return res.status(200).json({
      message: appendFeedbackPrompt(outDefault, userLang, shouldPrompt),
      source: "pending-ai",
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, "Error in handleIncomingMessage");

    // Queue the failed message so the controller can try processing it again later.
    if (incomingMessage && from !== "unknown") {
      addToQueue({
        type: "ai_request",
        payload: { from, text: incomingMessage },
        handler: async () => {
          await processIncomingMessage({
            from,
            text: incomingMessage,
            source: "legacy-webhook-retry",
          });
        },
      });
    }

    return res.status(500).json({ error: error.message, source: "error" });
  }
}

module.exports = {
  handleIncomingMessage,
};
