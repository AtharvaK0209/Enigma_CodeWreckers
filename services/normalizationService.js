/**
 * NutriLens Normalization Service
 * Bridges canonical Open Food Facts product objects with the Risk Knowledge Base (RKB).
 * Detects allergens from ingredient synonyms and checks nutritional guidance from WHO/FDA.
 */
import { getRKB } from '../backend/knowledge/index.js';

export function normalizeWithRKB(canonicalProduct) {
  if (!canonicalProduct) return null;

  const { allergies, conditions, ingredientSynonyms, sources } = getRKB();

  const allergensDetected = new Set();
  const riskTriggers = {};
  const crossContact = new Set();

  const ingredientsText = (canonicalProduct.ingredientsText || '').toLowerCase();
  const rawIngredients = canonicalProduct.ingredientsText
    ? canonicalProduct.ingredientsText.split(/[,;(]/).map((s) => s.replace(/[).]/g, '').trim()).filter(Boolean)
    : [];

  // 1. Direct allergen tags from OFF
  if (Array.isArray(canonicalProduct.allergens)) {
    canonicalProduct.allergens.forEach((tag) => {
      const cleanTag = tag.replace(/^[a-z]{2}:/, '').toLowerCase().trim();
      for (const [algKey, algData] of Object.entries(allergies)) {
        if (
          cleanTag === algKey ||
          cleanTag.includes(algKey) ||
          algData.label_signals?.contains?.some((c) => cleanTag.includes(c))
        ) {
          allergensDetected.add(algKey);
          riskTriggers[algKey] = {
            trigger: `Label allergen tag: ${tag}`,
            source: algData.source_ids?.[0] || 'FDA_MAJOR_ALLERGENS',
          };
        }
      }
    });
  }

  // 2. Ingredient Synonyms Mapping against RKB (Mission 0 & Mission 7)
  if (Array.isArray(ingredientSynonyms)) {
    for (const syn of ingredientSynonyms) {
      const algId = syn.allergen_id;
      const matchedTerm = syn.terms.find((term) => {
        const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'i');
        return regex.test(ingredientsText);
      });

      if (matchedTerm) {
        allergensDetected.add(algId);
        const sourceId = allergies[algId]?.source_ids?.[0] || 'FDA_MAJOR_ALLERGENS';
        riskTriggers[algId] = {
          trigger: `Identified ingredient: ${matchedTerm}`,
          source: sourceId,
        };
      }
    }
  }

  // 3. Traces / Cross-contact detection
  if (Array.isArray(canonicalProduct.traces)) {
    canonicalProduct.traces.forEach((trace) => {
      const cleanTrace = trace.replace(/^[a-z]{2}:/, '').toLowerCase().trim();
      for (const [algKey, algData] of Object.entries(allergies)) {
        if (
          cleanTrace === algKey ||
          cleanTrace.includes(algKey) ||
          algData.label_signals?.may_contain?.some((m) => cleanTrace.includes(m))
        ) {
          crossContact.add(algKey);
          riskTriggers[algKey] = riskTriggers[algKey] || {
            trigger: `May contain trace: ${trace}`,
            source: 'Manufacturer Cross-Contact Voluntary Notice',
          };
        }
      }
    });
  }

  // 4. Nutritional conditions from RKB (Hypertension -> WHO_SODIUM, Diabetes -> WHO_HEALTHY_DIET)
  const nutrition = canonicalProduct.nutrition || {};

  // Sodium evaluation (WHO recommends < 2000mg/day. Standard per-100g caution threshold: > 0.4g / 400mg)
  const sodiumVal = nutrition.sodium !== null && nutrition.sodium !== undefined
    ? Number(nutrition.sodium)
    : null;

  if (sodiumVal !== null) {
    // If sodium is given in grams (> 0.4g) or mg (> 400mg)
    const sodiumMg = sodiumVal < 10 ? sodiumVal * 1000 : sodiumVal;
    if (sodiumMg >= 400) {
      const sourceId = conditions.hypertension?.guidance?.[0]?.source_id || 'WHO_SODIUM';
      riskTriggers.hypertension = {
        trigger: `Sodium ${Math.round(sodiumMg)}mg / 100g`,
        source: sourceId,
      };
    }
  }

  // Sugars evaluation (WHO recommends limiting free sugars; high sugar threshold: > 15g / 100g)
  const sugarsVal = nutrition.sugars !== null && nutrition.sugars !== undefined
    ? Number(nutrition.sugars)
    : null;

  if (sugarsVal !== null && sugarsVal >= 15) {
    const sourceId = conditions.diabetes?.guidance?.[0]?.source_id || 'WHO_HEALTHY_DIET';
    riskTriggers.diabetes = {
      trigger: `Sugars ${Math.round(sugarsVal)}g / 100g`,
      source: sourceId,
    };
  }

  return {
    ...canonicalProduct,
    id: canonicalProduct.barcode,
    barcode: canonicalProduct.barcode,
    name: canonicalProduct.name || 'Food Product',
    brand: canonicalProduct.brand || '',
    image: canonicalProduct.imageUrl || null,
    imageUrl: canonicalProduct.imageUrl || null,
    ingredients: rawIngredients,
    ingredientsText: canonicalProduct.ingredientsText || '',
    allergensDetected: Array.from(allergensDetected),
    crossContact: Array.from(crossContact),
    riskTriggers,
    source: canonicalProduct.source || 'off',
  };
}

export default {
  normalizeWithRKB,
};
