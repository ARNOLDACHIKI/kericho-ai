/**
 * Scaffold importer for Bible translations.
 *
 * Purpose: provide a simple interface and instructions to import translations
 * into the knowledge base. This scaffold does not assume a specific Bible DB
 * format; instead it demonstrates how to wire an importer that maps
 * translation texts (by topic or key) to KnowledgeArticle entries.
 *
 * Usage (example):
 * 1) Create a JSON file with structure:
 *    {
 *      "language": "nandi",
 *      "mappings": {
 *         "malaria_intro": "<translated text>",
 *         "malaria_prevention": "<translated text>",
 *         ...
 *      }
 *    }
 *
 * 2) Set env: BIBLE_IMPORT_PATH=./data/nandi_translations.json
 * 3) Run: node scripts/import_bible_scaffold.js
 *
 * The script will upsert KnowledgeArticle rows by matching topic/id keys.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const importPath = process.env.BIBLE_IMPORT_PATH;
  if (!importPath) {
    console.error('Please set BIBLE_IMPORT_PATH to a JSON translation file (see scaffold header).');
    process.exit(1);
  }

  const abs = path.resolve(importPath);
  if (!fs.existsSync(abs)) {
    console.error('File not found:', abs);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const lang = payload.language;
  const mappings = payload.mappings || {};

  console.log(`Importing ${Object.keys(mappings).length} translations for language: ${lang}`);

  let upserted = 0;
  for (const key of Object.keys(mappings)) {
    const text = mappings[key];
    // Try to find by topic or id; this is a best-effort mapping.
    // We assume keys are either article ids used in src/data/healthKnowledgeBase.json
    // or topic names. Adjust logic according to your translation data.

    // Strategy: try to find article by id (title id mapping not present in DB),
    // otherwise create a new KnowledgeArticle with topic=key
    const existing = await prisma.knowledgeArticle.findFirst({ where: { topic: key, language: lang } });
    if (existing) {
      await prisma.knowledgeArticle.update({ where: { id: existing.id }, data: { content: text } });
      upserted++;
      continue;
    }

    // create new record
    await prisma.knowledgeArticle.create({ data: { topic: key, title: `${key} (${lang})`, content: text, language: lang, source: 'imported from user Bible DB' } });
    upserted++;
  }

  console.log(`Imported/updated ${upserted} translations for ${lang}`);
  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error('Import failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
