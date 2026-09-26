import React from 'react';
import RiskCard from '../../components/RiskCard';
import './DevCardsScreen.css';

export default function DevCardsScreen() {
  const sampleFindings = [
    {
      id: 'f-risk-1',
      category: 'Allergen Alert',
      severity: 'risk',
      evidence: 'Direct presence of Roasted Hazelnuts (13%) and Skimmed Milk Powder detected in formulation. This directly matches your saved Tree Nut & Dairy restrictions.',
      trigger: 'Hazelnuts & Skimmed Milk Powder',
      source: 'FDA Food Allergen Labeling and Consumer Protection Act (FALCPA)',
    },
    {
      id: 'f-caution-1',
      category: 'Cross-Contact Advisory',
      severity: 'caution',
      evidence: 'Product packaging declares that this item was packaged on a shared production line handling peanuts and sesame seeds. May contain microscopic airborne dust residues.',
      trigger: 'Shared production line with Peanuts',
      source: 'Manufacturer Cross-Contact Voluntary Notice',
    },
    {
      id: 'f-caution-2',
      category: 'Hypertension Warning',
      severity: 'caution',
      evidence: 'Contains 840mg of sodium per serving, which represents 42% of the recommended daily limit for adult cardiovascular maintenance.',
      trigger: 'Sodium 840mg / serving',
      source: 'WHO Guideline on Sodium Intake for Adults & Children',
    },
    {
      id: 'f-safe-1',
      category: 'Gluten & Wheat Verification',
      severity: 'safe',
      evidence: 'Batch certified gluten-free through third-party ELISA laboratory testing with less than 5 ppm gluten content.',
      trigger: 'Certified Gluten-Free Oats',
      source: 'Gluten-Free Certification Organization (GFCO)',
    },
    {
      id: 'f-null-fields',
      category: 'General Additive Clearance',
      severity: 'safe',
      evidence: 'No artificial azo dyes, sulfites, or controversial emulsifiers identified. Pure natural formulation with simple whole food components.',
      trigger: null, // Test null trigger
      source: null,  // Test null source
    },
    {
      id: 'f-long-text',
      category: 'Extended Trace Analysis (Stress Test)',
      severity: 'risk',
      evidence: 'This is an unusually long finding text designed to stress-test layout wrapping: The analysis detected multiple compound allergens including hydrolyzed soy protein, defatted peanut flour, and whey protein isolate concentrated from bovine dairy. Even trace ingestion could elicit an anaphylactic reaction for sensitized individuals according to clinical allergy immunology frameworks. Ensure immediate epinephrine availability if accidental exposure occurs.',
      trigger: 'Hydrolyzed soy & defatted peanut flour compound matrix',
      source: 'International Food Allergy Research Resource Database (FARRP)',
    },
  ];

  return (
    <div className="dev-cards-screen anim-spring-pop">
      <header className="dev-header">
        <span className="dev-tag">Mission 5 Verification</span>
        <h1 className="dev-title">RiskCard Component Gallery</h1>
        <p className="dev-subtitle">
          Isolated testing surface showcasing `RiskCard.jsx` across all severity variants (`safe`, `caution`, `risk`),
          with optional/null `trigger` and `source` handling, plus word-wrap stress testing.
        </p>
      </header>

      <section className="cards-stack">
        {sampleFindings.map((finding) => (
          <div key={finding.id} className="card-wrapper">
            <div className="card-variant-label">
              <span>Severity: <strong>{finding.severity.toUpperCase()}</strong></span>
              {finding.trigger ? <span className="meta-badge">Has Trigger</span> : <span className="meta-badge null-badge">Null Trigger</span>}
              {finding.source ? <span className="meta-badge">Has Source</span> : <span className="meta-badge null-badge">Null Source</span>}
            </div>
            <RiskCard
              category={finding.category}
              severity={finding.severity}
              evidence={finding.evidence}
              trigger={finding.trigger}
              source={finding.source}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
