import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  name: 'Yunus',
  age: '24',
  allergies: ['peanut', 'tree_nuts'],
  customAllergens: [],
  conditions: ['hypertension'],
  hasCompletedOnboarding: true,
};

const STORAGE_KEY = 'nutrilens_user_profile_v2';

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[ProfileContext] Error reading from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('[ProfileContext] Error saving to localStorage:', e);
    }
  }, [profile]);

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
      if (prev.customAllergens.some((a) => a.id === id)) return prev;
      return {
        ...prev,
        customAllergens: [
          ...prev.customAllergens,
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
      customAllergens: prev.customAllergens.filter((a) => a.id !== id),
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
    setProfile((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  };

  const resetProfile = () => {
    setProfile({
      name: '',
      age: '',
      allergies: [],
      customAllergens: [],
      conditions: [],
      hasCompletedOnboarding: false,
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
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
