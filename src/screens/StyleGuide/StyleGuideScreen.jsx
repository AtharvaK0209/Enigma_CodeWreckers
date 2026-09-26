import React, { useState } from 'react';
import Card from '../../components/common/Card';
import PillButton from '../../components/common/PillButton';
import IconTile from '../../components/common/IconTile';
import { THEME } from '../../styles/tokens';
import {
  Nut,
  Wheat,
  ShieldAlert,
  Sparkle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ScanLine,
  Search,
  Sparkles
} from 'lucide-react';
import './StyleGuideScreen.css';

export default function StyleGuideScreen() {
  const [peanutSelected, setPeanutSelected] = useState(true);
  const [ckdSelected, setCkdSelected] = useState(true);
  const [customSelected, setCustomSelected] = useState(false);

  return (
    <div className="styleguide-screen anim-spring-pop">
      <header className="sg-header">
        <span className="sg-tag">Mission 1 Deliverable</span>
        <h1 className="sg-title">Design System Foundation</h1>
        <p className="sg-desc">
          Shared visual language tokens, primitives, and honest coverage components
          consumed across all missions.
        </p>
      </header>

      {/* Semantic Color Swatches */}
      <section className="sg-section">
        <h2 className="sg-section-title">Semantic Verdict Color Families</h2>
        <div className="sg-swatches-grid">
          <div className="sg-swatch safe-swatch">
            <div className="swatch-color" style={{ background: THEME.colors.safe.surface }}>
              <span className="swatch-label">Safe / Wholesome</span>
              <span className="swatch-code">{THEME.colors.safe.surface}</span>
            </div>
            <div className="swatch-details">
              <span>Text: {THEME.colors.safe.primaryText}</span>
              <span>Pill: {THEME.colors.safe.pillBg}</span>
            </div>
          </div>

          <div className="sg-swatch caution-swatch">
            <div className="swatch-color" style={{ background: THEME.colors.caution.surface }}>
              <span className="swatch-label">Caution / Advisory</span>
              <span className="swatch-code">{THEME.colors.caution.surface}</span>
            </div>
            <div className="swatch-details">
              <span>Text: {THEME.colors.caution.primaryText}</span>
              <span>Pill: {THEME.colors.caution.pillBg}</span>
            </div>
          </div>

          <div className="sg-swatch risk-swatch">
            <div className="swatch-color" style={{ background: THEME.colors.risk.surface }}>
              <span className="swatch-label">Risk Found / Allergen</span>
              <span className="swatch-code">{THEME.colors.risk.surface}</span>
            </div>
            <div className="swatch-details">
              <span>Text: {THEME.colors.risk.primaryText}</span>
              <span>Pill: {THEME.colors.risk.pillBg}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Shared Component 1: Card Primitives */}
      <section className="sg-section">
        <h2 className="sg-section-title">&lt;Card&gt; Primitive Variants</h2>
        <div className="sg-cards-grid">
          <Card variant="default">
            <h3 className="card-sample-title">Default Card</h3>
            <p className="card-sample-text">Pure white, 24px radius, soft ambient shadow.</p>
          </Card>

          <Card variant="safe">
            <h3 className="card-sample-title">Safe Surface</h3>
            <p className="card-sample-text">Vivid chartreuse lime hero surface for clean findings.</p>
          </Card>

          <Card variant="caution">
            <h3 className="card-sample-title">Caution Surface</h3>
            <p className="card-sample-text">Warm golden amber surface for advisories & checks.</p>
          </Card>

          <Card variant="risk">
            <h3 className="card-sample-title">Risk Surface</h3>
            <p className="card-sample-text">Coral crimson surface for direct allergen matches.</p>
          </Card>
        </div>
      </section>

      {/* Shared Component 2: PillButton Variants */}
      <section className="sg-section">
        <h2 className="sg-section-title">&lt;PillButton&gt; Primitives</h2>
        <div className="sg-buttons-row">
          <PillButton variant="primary" icon={ScanLine}>
            Primary Black Pill
          </PillButton>

          <PillButton variant="secondary" icon={Search}>
            Secondary Pill
          </PillButton>

          <PillButton variant="outline" iconRight={ArrowRight}>
            Outline Action
          </PillButton>

          <PillButton variant="danger">
            Danger Reset
          </PillButton>
        </div>
      </section>

      {/* Shared Component 3: IconTile with Limited Coverage Treatment */}
      <section className="sg-section">
        <h2 className="sg-section-title">&lt;IconTile&gt; and Limited-Coverage Treatment</h2>
        <p className="sg-section-desc">
          Demonstrating standard fully-supported allergens alongside the honest "Limited coverage" dashed border
          and muted badge for conditions with partial data (CKD, PCOS) and custom allergens.
        </p>

        <div className="sg-tiles-grid">
          {/* Fully supported allergen */}
          <IconTile
            icon={Nut}
            label="Peanuts"
            desc="Fully supported: direct match on all derivatives"
            selected={peanutSelected}
            onToggle={() => setPeanutSelected(!peanutSelected)}
          />

          {/* Condition with honest limited coverage */}
          <IconTile
            icon={ShieldAlert}
            label="Chronic Kidney Disease (CKD)"
            desc="Partial data availability in ingredient declarations"
            limitedCoverage={true}
            limitedNote="Limited coverage: ingredient databases rarely declare exact potassium or phosphorus levels."
            selected={ckdSelected}
            selectionTone="caution"
            onToggle={() => setCkdSelected(!ckdSelected)}
          />

          {/* Custom allergen with honest limited coverage */}
          <IconTile
            icon={Sparkles}
            label="Custom: Strawberries"
            desc="Custom user-entered allergen"
            limitedCoverage={true}
            limitedNote="Custom allergens rely on keyword matching, which may not catch complex derivatives or scientific names."
            selected={customSelected}
            onToggle={() => setCustomSelected(!customSelected)}
          />
        </div>
      </section>
    </div>
  );
}
