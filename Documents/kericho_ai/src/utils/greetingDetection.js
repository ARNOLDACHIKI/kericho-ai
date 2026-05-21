/**
 * Greeting detection utility
 * Detects common greeting patterns in multiple languages
 */

function isGreeting(message = "") {
  const text = String(message || "").trim().toLowerCase();

  // English greetings
  const englishGreetings = [
    "hi", "hello", "hey", "greetings", "good morning", 
    "good afternoon", "good evening", "morning", "afternoon", 
    "evening", "hola", "sup", "howdy", "what's up", "whats up", "yo"
  ];

  // Swahili greetings
  const swahiliGreetings = [
    "habari", "jambo", "salama", "habari yako", "habari gani", 
    "asubuhi", "jioni", "habarijeye", "nini habari"
  ];

  // Kalenjin greetings (common patterns)
  const kalenjinGreetings = [
    "kipkemboi", "sopa", "kipkei"
  ];

  // Combine all patterns
  const allGreetings = [...englishGreetings, ...swahiliGreetings, ...kalenjinGreetings];

  // Check for exact match or pattern
  return allGreetings.some(greeting => {
    // Exact match
    if (text === greeting) return true;
    
    // Check if it's just a greeting with punctuation
    const cleaned = text.replace(/[!?.,:;]+$/, "");
    if (cleaned === greeting) return true;
    
    // Check if it starts with greeting (for messages like "Hi, how are you?")
    if (text.startsWith(greeting + " ") || text.startsWith(greeting + ",")) return true;
    
    return false;
  });
}

module.exports = {
  isGreeting,
};
