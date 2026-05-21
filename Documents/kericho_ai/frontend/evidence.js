const topicButtons = document.getElementById("topicButtons");
const knowledgeCategories = document.getElementById("knowledgeCategories");
const conversationFlow = document.getElementById("conversationFlow");
const navigationButtons = document.getElementById("navigationButtons");
const simulationButtons = document.getElementById("simulationButtons");
const simulationPreview = document.getElementById("simulationPreview");

const topics = [
  "Maternal Health",
  "Nutrition",
  "Common Diseases",
  "HIV / SRH",
  "Mental Health",
  "Vaccination",
  "Child Growth",
  "Malaria",
];

const categories = [
  "Maternal health",
  "Nutrition",
  "Common diseases",
  "HIV/SRH",
  "Mental health",
  "Vaccination",
  "Child growth",
];

const flow = [
  "Greeting",
  "Menu selection",
  "User question",
  "AI answer",
  "Follow-up guidance",
];

const previewMessages = {
  "Maternal Health": "Antenatal care, danger signs, and safe nutrition for pregnancy.",
  Nutrition: "Eat a balanced plate with vegetables, fruits, proteins, and clean water.",
  "Common Diseases": "Symptoms, prevention, and when to visit a nearby health facility.",
  "HIV / SRH": "Safer sex, testing, prevention, and respectful reproductive health guidance.",
  "Mental Health": "Stress support, coping steps, and when to seek professional care.",
  Vaccination: "Child vaccine reminders and what each vaccine protects against.",
  "Child Growth": "Feeding, milestones, and signs that need clinic review.",
  Malaria: "Mosquito prevention, fever warning signs, and what to do next.",
};

const simulation = [
  { label: "English", preview: "English selected: reply in English with a concise health response." },
  { label: "Kiswahili", preview: "Kiswahili selected: jibu kwa Kiswahili kwa ufupi na kwa heshima." },
  { label: "Button reply", preview: "Interactive button reply received and routed through the normal conversation flow." },
  { label: "List reply", preview: "List reply received and matched to the selected topic." },
];

function createPill(label, className = "") {
  const el = document.createElement("span");
  el.className = className || "pill-chip";
  el.textContent = label;
  return el;
}

for (const topic of topics) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "topic-btn";
  button.textContent = topic;
  topicButtons.appendChild(button);
}

for (const category of categories) {
  knowledgeCategories.appendChild(createPill(category));
}

for (const step of flow) {
  const stepEl = document.createElement("div");
  stepEl.className = "step";
  stepEl.textContent = step;
  conversationFlow.appendChild(stepEl);
}

for (const topic of topics.slice(0, 6)) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "nav-btn";
  button.textContent = topic;
  button.addEventListener("click", () => {
    simulationPreview.textContent = previewMessages[topic] || previewMessages.Nutrition;
  });
  navigationButtons.appendChild(button);
}

for (const item of simulation) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "nav-btn";
  button.textContent = item.label;
  button.addEventListener("click", () => {
    simulationPreview.textContent = item.preview;
  });
  simulationButtons.appendChild(button);
}

simulationPreview.textContent = "Tap a topic, language, or button simulation option to preview how the bot responds.";
