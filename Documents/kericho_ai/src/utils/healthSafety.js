const { includesAny, normalizeText } = require("./text");

const EMERGENCY_KEYWORDS = [
  "chest pain",
  "cannot breathe",
  "can't breathe",
  "difficulty breathing",
  "shortness of breath",
  "stroke",
  "severe bleeding",
  "unconscious",
  "heart attack",
  "fainting",
  "seizure",
  "convulsion",
  "severe chest pain",
  "blue lips",
  "kupumua kwa shida",
  "maumivu ya kifua",
  "kupoteza fahamu",
  "kutokwa damu nyingi",
];

const PROHIBITED_MEDICAL_ADVICE_KEYWORDS = [
  "what medicine should i take",
  "which drug",
  "prescribe",
  "dose",
  "dosage",
  "how many tablets",
  "treatment for cancer",
  "cure diabetes",
  "treat heart attack",
  "antibiotic",
  "insulin dose",
  "inhaler dose",
  "self medicate",
];

const DISEASE_KEYWORDS = {
  cardiovascular: [
    "heart",
    "cardiac",
    "blood pressure",
    "hypertension",
    "cholesterol",
    "stroke",
    "cardiovascular",
    "blood vessel",
    "hypertensive",
  ],
  diabetes: [
    "diabetes",
    "blood sugar",
    "glucose",
    "insulin",
    "hba1c",
    "sugar",
    "prediabetes",
  ],
  cancer: [
    "cancer",
    "tumor",
    "tumour",
    "chemotherapy",
    "screening",
    "biopsy",
    "malignancy",
    "oncology",
  ],
  respiratory: [
    "breathing",
    "lungs",
    "asthma",
    "cough",
    "wheezing",
    "wheeze",
    "respiratory",
    "shortness of breath",
    "pneumonia",
    "copd",
    "bronchitis",
  ],
};

const CATEGORY_HINTS = {
  emergency_escalation: ["emergency", "urgent", "danger", "critical", "immediate"],
  symptom_guidance: ["symptom", "sign", "notice", "feel", "experience"],
  prevention_tips: ["prevent", "avoid", "lower risk", "reduce risk", "how can i stop"],
  lifestyle_advice: ["lifestyle", "diet", "exercise", "sleep", "weight", "habits"],
  healthy_habits: ["healthy", "habits", "routine", "exercise", "sleep"],
};

function detectEmergency(message = "") {
  return includesAny(message, EMERGENCY_KEYWORDS);
}

function detectProhibitedMedicalAdvice(message = "") {
  return includesAny(message, PROHIBITED_MEDICAL_ADVICE_KEYWORDS);
}

function detectDiseaseArea(message = "") {
  const normalized = normalizeText(message);

  for (const [diseaseArea, keywords] of Object.entries(DISEASE_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return diseaseArea;
    }
  }

  return "general";
}

function detectResponseCategory(message = "") {
  const normalized = normalizeText(message);

  for (const [category, keywords] of Object.entries(CATEGORY_HINTS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return "general_awareness";
}

function getHealthcareDisclaimer(language = "en") {
  if (language === "sw") {
    return "Mimi si daktari. Taarifa hii ni ya elimu tu; tafadhali pata ushauri wa kitaalamu wa afya kwa uchunguzi au matibabu.";
  }

  return "I am not a doctor. This is health education only; please consult a qualified healthcare professional for diagnosis or treatment.";
}

function getEmergencyGuidance(language = "en") {
  if (language === "sw") {
    return `${getHealthcareDisclaimer(language)} Hii inaonekana kama dharura. Tafadhali nenda hospitali mara moja au piga 112/999 sasa.`;
  }

  return `${getHealthcareDisclaimer(language)} This sounds like an emergency. Please go to the nearest hospital immediately or call 112/999 now.`;
}

function getSafeFallbackResponse({ language = "en", diseaseArea = "general", category = "general_awareness" } = {}) {
  const promptByDisease = {
    cardiovascular:
      language === "sw"
        ? "Kwa masuala ya moyo na shinikizo la damu, tafadhali zungumza na mtaalamu wa afya. Unapunguza hatari kwa lishe bora, mazoezi, na kuepuka sigara."
        : "For heart and blood pressure concerns, please speak with a healthcare professional. Risk can be lowered with healthy food, regular activity, and avoiding tobacco.",
    diabetes:
      language === "sw"
        ? "Kwa afya ya kisukari, ushauri wa kitaalamu ni muhimu. Mabadiliko ya lishe, mazoezi, na ufuatiliaji wa sukari husaidia kupunguza hatari."
        : "For diabetes care, professional guidance is important. Healthy eating, activity, and blood sugar checks can help reduce risk.",
    cancer:
      language === "sw"
        ? "Kwa saratani, tafadhali pata ushauri wa daktari au kituo cha afya. Uchunguzi wa mapema na uelewa wa dalili ni muhimu."
        : "For cancer, please consult a doctor or health facility. Early screening and awareness of warning signs are important.",
    respiratory:
      language === "sw"
        ? "Kwa afya ya kupumua, tafadhali pata tathmini ya kitaalamu ikiwa dalili zinaendelea. Epuka moshi, vumbi, na zingatia chanjo inapopendekezwa."
        : "For breathing health, please seek professional assessment if symptoms continue. Avoid smoke and dust, and keep recommended vaccines up to date.",
    general:
      language === "sw"
        ? "Tafadhali pata ushauri wa kitaalamu wa afya kwa mwongozo sahihi. Ninaweza kusaidia na elimu ya kinga na uelewa wa dalili kwa ujumla."
        : "Please consult a qualified healthcare professional for accurate guidance. I can help with prevention and general symptom awareness.",
  };

  const core = promptByDisease[diseaseArea] || promptByDisease.general;
  const categoryNote =
    category === "prevention_tips"
      ? language === "sw"
        ? " Zaidi ya hapo, zingatia kinga kama chakula bora, mazoezi, na uchunguzi wa mara kwa mara."
        : " For prevention, focus on healthy food, exercise, and regular checkups."
      : category === "lifestyle_advice"
        ? language === "sw"
          ? " Tabia za afya kama usingizi wa kutosha, maji ya kutosha, na kuacha sigara zinaweza kusaidia."
          : " Healthy habits like enough sleep, hydration, and avoiding tobacco can help."
        : "";

  return `${getHealthcareDisclaimer(language)} ${core}${categoryNote}`.trim();
}

function shouldBlockMedicalAdvice(message = "") {
  return detectProhibitedMedicalAdvice(message);
}

module.exports = {
  EMERGENCY_KEYWORDS,
  PROHIBITED_MEDICAL_ADVICE_KEYWORDS,
  detectEmergency,
  detectProhibitedMedicalAdvice,
  detectDiseaseArea,
  detectResponseCategory,
  getHealthcareDisclaimer,
  getEmergencyGuidance,
  getSafeFallbackResponse,
  shouldBlockMedicalAdvice,
};