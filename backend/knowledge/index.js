import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let allergies = null;
let conditions = null;
let ingredientSynonyms = null;
let sources = null;

export function loadRiskKnowledgeBase() {
  try {
    const allergiesPath = path.join(__dirname, 'allergies.json');
    const conditionsPath = path.join(__dirname, 'conditions.json');
    const synonymsPath = path.join(__dirname, 'ingredient_synonyms.json');
    const sourcesPath = path.join(__dirname, 'sources.json');

    allergies = JSON.parse(fs.readFileSync(allergiesPath, 'utf8'));
    conditions = JSON.parse(fs.readFileSync(conditionsPath, 'utf8'));
    ingredientSynonyms = JSON.parse(fs.readFileSync(synonymsPath, 'utf8'));
    sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));

    console.log('[RKB] Risk Knowledge Base loaded successfully:');
    console.log(`  - Allergies: ${Object.keys(allergies).length} entries`);
    console.log(`  - Conditions: ${Object.keys(conditions).length} entries`);
    console.log(`  - Ingredient Synonyms: ${ingredientSynonyms.length} entries`);
    console.log(`  - Sources: ${sources.length} citations`);

    return {
      allergies,
      conditions,
      ingredientSynonyms,
      sources,
    };
  } catch (err) {
    console.error('[RKB] Failed to load Risk Knowledge Base from backend/knowledge/:', err.message);
    throw err;
  }
}

export function getRKB() {
  if (!allergies) {
    return loadRiskKnowledgeBase();
  }
  return {
    allergies,
    conditions,
    ingredientSynonyms,
    sources,
  };
}

export default {
  loadRiskKnowledgeBase,
  getRKB,
};
