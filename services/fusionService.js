/**
 * NutriLens Fusion Service
 * Combines multimodal inputs (barcode database, OCR image text, user confirmation)
 * into a single unified ProductData representation with rigorous quality provenance.
 */

export function fuseProductData({
  source = 'off',
  barcodeData = null,
  ocrText = null,
  userConfirmedAllergens = null,
  rawProduct = null,
  forcedDataQuality = null,
}) {
  let product = rawProduct ? { ...rawProduct } : {};

  if (barcodeData) {
    product = { ...barcodeData, ...product };
  }

  // Handle User Confirmed flow (Mission 6 USP)
  if (source === 'user_confirmed' || userConfirmedAllergens) {
    const allergens = Array.isArray(userConfirmedAllergens) ? userConfirmedAllergens : [];
    product.source = 'user_confirmed';
    product.allergensDetected = allergens;
    product.dataQuality = 'low'; // Never upgraded to good!

    // Build risk triggers tagged with user_confirmed
    product.riskTriggers = product.riskTriggers || {};
    allergens.forEach((alg) => {
      product.riskTriggers[alg] = {
        trigger: `User-confirmed allergen: ${alg.replace('_', ' ')}`,
        source: 'User Clarification Response',
        evidenceSource: 'user_confirmed',
        confidence: 'user_reported',
      };
    });

    if (!product.name) {
      product.name = 'Packaged Product (User Clarified)';
    }
  } else if (source === 'image' || ocrText) {
    product.source = 'image';
    if (!forcedDataQuality) {
      product.dataQuality = product.dataQuality || 'partial';
    }
  } else {
    product.source = product.source || 'off';
    if (!forcedDataQuality) {
      product.dataQuality = product.dataQuality || 'good';
    }
  }

  if (forcedDataQuality) {
    // If the source was user_confirmed, enforce constraint that it cannot be upgraded to 'good'
    if (source === 'user_confirmed' && forcedDataQuality === 'good') {
      product.dataQuality = 'low';
    } else {
      product.dataQuality = forcedDataQuality;
    }
  }

  return product;
}

export default {
  fuseProductData,
};
