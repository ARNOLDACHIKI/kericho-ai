function normalizeText(text = "") {
  return String(text).trim().toLowerCase();
}

function includesAny(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(keyword));
}

module.exports = {
  normalizeText,
  includesAny,
};
