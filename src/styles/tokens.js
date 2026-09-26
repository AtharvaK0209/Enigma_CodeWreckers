// NutriLens Design System Tokens
// Formalized design language: warm cream, rounded cards, black pill CTAs,
// semantic safe/caution/risk palette, and limited-coverage treatment.

export const THEME = {
  colors: {
    bgApp: '#FAF8F5',
    bgSurface: '#FFFFFF',
    bgSurfaceSubtle: '#F3F1EB',
    bgMuted: '#ECEAE2',
    textPrimary: '#171715',
    textSecondary: '#6B6862',
    textTertiary: '#9E9B95',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    btnPrimaryBg: '#111111',
    btnPrimaryText: '#FFFFFF',

    // Limited coverage indicator (for non-deterministic conditions & custom allergens)
    limitedCoverage: {
      border: 'rgba(120, 115, 105, 0.35)',
      badgeBg: '#ECE9E0',
      badgeText: '#625E57',
      noticeBg: '#F7F5EE',
    },

    // Semantic verdict state color families
    safe: {
      surface: '#E4FA75', // Vivid chartreuse / fresh lime
      surfaceSubtle: '#F4FDE5',
      primaryText: '#163A1D',
      accent: '#22C55E',
      pillBg: '#14381B',
      pillText: '#E4FA75',
      badgeBorder: 'rgba(20, 56, 27, 0.15)',
    },
    caution: {
      surface: '#FDE68A', // Warm golden amber
      surfaceSubtle: '#FFFBEB',
      primaryText: '#452600',
      accent: '#F59E0B',
      pillBg: '#3B2202',
      pillText: '#FDE68A',
      badgeBorder: 'rgba(59, 34, 2, 0.15)',
    },
    risk: {
      surface: '#FECDD3', // Coral crimson
      surfaceSubtle: '#FFF1F2',
      primaryText: '#50100C',
      accent: '#EF4444',
      pillBg: '#400A06',
      pillText: '#FECDD3',
      badgeBorder: 'rgba(64, 10, 6, 0.15)',
    },
  },

  radii: {
    xs: '6px',
    sm: '12px',
    md: '18px',
    lg: '24px',
    xl: '32px',
    pill: '9999px',
  },

  shadows: {
    card: '0 8px 30px -4px rgba(24, 23, 21, 0.04), 0 3px 10px -2px rgba(24, 23, 21, 0.02)',
    cardHover: '0 16px 40px -4px rgba(24, 23, 21, 0.08), 0 6px 18px -2px rgba(24, 23, 21, 0.04)',
    navPill: '0 14px 38px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.15)',
  },

  motion: {
    easeSpring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    easeSmooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    durationFast: '180ms',
    durationNormal: '300ms',
    durationSlow: '500ms',
  },

  // 9 major food allergens (FDA & International Top 9)
  allergens: [
    { id: 'peanut', label: 'Peanuts', icon: 'Nut', desc: 'Peanut proteins, peanut flour & oils' },
    { id: 'milk', label: 'Dairy / Milk', icon: 'Milk', desc: 'Casein, whey, milk fat & lactose' },
    { id: 'egg', label: 'Eggs', icon: 'Egg', desc: 'Egg whites, yolk & albumin proteins' },
    { id: 'wheat', label: 'Wheat / Gluten', icon: 'Wheat', desc: 'Wheat flour, semolina, spelt & gluten' },
    { id: 'tree_nuts', label: 'Tree Nuts', icon: 'Trees', desc: 'Almonds, cashews, walnuts, hazelnuts' },
    { id: 'soy', label: 'Soybeans', icon: 'Bean', desc: 'Soy protein, soy lecithin & edamame' },
    { id: 'fish', label: 'Fish', icon: 'Fish', desc: 'Cod, salmon, tuna, anchovies' },
    { id: 'shellfish', label: 'Crustacean Shellfish', icon: 'Shrimp', desc: 'Shrimp, crab, lobster, prawn' },
    { id: 'sesame', label: 'Sesame', icon: 'Sparkles', desc: 'Sesame seeds, tahini, sesame oil' },
  ],

  // Conditions with explicit honesty on risk engine support
  conditions: [
    {
      id: 'hypertension',
      label: 'Hypertension',
      icon: 'HeartPulse',
      desc: 'High sodium monitoring (<600mg per serving)',
      isFullySupported: true,
    },
    {
      id: 'diabetes',
      label: 'Diabetes',
      icon: 'Activity',
      desc: 'Sugar & high-glycemic sweeteners alerts',
      isFullySupported: true,
    },
    {
      id: 'ckd',
      label: 'Chronic Kidney Disease (CKD)',
      icon: 'ShieldAlert',
      desc: 'Potassium, phosphorus, and protein scrutiny',
      isFullySupported: false,
      limitedNote: 'Limited coverage: ingredient databases rarely declare exact potassium or phosphorus levels.',
    },
    {
      id: 'pcos',
      label: 'PCOS Management',
      icon: 'Sparkle',
      desc: 'Low-glycemic and anti-inflammatory suggestions',
      isFullySupported: false,
      limitedNote: 'Limited coverage: no deterministic nutrient thresholds; flags general refined carbohydrates only.',
    },
  ],
};
