/**
 * Open Food Facts API Client
 * Public database integration for barcode lookup and catalog search.
 * Strictly fetches, parses, and normalizes product data without synthetic fallbacks or medical rules.
 */

// Cache storage for product lookups
const productCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Extracts and maps all available Open Food Facts image URLs
 */
export function extractImages(p) {
  if (!p) return { front: null, ingredients: null, nutrition: null, packaging: null };

  const selected = p.selected_images || {};
  const getSelectedUrl = (type) => {
    const item = selected[type]?.display;
    if (!item) return null;
    return item.en || item.fr || item.de || item.it || item.es || Object.values(item)[0] || null;
  };

  const front = p.image_front_url || getSelectedUrl('front') || p.image_url || null;
  const ingredients = p.image_ingredients_url || getSelectedUrl('ingredients') || null;
  const nutrition = p.image_nutrition_url || getSelectedUrl('nutrition') || null;
  const packaging = p.image_packaging_url || getSelectedUrl('packaging') || null;

  return {
    front,
    ingredients,
    nutrition,
    packaging,
  };
}

/**
 * Extracts declared allergens from OFF tags
 */
export function extractAllergens(p) {
  if (!p) return [];
  if (Array.isArray(p.allergens_tags) && p.allergens_tags.length > 0) {
    return p.allergens_tags
      .map((t) => String(t).replace(/^[a-z]{2}:/, '').toLowerCase().trim())
      .filter(Boolean);
  }
  if (p.allergens && typeof p.allergens === 'string') {
    return p.allergens
      .split(/[,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

/**
 * Extracts traces / cross-contact warnings from OFF tags
 */
export function extractTraces(p) {
  if (!p) return [];
  if (Array.isArray(p.traces_tags) && p.traces_tags.length > 0) {
    return p.traces_tags
      .map((t) => String(t).replace(/^[a-z]{2}:/, '').toLowerCase().trim())
      .filter(Boolean);
  }
  if (p.traces && typeof p.traces === 'string') {
    return p.traces
      .split(/[,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

/**
 * Extracts numeric nutrition values per 100g without fabricating data
 */
export function extractNutrition(p) {
  const n = (p && p.nutriments) || {};
  const getNum = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  return {
    energy: getNum(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? n['energy_100g'] ?? n.energy),
    carbohydrates: getNum(n.carbohydrates_100g ?? n.carbohydrates),
    sugars: getNum(n.sugars_100g ?? n.sugars),
    fiber: getNum(n.fiber_100g ?? n.fiber),
    protein: getNum(n.proteins_100g ?? n.proteins),
    fat: getNum(n.fat_100g ?? n.fat),
    saturatedFat: getNum(n['saturated-fat_100g'] ?? n['saturated-fat']),
    transFat: getNum(n['trans-fat_100g'] ?? n['trans-fat']),
    sodium: getNum(n.sodium_100g ?? n.sodium),
  };
}

/**
 * ONE canonical function for both barcode lookup and product search (Requirement 6 & 7)
 */
export function mapOFFProduct(p, explicitBarcode = null) {
  if (!p) return null;

  const barcode = String(p.code || p.id || explicitBarcode || '').trim();
  const name = p.product_name || p.product_name_en || p.generic_name || null;
  const brand = p.brands || p.brand_owner || null;
  const images = extractImages(p);
  const imageUrl = images.front || p.image_url || null;

  let ingredientsText = null;
  if (p.ingredients_text || p.ingredients_text_en) {
    ingredientsText = (p.ingredients_text || p.ingredients_text_en).trim();
  } else if (Array.isArray(p.ingredients) && p.ingredients.length > 0) {
    ingredientsText = p.ingredients.map((i) => i.text || i.id?.replace(/^[a-z]{2}:/, '')).filter(Boolean).join(', ');
  }

  const allergens = extractAllergens(p);
  const traces = extractTraces(p);
  const servingSize = p.serving_size || null;
  const nutrition = extractNutrition(p);

  return {
    source: 'openfoodfacts',
    barcode,
    name,
    brand,
    imageUrl,
    images,
    ingredientsText,
    allergens,
    traces,
    servingSize,
    nutrition,
  };
}

export const productApiService = {
  mapOFFProduct,

  /**
   * Fetch product from Open Food Facts v3 API
   * Verified against scanned barcode before returning canonical object.
   */
  async getByBarcode(barcode) {
    const cleanCode = String(barcode || '').trim();
    if (!cleanCode) {
      console.warn('[OFF] Empty or invalid barcode received');
      return {
        success: false,
        found: false,
        error: 'BARCODE_NOT_RECEIVED',
      };
    }

    console.log(`[OFF] requested barcode: ${cleanCode}`);

    // Check Cache
    const cached = productCache.get(cleanCode);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[OFF Cache HIT] Serving barcode ${cleanCode} from cache`);
      return {
        success: true,
        found: true,
        product: cached.data,
      };
    }

    try {
      const url = `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(cleanCode)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NutriLens/1.0 (safety@nutrilens.app)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      console.log(`[OFF] response status: ${response.status}`);

      if (response.status === 404) {
        return {
          success: false,
          found: false,
          error: 'PRODUCT_NOT_FOUND',
        };
      }

      if (response.ok) {
        const json = await response.json();
        if (json.status === 'failure' || json.result?.id === 'product_not_found' || !json.product) {
          return {
            success: false,
            found: false,
            error: 'PRODUCT_NOT_FOUND',
          };
        }

        const p = json.product;
        const returnedBarcode = String(p.code || p.id || '').trim();

        console.log(`[OFF] returned barcode: ${returnedBarcode}`);
        console.log(`[OFF] returned product: ${p.product_name || p.product_name_en || 'Unknown'}`);

        // Requirement 5: Compare scanned barcode vs returned barcode
        const isBarcodeMatch =
          returnedBarcode === cleanCode ||
          returnedBarcode.replace(/^0+/, '') === cleanCode.replace(/^0+/, '') ||
          cleanCode.padStart(13, '0') === returnedBarcode;

        if (returnedBarcode && !isBarcodeMatch) {
          console.warn(`[OFF] Barcode mismatch! Requested: ${cleanCode}, Returned: ${returnedBarcode}`);
          return {
            success: false,
            found: false,
            error: 'OFF_RESULT_BARCODE_MISMATCH',
          };
        }

        const canonical = mapOFFProduct(p, cleanCode);
        console.log(`[OFF] image: ${canonical.imageUrl}`);
        console.log(`[MAP] canonical product: ${canonical.name} (${canonical.barcode})`);

        productCache.set(cleanCode, { data: canonical, timestamp: Date.now() });
        return {
          success: true,
          found: true,
          product: canonical,
        };
      }
    } catch (err) {
      console.warn(`[OFF] Live Open Food Facts lookup failed: ${err.message}`);
    }

    return {
      success: false,
      found: false,
      error: 'PRODUCT_NOT_FOUND',
    };
  },

  /**
   * Search food catalog by query string (Requirement 8)
   */
  async searchFood(query, pageSize = 15) {
    const cleanQ = String(query || '').trim().toLowerCase();
    if (!cleanQ) return [];

    const cacheKey = `search_${cleanQ}`;
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const endpoints = [
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQ)}&search_simple=1&action=process&json=1&page_size=${pageSize}`,
      `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(cleanQ)}&search_simple=1&action=process&json=1&page_size=${pageSize}`,
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'NutriLens/1.0 (safety@nutrilens.app)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.products && Array.isArray(json.products) && json.products.length > 0) {
            const mapped = json.products.map((p) => mapOFFProduct(p)).filter(Boolean);
            productCache.set(cacheKey, { data: mapped, timestamp: Date.now() });
            return mapped;
          }
        }
      } catch (err) {
        console.warn(`[ProductAPI] Search query attempt failed on ${url}: ${err.message}`);
      }
    }

    // No fake fallback products!
    return [];
  },

  _clearCache() {
    productCache.clear();
  },
};

export default productApiService;
