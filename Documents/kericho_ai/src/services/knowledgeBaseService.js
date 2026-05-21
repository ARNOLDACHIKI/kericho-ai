const { includesAny } = require("../utils/text");
const healthKB = require("../data/healthKnowledgeBase.json");
const faqData = require("../data/frequentlyAsked.json");

function findHealthTopicResponse(message) {
  const messageLower = message.toLowerCase();

  // Check malaria topics
  if (includesAny(messageLower, ["malaria", "mosquito", "fever", "chills"])) {
    const malariaResponses = healthKB.malaria || [];
    if (malariaResponses.length > 0) {
      return {
        topic: "malaria",
        response: malariaResponses[0].content,
        contentSwahili: malariaResponses[0].contentSwahili,
        source: "knowledge-base",
      };
    }
  }

  // Check maternal health topics
  if (
    includesAny(messageLower, [
      "pregnant",
      "pregnancy",
      "antenatal",
      "mother",
      "baby",
      "mimba",
    ])
  ) {
    const maternalResponses = healthKB.maternal_health || [];
    if (maternalResponses.length > 0) {
      return {
        topic: "maternal_health",
        response: maternalResponses[0].content,
        contentSwahili: maternalResponses[0].contentSwahili,
        source: "knowledge-base",
      };
    }
  }

  // Check HIV/AIDS topics
  if (
    includesAny(messageLower, [
      "hiv",
      "aids",
      "arv",
      "pep",
      "prep",
      "msambao",
    ])
  ) {
    const hivResponses = healthKB.hiv_aids || [];
    if (hivResponses.length > 0) {
      return {
        topic: "hiv_aids",
        response: hivResponses[0].content,
        contentSwahili: hivResponses[0].contentSwahili,
        source: "knowledge-base",
      };
    }
  }

  // Check nutrition topics
  if (
    includesAny(messageLower, [
      "nutrition",
      "diet",
      "food",
      "vitamins",
      "balanced",
      "chakula",
    ])
  ) {
    const nutritionResponses = healthKB.nutrition || [];
    if (nutritionResponses.length > 0) {
      return {
        topic: "nutrition",
        response: nutritionResponses[0].content,
        contentSwahili: nutritionResponses[0].contentSwahili,
        source: "knowledge-base",
      };
    }
  }

  // Check mental health topics
  if (
    includesAny(messageLower, [
      "stress",
      "depression",
      "anxiety",
      "mental",
      "sleep",
      "hopeless",
    ])
  ) {
    const mentalResponses = healthKB.mental_health || [];
    if (mentalResponses.length > 0) {
      return {
        topic: "mental_health",
        response: mentalResponses[0].content,
        contentSwahili: mentalResponses[0].contentSwahili,
        source: "knowledge-base",
      };
    }
  }

  return null;
}

function findFAQResponse(message) {
  const messageLower = message.toLowerCase();

  for (const category of faqData) {
    const questions = category.questions || [];
    for (const item of questions) {
      const qLower = (item.q || "").toLowerCase();
      // Check if question keywords match
      const keywords = qLower.split(" ").filter((w) => w.length > 3);
      if (keywords.some((k) => messageLower.includes(k))) {
        return {
          category: category.category,
          question: item.q,
          answer: item.a,
          source: "faq",
        };
      }
    }
  }

  return null;
}

function findKnowledgeResponse(message) {
  // Try health topics first
  const topicMatch = findHealthTopicResponse(message);
  if (topicMatch) {
    return topicMatch;
  }

  // Try FAQ
  const faqMatch = findFAQResponse(message);
  if (faqMatch) {
    return faqMatch;
  }

  return null;
}

module.exports = {
  findKnowledgeResponse,
  findHealthTopicResponse,
  findFAQResponse,
};
