import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  name: 'Yunus',
  age: '19',
  allergies: ['peanut', 'tree_nuts'],
  customAllergens: [],
  conditions: ['diabetes'],
  onboardingComplete: true,
};

const DEFAULT_RECENT_CHECKS = [
  {
    id: 'chk-1',
    name: 'Chocolate Bar',
    brand: 'SweetCraft',
    barcode: '8000500310427',
    verdict: 'risk',
    statusText: 'Potential concern',
    flagCount: 2,
    timestamp: '15m ago',
    image: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'chk-2',
    name: 'Protein Cereal',
    brand: 'PureGrain',
    barcode: '030000010204',
    verdict: 'safe',
    statusText: 'No relevant concerns found',
    flagCount: 0,
    timestamp: '2h ago',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'chk-3',
    name: 'Instant Noodles',
    brand: 'NoodleHouse',
    barcode: '5449000000996',
    verdict: 'caution',
    statusText: 'Review recommended',
    flagCount: 1,
    timestamp: 'Yesterday',
    image: 'https://images.unsplash.com/photo-1568471173242-461f0a730452?w=500&auto=format&fit=crop&q=80',
  },
];

const STORAGE_KEY = 'nutrilens_user_profile_v3';
const AUTH_KEY = 'nutrilens_auth_status_v1';
const RECENT_KEY = 'nutrilens_recent_checks_v1';

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[ProfileContext] Error reading profile from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const auth = localStorage.getItem(AUTH_KEY);
      if (auth !== null) {
        return JSON.parse(auth);
      }
    } catch (e) {
      console.warn('[ProfileContext] Error reading auth from localStorage:', e);
    }
    return false; // unauthenticated by default so landing page is shown first
  });

  const [recentChecks, setRecentChecks] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[ProfileContext] Error reading recent checks:', e);
    }
    return DEFAULT_RECENT_CHECKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('[ProfileContext] Error saving profile:', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(isAuthenticated));
    } catch (e) {
      console.warn('[ProfileContext] Error saving auth status:', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentChecks));
    } catch (e) {
      console.warn('[ProfileContext] Error saving recent checks:', e);
    }
  }, [recentChecks]);

  const signIn = (email, password) => {
    // Client-side authentication persistence
    setIsAuthenticated(true);
    setProfile((prev) => ({
      ...prev,
      email: email || prev.email || 'user@nutrilens.app',
      name: prev.name || (email ? email.split('@')[0] : 'Yunus'),
      onboardingComplete: true,
    }));
    return true;
  };

  const signOut = () => {
    setIsAuthenticated(false);
  };

  const addRecentCheck = (check) => {
    setRecentChecks((prev) => [
      {
        id: `chk-${Date.now()}`,
        name: check.product?.name || check.name || 'Food Product',
        brand: check.product?.brand || check.brand || 'Brand',
        barcode: check.product?.barcode || check.barcode || null,
        verdict: check.verdict || 'safe',
        statusText:
          check.verdict === 'risk'
            ? 'Potential concern'
            : check.verdict === 'caution'
            ? 'Review recommended'
            : 'No relevant concerns found',
        flagCount: check.findings?.filter((f) => f.severity !== 'safe').length || 0,
        timestamp: 'Just now',
        image: check.product?.image || null,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const setName = (name) => {
    setProfile((prev) => ({ ...prev, name }));
  };

  const setAge = (age) => {
    setProfile((prev) => ({ ...prev, age }));
  };

  const toggleAllergy = (allergyId) => {
    setProfile((prev) => {
      const exists = prev.allergies.includes(allergyId);
      const updated = exists
        ? prev.allergies.filter((id) => id !== allergyId)
        : [...prev.allergies, allergyId];
      return { ...prev, allergies: updated };
    });
  };

  const addCustomAllergen = (customName) => {
    const trimmed = (customName || '').trim();
    if (!trimmed) return;
    const id = `custom_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    setProfile((prev) => {
      if (prev.customAllergens?.some((a) => a.id === id)) return prev;
      return {
        ...prev,
        customAllergens: [
          ...(prev.customAllergens || []),
          {
            id,
            label: trimmed,
            isCustom: true,
            limitedCoverage: true,
            limitedNote: 'Custom allergens rely on keyword matching, which may not catch every derivative or scientific designation.',
          },
        ],
        allergies: [...prev.allergies, id],
      };
    });
  };

  const removeCustomAllergen = (id) => {
    setProfile((prev) => ({
      ...prev,
      customAllergens: (prev.customAllergens || []).filter((a) => a.id !== id),
      allergies: prev.allergies.filter((item) => item !== id),
    }));
  };

  const toggleCondition = (conditionId) => {
    if (conditionId === 'none') {
      setProfile((prev) => ({ ...prev, conditions: [] }));
      return;
    }

    setProfile((prev) => {
      const exists = prev.conditions.includes(conditionId);
      const updated = exists
        ? prev.conditions.filter((id) => id !== conditionId)
        : [...prev.conditions, conditionId];
      return { ...prev, conditions: updated };
    });
  };

  const completeOnboarding = () => {
    setProfile((prev) => ({
      ...prev,
      onboardingComplete: true,
      hasCompletedOnboarding: true,
    }));
    setIsAuthenticated(true);
  };

  const resetProfile = () => {
    setProfile({
      name: '',
      age: '',
      allergies: [],
      customAllergens: [],
      conditions: [],
      onboardingComplete: false,
      hasCompletedOnboarding: false,
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isAuthenticated,
        recentChecks,
        signIn,
        signOut,
        addRecentCheck,
        setName,
        setAge,
        toggleAllergy,
        addCustomAllergen,
        removeCustomAllergen,
        toggleCondition,
        completeOnboarding,
        resetProfile,
        setProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

