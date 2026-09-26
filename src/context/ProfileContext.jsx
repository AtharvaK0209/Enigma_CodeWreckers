import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  name: 'Yunus',
  allergies: ['peanut', 'tree_nuts'], // realistic sample default
  conditions: ['hypertension'],
};

const STORAGE_KEY = 'nutrilens_user_profile_v1';

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed reading profile from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  });

  // Persist to local storage whenever profile changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed saving profile to localStorage:', e);
    }
  }, [profile]);

  const setName = (name) => {
    setProfile((prev) => ({ ...prev, name }));
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

  const toggleCondition = (conditionId) => {
    setProfile((prev) => {
      const exists = prev.conditions.includes(conditionId);
      const updated = exists
        ? prev.conditions.filter((id) => id !== conditionId)
        : [...prev.conditions, conditionId];
      return { ...prev, conditions: updated };
    });
  };

  const resetProfile = () => {
    setProfile({
      name: '',
      allergies: [],
      conditions: [],
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setName,
        toggleAllergy,
        toggleCondition,
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
