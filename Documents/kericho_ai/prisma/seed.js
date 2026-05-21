require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const articles = [
  {
    topic: "malaria",
    title: "Malaria prevention basics",
    content:
      "Use treated nets nightly, remove stagnant water, and get tested quickly after fever onset.",
    source: "Kenya Ministry of Health + WHO",
  },
  {
    topic: "maternal-health",
    title: "Safe pregnancy reminders",
    content:
      "Start antenatal care early, attend visits regularly, and seek urgent care for danger signs.",
    source: "Kenya Ministry of Health",
  },
  {
    topic: "nutrition",
    title: "Balanced diet guidance",
    content:
      "Include vegetables, fruits, proteins, whole grains, and safe water in daily meals.",
    source: "WHO Nutrition Guidance",
  },
  {
    topic: "mental-health",
    title: "Mental wellness support",
    content:
      "Seek support early for persistent sadness, anxiety, sleep disruption, or harmful thoughts.",
    source: "WHO mhGAP",
  },
  {
    topic: "hiv-aids",
    title: "HIV prevention and treatment",
    content:
      "Test regularly, use prevention methods, and begin ARV treatment early if positive.",
    source: "NASCOP Kenya",
  },
];

async function main() {
  console.log("Seeding knowledge base articles...");
  
  let count = 0;
  for (const article of articles) {
    try {
      await prisma.knowledgeArticle.create({ data: article });
      count++;
    } catch (error) {
      if (error.code === "P2002") {
        console.log(`Skipping duplicate: ${article.title}`);
      } else {
        throw error;
      }
    }
  }
  
  console.log(`Seeded ${count} knowledge articles`);

  // ===== Add placeholder translations for local Kalenjin languages =====
  // If you have a Bible DB or other translation source, replace these placeholders
  const kalenjinLangs = ["nandi", "kipsigis", "kalenjin"];
  let transCount = 0;

  for (const article of articles) {
    for (const lang of kalenjinLangs) {
      // avoid duplicates: check if an article for this topic+language exists
      const exists = await prisma.knowledgeArticle.findFirst({
        where: { topic: article.topic, language: lang },
      });
      if (exists) continue;

      try {
        await prisma.knowledgeArticle.create({
          data: {
            topic: article.topic,
            title: `${article.title} (${lang} translation pending)` ,
            content: `[TRANSLATION_PLACEHOLDER] This content is a placeholder for ${lang}. Replace with translations from your Bible DB or other trusted source.\n\nOriginal (EN):\n${article.content}`,
            language: lang,
            source: `placeholder: import from bible DB or provide ${lang} translations`,
          },
        });
        transCount++;
      } catch (err) {
        console.error(`Failed creating placeholder for ${article.title} (${lang}):`, err.message || err);
      }
    }
  }

  console.log(`Created ${transCount} placeholder translations for Kalenjin languages`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed complete");
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
