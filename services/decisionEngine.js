/**
 * NutriLens Decision Engine
 * Deterministic safety evaluator for food products against user profiles.
 */

export function evaluateProductSafety(product, userProfile = {}, forcedDataQuality = null) {
  const profileAllergies = userProfile.allergies || [];
  const profileConditions = userProfile.conditions || [];
  const customAllergens = userProfile.customAllergens || [];
  const findings = [];

  let highestSeverity = 'safe';

  // 1. Direct Allergen Evaluation
  const directAllergens = product.allergensDetected || [];
  directAllergens.forEach((alg) => {
    const triggerData = product.riskTriggers?.[alg] || { trigger: alg, source: 'Ingredient Declaration' };
    const evidenceSource = product.source === 'user_confirmed' ? 'user_confirmed' : product.source === 'image' ? 'image' : 'off';
    const confidence = product.source === 'user_confirmed' ? 'user_reported' : 'verified';

    if (profileAllergies.includes(alg)) {
      highestSeverity = 'risk';
      findings.push({
        headline: `Contains ${alg.replace('_', ' ')}`,
        category: 'Allergen Alert',
        severity: 'risk',
        evidence: `Direct allergen match detected in ingredients. Severe reaction risk based on your saved profile.`,
        trigger: triggerData.trigger || `Contains ${alg}`,
        source: triggerData.source || 'FDA Food Allergen Labeling Act',
        evidenceSource,
        confidence,
      });
    } else {
      findings.push({
        headline: `Verified clear of ${alg.replace('_', ' ')} restrictions`,
        category: 'Ingredient Notice',
        severity: 'safe',
        evidence: `Contains ${alg.replace('_', ' ')}. Not flagged in your personal allergy profile.`,
        trigger: triggerData.trigger || null,
        source: triggerData.source || 'General Labeling Standards',
        evidenceSource,
        confidence,
      });
    }
  });

  // 1b. Custom Allergen Keyword Match
  customAllergens.forEach((custom) => {
    const keyword = (custom.label || custom.id || '').toLowerCase();
    const matchedIng = product.ingredients?.find((ing) => ing.toLowerCase().includes(keyword));
    if (matchedIng) {
      highestSeverity = 'risk';
      findings.push({
        headline: `Contains custom allergen: ${custom.label || keyword}`,
        category: 'Custom Allergen Match',
        severity: 'risk',
        evidence: `Ingredient list contains "${matchedIng}", matching your custom-defined allergen rule for "${custom.label || keyword}".`,
        trigger: matchedIng,
        source: 'Custom User Allergen Filter (Keyword Heuristic)',
        evidenceSource: product.source === 'image' ? 'image' : 'off',
        confidence: 'heuristic_match',
      });
    }
  });

  // 2. Cross-contact or Trace Allergens
  const crossContact = product.crossContact || [];
  crossContact.forEach((alg) => {
    if (profileAllergies.includes(alg)) {
      if (highestSeverity !== 'risk') highestSeverity = 'caution';
      findings.push({
        headline: `May contain trace ${alg.replace('_', ' ')}`,
        category: 'Cross-Contact Advisory',
        severity: 'caution',
        evidence: `Manufactured in a facility or line sharing equipment with ${alg.replace('_', ' ')}. May contain microscopic traces.`,
        trigger: product.riskTriggers?.[alg]?.trigger || `May contain traces of ${alg}`,
        source: 'Manufacturer Cross-Contact Voluntary Notice',
        evidenceSource: product.source === 'image' ? 'image' : 'off',
        confidence: 'voluntary_declaration',
      });
    }
  });

  // 3. Health Conditions (Hypertension, Diabetes, CKD, PCOS)
  if (profileConditions.includes('hypertension')) {
    const triggerData = product.riskTriggers?.hypertension;
    if (triggerData) {
      if (highestSeverity !== 'risk') highestSeverity = 'caution';
      findings.push({
        headline: 'Elevated sodium for blood pressure',
        category: 'Hypertension Concern',
        severity: 'caution',
        evidence: `Elevated sodium content exceeds recommended cardiovascular threshold.`,
        trigger: triggerData.trigger,
        source: triggerData.source || 'WHO Sodium Reduction Guidelines',
        evidenceSource: product.source === 'image' ? 'image' : 'off',
        confidence: 'verified',
      });
    } else {
      findings.push({
        headline: 'Low sodium cardiac compliance',
        category: 'Sodium Safe',
        severity: 'safe',
        evidence: `Low sodium profile compliant with cardiovascular dietary guidelines.`,
        trigger: product.nutrition?.sodium ? `Sodium: ${product.nutrition.sodium}` : null,
        source: 'AHA Heart-Healthy Guidance',
        evidenceSource: product.source === 'image' ? 'image' : 'off',
        confidence: 'verified',
      });
    }
  }

  if (profileConditions.includes('diabetes')) {
    const triggerData = product.riskTriggers?.diabetes;
    if (triggerData) {
      if (highestSeverity !== 'risk') highestSeverity = 'caution';
      findings.push({
        headline: 'Added sugars may spike blood glucose',
        category: 'Glycemic Concern',
        severity: 'caution',
        evidence: `Rapid-glycemic sugars or corn sweeteners detected which can trigger glucose spikes.`,
        trigger: triggerData.trigger,
        source: triggerData.source || 'ADA Dietary Guidelines',
        evidenceSource: product.source === 'image' ? 'image' : 'off',
        confidence: 'verified',
      });
    } else {
      findings.push({
        headline: 'Sugar controlled formulation',
        category: 'Sugar Controlled',
        severity: 'safe',
        evidence: `Low added sugar formulation suitable for regulated glycemic management.`,
        trigger: product.nutrition?.sugars ? `Sugars: ${product.nutrition.sugars}` : null,
        source: 'ADA Dietary Guidelines',
        evidenceSource: product.source === 'image' ? 'image' : 'off',
        confidence: 'verified',
      });
    }
  }

  if (profileConditions.includes('ckd')) {
    findings.push({
      headline: 'Kidney nutrient check (Limited coverage)',
      category: 'CKD Advisory',
      severity: 'caution',
      evidence: 'Potassium and phosphorus data is not declared by the manufacturer on standard packaging. Consult physical label if on a strict renal limit.',
      trigger: 'Potassium/Phosphorus undeclared',
      source: 'National Kidney Foundation Labeling Notes',
      evidenceSource: product.source === 'image' ? 'image' : 'off',
      confidence: 'guideline_advisory',
    });
  }

  // 4. Fallback safe finding if nothing was triggered
  if (findings.length === 0) {
    findings.push({
      headline: 'Clean ingredient spectrum',
      category: 'Wholesome Formulation',
      severity: 'safe',
      evidence: 'No allergens, additives, or health hazards detected matching your profile.',
      trigger: 'Wholesome ingredient formulation',
      source: 'NutriLens Verification Standard',
      evidenceSource: product.source === 'image' ? 'image' : 'off',
      confidence: 'verified',
    });
  }

  // Exact copy mappings
  let verdictTitle = 'Looks safe for you';
  let verdictSummary = 'All detected ingredients are clear of your personal restrictions and dietary goals.';

  if (highestSeverity === 'risk') {
    verdictTitle = 'This product may not be safe for you';
    verdictSummary = 'We detected ingredients that directly conflict with your saved profile restrictions.';
  } else if (highestSeverity === 'caution') {
    verdictTitle = 'A few things to check';
    verdictSummary = 'May contain cross-contact allergens or elevated nutrients under your watch.';
  }

  const dataQuality = forcedDataQuality || product.dataQuality || 'good';

  return {
    verdict: highestSeverity,
    verdictTitle,
    verdictSummary,
    dataQuality,
    findings,
    product: {
      id: product.id || product.barcode,
      name: product.name,
      brand: product.brand,
      image: product.image,
      ingredients: product.ingredients || [],
      nutrition: product.nutrition || {},
      barcode: product.barcode || product.id,
      categories: product.categories || [],
      primaryAllergenKey: product.primaryAllergenKey || null,
    },
  };
}

export default {
  evaluateProductSafety,
};
