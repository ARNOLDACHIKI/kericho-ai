function normalizePhoneNumber(phoneNumber = "") {
  return String(phoneNumber)
    .trim()
    .replace(/@s\.whatsapp\.net$/i, "")
    .replace(/@g\.us$/i, "")
    .replace(/[^\d]/g, "");
}

function buildWhatsAppJid(phoneNumber = "") {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized) {
    throw new Error("phoneNumber is required to build a WhatsApp JID");
  }

  return `${normalized}@s.whatsapp.net`;
}

module.exports = {
  normalizePhoneNumber,
  buildWhatsAppJid,
};