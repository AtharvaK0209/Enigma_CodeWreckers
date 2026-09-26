/**
 * Open Food Facts API Client
 * Public database integration with in-memory lookup caching (Mission 9).
 */

// Cache storage for Mission 9
const productCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Offline database fallback
export const FALLBACK_PRODUCTS = {
  '8000500310427': {
    id: '8000500310427',
    barcode: '8000500310427',
    name: 'Hazelnut Cocoa Spread',
    brand: 'Nutella',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    ingredients: ['Sugar', 'Palm Oil', 'Hazelnuts (13%)', 'Skimmed Milk Powder (8.7%)', 'Fat-Reduced Cocoa (7.4%)', 'Emulsifier: Lecithins (Soy)', 'Vanillin'],
    nutrition: { sodium: '42mg', sugars: '56.3g', calories: '539 kcal' },
    allergensDetected: ['tree_nuts', 'milk', 'soy'],
    categories: ['spreads', 'chocolate-spreads', 'hazelnut-spreads'],
    primaryAllergenKey: 'tree_nuts',
    riskTriggers: {
      tree_nuts: { trigger: 'Hazelnuts (13%)', source: 'FDA Food Allergen Labeling Act' },
      milk: { trigger: 'Skimmed Milk Powder (8.7%)', source: 'Food Allergen Labeling Act' },
      soy: { trigger: 'Soy Lecithins', source: 'FDA Allergen Mandate' },
      diabetes: { trigger: 'Sugar 56.3g / 100g', source: 'ADA Sugar Guidelines' },
    },
  },
  '7622210449283': {
    id: '7622210449283',
    barcode: '7622210449283',
    name: 'Original Sandwich Cookies',
    brand: 'Oreo',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    ingredients: ['Wheat Flour', 'Sugar', 'Palm Oil', 'Rapeseed Oil', 'Fat-Reduced Cocoa Powder', 'Wheat Starch', 'Glucose-Fructose Syrup', 'Raising Agents', 'Salt', 'Emulsifier (Soya Lecithins)', 'Flavoring'],
    nutrition: { sodium: '380mg', sugars: '41g', calories: '474 kcal' },
    allergensDetected: ['wheat', 'soy'],
    crossContact: ['milk', 'peanut'],
    categories: ['biscuits-and-cakes', 'cookies', 'sandwich-cookies'],
    primaryAllergenKey: 'wheat',
    riskTriggers: {
      wheat: { trigger: 'Wheat Flour & Wheat Starch', source: 'Codex Alimentarius Gluten Standard' },
      soy: { trigger: 'Soya Lecithins', source: 'FALCPA Guidance' },
      milk: { trigger: 'Facility cross-contact with Milk', source: 'Label Advisory Note' },
      peanut: { trigger: 'May contain peanut traces', source: 'Manufacturer Advisory' },
      diabetes: { trigger: 'Glucose-Fructose Syrup (41g sugars)', source: 'ADA Sugar Alert' },
    },
  },
  '030000010204': {
    id: '030000010204',
    barcode: '030000010204',
    name: 'Organic Whole Grain Rolled Oats',
    brand: 'Bob\'s Red Mill',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
    ingredients: ['100% Whole Grain Rolled Oats (Certified Gluten-Free)'],
    nutrition: { sodium: '0mg', sugars: '1g', calories: '150 kcal' },
    allergensDetected: [],
    categories: ['plant-based-foods', 'cereals-and-potatoes', 'rolled-oats'],
    riskTriggers: {},
  },
  '5449000000996': {
    id: '5449000000996',
    barcode: '5449000000996',
    name: 'Nitro Surge Carbonated Energy Drink',
    brand: 'Volt Energy',
    image: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=500&auto=format&fit=crop&q=80',
    ingredients: ['Carbonated Water', 'High Fructose Corn Syrup', 'Citric Acid', 'Taurine', 'Sodium Citrate', 'Caffeine (160mg)', 'Sodium Benzoate', 'Sucralose', 'Niacinamide'],
    nutrition: { sodium: '840mg', sugars: '54g', calories: '210 kcal' },
    allergensDetected: [],
    categories: ['beverages', 'energy-drinks'],
    primaryAllergenKey: 'hypertension',
    riskTriggers: {
      hypertension: { trigger: 'Sodium 840mg & 160mg Synthetic Caffeine', source: 'AHA Cardiovascular Warning' },
      diabetes: { trigger: 'High Fructose Corn Syrup (54g sugars)', source: 'ADA Glycemic Alert' },
    },
  },
};

/**
 * Normalizes Open Food Facts allergen tags to NutriLens internal keys
 */
function normalizeAllergens(allergensTags = [], ingredientsText = '') {
  const set = new Set();
  const text = (ingredientsText || '').toLowerCase();

  for (const tag of allergensTags) {
    const clean = tag.replace(/^[a-z]{2}:/, '').toLowerCase();
    if (clean.includes('peanut')) set.add('peanut');
    else if (clean.includes('tree-nut') || clean.includes('nut') || clean.includes('almond') || clean.includes('hazelnut') || clean.includes('walnut')) set.add('tree_nuts');
    else if (clean.includes('milk') || clean.includes('dairy') || clean.includes('lactose')) set.add('milk');
    else if (clean.includes('gluten') || clean.includes('wheat')) set.add('wheat');
    else if (clean.includes('egg')) set.add('egg');
    else if (clean.includes('soy')) set.add('soy');
    else if (clean.includes('fish')) set.add('fish');
    else if (clean.includes('crustacean') || clean.includes('shellfish')) set.add('shellfish');
    else if (clean.includes('sesame')) set.add('sesame');
  }

  // Also check ingredients text
  if (text.includes('peanut')) set.add('peanut');
  if (text.includes('hazelnut') || text.includes('almond') || text.includes('cashew') || text.includes('walnut') || text.includes('pistachio')) set.add('tree_nuts');
  if (text.includes('milk') || text.includes('whey') || text.includes('casein')) set.add('milk');
  if (text.includes('wheat') || text.includes('gluten') || text.includes('barley') || text.includes('rye')) set.add('wheat');
  if (text.includes('egg')) set.add('egg');
  if (text.includes('soy') || text.includes('soya')) set.add('soy');
  if (text.includes('sesame') || text.includes('tahini')) set.add('sesame');

  return Array.from(set);
}

/**
 * Normalizes an Open Food Facts product JSON to standard NutriLens Product shape
 */
export function normalizeOFFProduct(p) {
  if (!p) return null;

  const barcode = p.code || p._id || p.id;
  const name = p.product_name || p.product_name_en || p.generic_name || 'Food Product';
  const brand = p.brands || p.brand_owner || '';
  const image = p.image_front_url || p.image_url || null;

  let ingredients = [];
  if (p.ingredients && Array.isArray(p.ingredients)) {
    ingredients = p.ingredients.map((ing) => ing.text || ing.id?.replace(/^[a-z]{2}:/, '')).filter(Boolean);
  } else if (p.ingredients_text) {
    ingredients = p.ingredients_text.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }

  const nutriments = p.nutriments || {};
  const sodiumVal = nutriments['sodium_100g'] !== undefined ? `${Math.round(nutriments['sodium_100g'] * 1000)}mg` : nutriments['sodium_serving'] ? `${nutriments['sodium_serving']}g` : null;
  const sugarsVal = nutriments['sugars_100g'] !== undefined ? `${Math.round(nutriments['sugars_100g'])}g` : nutriments['sugars'] ? `${nutriments['sugars']}g` : null;
  const energyVal = nutriments['energy-kcal_100g'] !== undefined ? `${Math.round(nutriments['energy-kcal_100g'])} kcal` : nutriments['energy-kcal'] ? `${nutriments['energy-kcal']} kcal` : null;

  const allergensDetected = normalizeAllergens(p.allergens_tags || p.allergens_hierarchy || [], p.ingredients_text);

  const categories = (p.categories_tags || []).map((c) => c.replace(/^[a-z]{2}:/, '').toLowerCase());

  // Determine risk triggers
  const riskTriggers = {};
  allergensDetected.forEach((alg) => {
    riskTriggers[alg] = {
      trigger: alg.replace('_', ' '),
      source: 'Open Food Facts Ingredient Database',
    };
  });

  if (nutriments['sugars_100g'] > 20) {
    riskTriggers.diabetes = {
      trigger: `High Sugars (${sugarsVal} / 100g)`,
      source: 'ADA Glycemic Alert',
    };
  }

  if (nutriments['sodium_100g'] > 0.6) {
    riskTriggers.hypertension = {
      trigger: `Elevated Sodium (${sodiumVal} / 100g)`,
      source: 'AHA Cardiovascular Warning',
    };
  }

  return {
    id: barcode,
    barcode,
    name,
    brand,
    image,
    ingredients,
    nutrition: {
      sodium: sodiumVal || '0mg',
      sugars: sugarsVal || '0g',
      calories: energyVal || '0 kcal',
    },
    allergensDetected,
    categories,
    primaryAllergenKey: allergensDetected[0] || null,
    riskTriggers,
    source: 'off',
  };
}

export const productApiService = {
  /**
   * Fetch product from Open Food Facts v3 API
   * Maps response into canonical internal product object (Mission 3).
   * Populates only fields OFF returned, leaves missing fields null.
   */
  async getByBarcode(barcode) {
    const cleanCode = (barcode || '').trim();
    if (!cleanCode) return null;

    // Check Cache (Mission 9)
    const cached = productCache.get(cleanCode);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[ProductAPI Cache HIT] Serving barcode ${cleanCode} from cache`);
      return { ...cached.data, _fromCache: true };
    }

    console.log(`[ProductAPI Cache MISS] Fetching barcode ${cleanCode} from Open Food Facts`);

    try {
      const url = `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(cleanCode)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NutriLens/1.0 (safety@nutrilens.app; +https://nutrilens.app)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(7000),
      });

      if (response.status === 404) {
        console.log(`[ProductAPI] Open Food Facts returned 404 for barcode: ${cleanCode}`);
        return null;
      }

      if (response.ok) {
        const json = await response.json();
        if (json.status === 'failure' || json.result?.id === 'product_not_found' || !json.product) {
          console.log(`[ProductAPI] Product not found in OFF for barcode: ${cleanCode}`);
          return null;
        }

        const p = json.product;
        const nutriments = p.nutriments || {};

        const canonical = {
          source: 'openfoodfacts',
          barcode: cleanCode,
          name: p.product_name || p.product_name_en || null,
          brand: p.brands || null,
          imageUrl: p.image_url || p.image_front_url || null,
          ingredientsText: p.ingredients_text || p.ingredients_text_en || null,
          allergens: Array.isArray(p.allergens_tags)
            ? p.allergens_tags.map((t) => t.replace(/^[a-z]{2}:/, '').toLowerCase().trim())
            : [],
          traces: Array.isArray(p.traces_tags)
            ? p.traces_tags.map((t) => t.replace(/^[a-z]{2}:/, '').toLowerCase().trim())
            : [],
          servingSize: p.serving_size || null,
          nutrition: {
            energy: nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? nutriments['energy_100g'] ?? nutriments.energy ?? null,
            carbohydrates: nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? null,
            sugars: nutriments.sugars_100g ?? nutriments.sugars ?? null,
            fiber: nutriments.fiber_100g ?? nutriments.fiber ?? null,
            protein: nutriments.proteins_100g ?? nutriments.proteins ?? null,
            fat: nutriments.fat_100g ?? nutriments.fat ?? null,
            saturatedFat: nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat'] ?? null,
            transFat: nutriments['trans-fat_100g'] ?? nutriments['trans-fat'] ?? null,
            sodium: nutriments.sodium_100g ?? nutriments.sodium ?? null,
          },
        };

        productCache.set(cleanCode, { data: canonical, timestamp: Date.now() });
        return canonical;
      }
    } catch (err) {
      console.warn(`[ProductAPI] Live Open Food Facts lookup failed: ${err.message}.`);
      // Fallback only if offline and cached fallback exists
      if (FALLBACK_PRODUCTS[cleanCode]) {
        console.log(`[ProductAPI] Using offline fallback for known barcode: ${cleanCode}`);
        const fb = FALLBACK_PRODUCTS[cleanCode];
        const canonicalFallback = {
          source: 'openfoodfacts',
          barcode: cleanCode,
          name: fb.name || null,
          brand: fb.brand || null,
          imageUrl: fb.image || null,
          ingredientsText: fb.ingredients ? fb.ingredients.join(', ') : null,
          allergens: fb.allergensDetected || [],
          traces: fb.crossContact || [],
          servingSize: fb.servingSize || null,
          nutrition: {
            energy: fb.nutrition?.calories ? parseInt(fb.nutrition.calories) : null,
            carbohydrates: null,
            sugars: fb.nutrition?.sugars ? parseFloat(fb.nutrition.sugars) : null,
            fiber: null,
            protein: null,
            fat: null,
            saturatedFat: null,
            transFat: null,
            sodium: fb.nutrition?.sodium ? parseFloat(fb.nutrition.sodium) : null,
          },
        };
        return canonicalFallback;
      }
    }

    return null;
  },

  /**
   * Search Open Food Facts by category or keyword
   */
  async searchByCategory(category, pageSize = 15) {
    const cleanCat = (category || '').trim().toLowerCase();
    const cacheKey = `cat_${cleanCat}`;
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const url = `https://world.openfoodfacts.org/category/${encodeURIComponent(cleanCat)}.json?page_size=${pageSize}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NutriLens/1.0 (safety@nutrilens.app)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.products && Array.isArray(json.products)) {
          const list = json.products.map(normalizeOFFProduct).filter(Boolean);
          productCache.set(cacheKey, { data: list, timestamp: Date.now() });
          return list;
        }
      }
    } catch (err) {
      console.warn(`[ProductAPI] Category search failed for ${cleanCat}: ${err.message}`);
    }

    // Fallback: search across local database items matching category or keyword
    const localMatches = Object.values(FALLBACK_PRODUCTS).filter((p) =>
      (p.categories || []).some((c) => c.includes(cleanCat) || cleanCat.includes(c))
    );
    return localMatches;
  },

  /**
   * Search food catalog by query string
   */
  async searchFood(query, pageSize = 15) {
    const cleanQ = (query || '').trim().toLowerCase();
    if (!cleanQ) return [];

    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQ)}&search_simple=1&action=process&json=1&page_size=${pageSize}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NutriLens/1.0 (safety@nutrilens.app)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.products && Array.isArray(json.products)) {
          return json.products.map(normalizeOFFProduct).filter(Boolean);
        }
      }
    } catch (err) {
      console.warn(`[ProductAPI] Search query failed for ${cleanQ}: ${err.message}`);
    }

    // Fallback to local products
    return Object.values(FALLBACK_PRODUCTS).filter(
      (p) =>
        p.name.toLowerCase().includes(cleanQ) ||
        (p.brand && p.brand.toLowerCase().includes(cleanQ)) ||
        p.ingredients.some((i) => i.toLowerCase().includes(cleanQ))
    );
  },

  // Cache inspector for Mission 9 acceptance verification
  _getCacheStats() {
    return {
      size: productCache.size,
      keys: Array.from(productCache.keys()),
    };
  },

  _clearCache() {
    productCache.clear();
  },
};

export default productApiService;
