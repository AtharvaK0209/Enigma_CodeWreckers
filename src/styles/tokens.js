// NutriLens Design System Tokens
// Implements mobile wellness reference design language

export const THEME = {
  colors: {
    bgApp: '#FAF8F5',
    bgSurface: '#FFFFFF',
    bgSurfaceSubtle: '#F4F2EC',
    textPrimary: '#181816',
    textSecondary: '#6B6862',
    textTertiary: '#9E9B95',
    borderSubtle: 'rgba(0, 0, 0, 0.05)',
    btnPrimaryBg: '#111111',
    btnPrimaryText: '#FFFFFF',

    // Verdict state color families (Lime/Safe, Amber/Caution, Coral/Risk)
    safe: {
      surface: '#E4FA75', // Vivid chartreuse/lime
      surfaceSubtle: '#F4FDE5',
      primaryText: '#183D1B',
      accent: '#22C55E',
      pillBg: '#153C19',
      pillText: '#E4FA75',
      badgeBorder: 'rgba(21, 60, 25, 0.15)',
    },
    caution: {
      surface: '#FDE68A', // Warm golden amber
      surfaceSubtle: '#FFFBEB',
      primaryText: '#4B2A04',
      accent: '#F59E0B',
      pillBg: '#3B2202',
      pillText: '#FDE68A',
      badgeBorder: 'rgba(59, 34, 2, 0.15)',
    },
    risk: {
      surface: '#FECDD3', // Coral crimson
      surfaceSubtle: '#FFF1F2',
      primaryText: '#520F15',
      accent: '#EF4444',
      pillBg: '#43080C',
      pillText: '#FECDD3',
      badgeBorder: 'rgba(67, 8, 12, 0.15)',
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
    card: '0 8px 30px -4px rgba(24, 23, 21, 0.05), 0 3px 10px -2px rgba(24, 23, 21, 0.03)',
    cardHover: '0 16px 40px -4px rgba(24, 23, 21, 0.08), 0 6px 18px -2px rgba(24, 23, 21, 0.05)',
    navPill: '0 12px 36px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.15)',
    dropdown: '0 12px 32px rgba(0, 0, 0, 0.12)',
  },

  motion: {
    easeSpring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    easeSmooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    durationFast: '180ms',
    durationNormal: '300ms',
    durationSlow: '500ms',
  },

  // 7 standard allergen keys + 2 conditions
  allergens: [
    { id: 'peanut', label: 'Peanuts', icon: 'Nut', desc: 'Peanut proteins & peanut oil' },
    { id: 'milk', label: 'Dairy / Milk', icon: 'Milk', desc: 'Casein, whey, lactose' },
    { id: 'egg', label: 'Eggs', icon: 'Egg', desc: 'Egg whites & yolk proteins' },
    { id: 'tree_nuts', label: 'Tree Nuts', icon: 'Trees', desc: 'Almonds, cashews, walnuts' },
    { id: 'wheat', label: 'Wheat / Gluten', icon: 'Wheat', desc: 'Wheat flour, gluten, barley' },
    { id: 'soy', label: 'Soybeans', icon: 'Bean', desc: 'Soy lecithin, soy protein' },
    { id: 'sesame', label: 'Sesame', icon: 'Sparkles', desc: 'Sesame seeds, tahini, sesame oil' },
  ],

  conditions: [
    { id: 'hypertension', label: 'Hypertension', icon: 'HeartPulse', desc: 'Sodium monitoring (<600mg per serving)' },
    { id: 'diabetes', label: 'Diabetes', icon: 'Activity', desc: 'Added sugars, glycemic spikes & carbs' },
  ],
};
