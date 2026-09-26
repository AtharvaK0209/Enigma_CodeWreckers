import React from 'react';
import { Package, ImageOff, ShieldAlert, Sparkles, Scale, Info } from 'lucide-react';
import Card from './common/Card';
import './OffProductInfo.css';

/**
 * OffProductInfo Component (Mission 6)
 * Displays canonical Open Food Facts product data.
 * Section must be labeled exactly: "Product Information — Open Food Facts"
 * Missing fields explicitly display "Information unavailable".
 */
export default function OffProductInfo({ product = {} }) {
  const canonical = product.canonicalProduct || product;

  const name = canonical.name || 'Information unavailable';
  const brand = canonical.brand || 'Information unavailable';
  const barcode = canonical.barcode || product.id || 'Information unavailable';
  const imageUrl = canonical.imageUrl || product.image || null;
  const ingredientsText =
    canonical.ingredientsText ||
    (canonical.ingredients && canonical.ingredients.length > 0
      ? canonical.ingredients
          .map((i) => (typeof i === 'string' ? i : `${i.name || 'Ingredient'}${i.quantity ? ` (${i.quantity})` : ''}`))
          .join(', ')
      : null);
  const allergens = canonical.allergens && canonical.allergens.length > 0 ? canonical.allergens.join(', ') : null;
  const traces = canonical.traces && canonical.traces.length > 0 ? canonical.traces.join(', ') : null;
  const servingSize = canonical.servingSize || null;

  const nutrition = canonical.nutrition || {};

  const formatNutrient = (val, unit = 'g') => {
    if (val === null || val === undefined || val === '') return 'Information unavailable';
    if (typeof val === 'object' && val !== null) {
      if (val.value === null || val.value === undefined || val.value === '') return 'Information unavailable';
      return `${val.value}${val.unit || unit}`;
    }
    if (typeof val === 'string' && (val.includes('g') || val.includes('mg') || val.includes('kcal'))) {
      return val;
    }
    return `${val}${unit}`;
  };

  const formatEnergy = (val) => {
    if (val === null || val === undefined || val === '') return 'Information unavailable';
    if (typeof val === 'object' && val !== null) {
      if (val.value === null || val.value === undefined || val.value === '') return 'Information unavailable';
      return `${val.value} kcal`;
    }
    return `${val} kcal`;
  };

  return (
    <Card className="off-product-info-card anim-spring-pop">
      <div className="off-section-header">
        <div className="off-badge-row">
          <span className="off-provenance-tag">
            <Package size={13} />
            <span>Open Food Facts v3 Verified</span>
          </span>
        </div>
        <h3 className="off-section-title">Product Information — Open Food Facts</h3>
        <p className="off-section-subtitle">
          Canonical catalog data retrieved directly from the Open Food Facts international public registry.
        </p>
      </div>

      <div className="off-product-hero-layout">
        {/* Real Product Image or Graceful Unavailable Box (Never fake placeholder) */}
        <div className="off-image-container">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name !== 'Information unavailable' ? name : 'Product Image'}
              className="off-product-real-img"
              loading="lazy"
            />
          ) : (
            <div className="off-image-unavailable">
              <ImageOff size={32} strokeWidth={1.75} />
              <span>Image unavailable</span>
            </div>
          )}
        </div>

        {/* Basic Identity Metadata */}
        <div className="off-identity-meta">
          <div className="off-meta-row">
            <span className="off-meta-label">Product Name</span>
            <span className={`off-meta-val ${name === 'Information unavailable' ? 'is-unavailable' : ''}`}>
              {name}
            </span>
          </div>

          <div className="off-meta-row">
            <span className="off-meta-label">Brand</span>
            <span className={`off-meta-val ${brand === 'Information unavailable' ? 'is-unavailable' : ''}`}>
              {brand}
            </span>
          </div>

          <div className="off-meta-row">
            <span className="off-meta-label">Barcode (GTIN / EAN)</span>
            <span className={`off-meta-val code-font ${barcode === 'Information unavailable' ? 'is-unavailable' : ''}`}>
              {barcode}
            </span>
          </div>

          <div className="off-meta-row">
            <span className="off-meta-label">Serving Size</span>
            <span className={`off-meta-val ${!servingSize ? 'is-unavailable' : ''}`}>
              {servingSize || 'Information unavailable'}
            </span>
          </div>
        </div>
      </div>

      {/* Ingredients Statement */}
      <div className="off-text-section">
        <h4 className="off-sub-heading">Ingredients List</h4>
        <div className="off-text-box">
          <p className={!ingredientsText ? 'is-unavailable' : ''}>
            {ingredientsText || 'Information unavailable'}
          </p>
        </div>
      </div>

      {/* Allergens & Cross-Contact Traces */}
      <div className="off-allergens-dual-row">
        <div className="off-allergen-col">
          <h4 className="off-sub-heading">Declared Allergens</h4>
          <span className={`off-pill-tag ${!allergens ? 'is-unavailable' : 'has-declared'}`}>
            {allergens || 'Information unavailable'}
          </span>
        </div>

        <div className="off-allergen-col">
          <h4 className="off-sub-heading">Traces / May Contain</h4>
          <span className={`off-pill-tag ${!traces ? 'is-unavailable' : 'has-traces'}`}>
            {traces || 'Information unavailable'}
          </span>
        </div>
      </div>

      {/* Nutritional Breakdown Table */}
      <div className="off-nutrition-section">
        <h4 className="off-sub-heading">Nutritional Breakdown (per 100g)</h4>
        <div className="off-nutrition-grid">
          <div className="off-nutri-item">
            <span className="off-nutri-label">Energy</span>
            <span className={`off-nutri-val ${nutrition.energy === null || nutrition.energy === undefined ? 'is-unavailable' : ''}`}>
              {formatEnergy(nutrition.energy)}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Carbohydrates</span>
            <span className={`off-nutri-val ${nutrition.carbohydrates === null || nutrition.carbohydrates === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.carbohydrates, 'g')}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Sugars</span>
            <span className={`off-nutri-val ${nutrition.sugars === null || nutrition.sugars === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.sugars, 'g')}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Dietary Fiber</span>
            <span className={`off-nutri-val ${nutrition.fiber === null || nutrition.fiber === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.fiber, 'g')}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Protein</span>
            <span className={`off-nutri-val ${nutrition.protein === null || nutrition.protein === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.protein, 'g')}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Total Fat</span>
            <span className={`off-nutri-val ${nutrition.fat === null || nutrition.fat === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.fat, 'g')}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Saturated Fat</span>
            <span className={`off-nutri-val ${nutrition.saturatedFat === null || nutrition.saturatedFat === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.saturatedFat, 'g')}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Trans Fat</span>
            <span className={`off-nutri-val ${nutrition.transFat === null || nutrition.transFat === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.transFat, 'g')}
            </span>
          </div>

          <div className="off-nutri-item">
            <span className="off-nutri-label">Sodium</span>
            <span className={`off-nutri-val ${nutrition.sodium === null || nutrition.sodium === undefined ? 'is-unavailable' : ''}`}>
              {formatNutrient(nutrition.sodium, 'g')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
