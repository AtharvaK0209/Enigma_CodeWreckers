import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile, getHistory, authLogin, authSignup } from '../services/api';

const ProfileContext = createContext(null);

const DEFAULT_PROFILE = {
  name: 'User',
  age: '20',
  allergies: [],
  customAllergens: [],
  conditions: [],
  onboardingComplete: false,
};

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(DEFAULT_PROFILE);
  const [authToken, setAuthToken] = useState(() => {
    try {
      return sessionStorage.getItem('nutrilens_auth_token') || localStorage.getItem('nutrilens_auth_token') || null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem('nutrilens_auth_token') || localStorage.getItem('nutrilens_auth_token'));
    } catch {
      return false;
    }
  });
  const [recentChecks, setRecentChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialLoadDone = useRef(false);

  // Load profile and history from MongoDB API on mount
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        // 1. Fetch Profile from Mongo API
        const profileData = await getProfile(authToken);
        if (isMounted && profileData) {
          setProfileState((prev) => ({
            ...prev,
            ...profileData,
            onboardingComplete: profileData.onboardingComplete !== false,
          }));
        }
      } catch (err) {
        console.warn('[ProfileContext] Error loading profile from API:', err.message);
      }

      try {
        // 2. Fetch Scan History from Mongo API
        const historyData = await getHistory(authToken);
        if (isMounted && Array.isArray(historyData)) {
          setRecentChecks(historyData);
        }
      } catch (err) {
        console.warn('[ProfileContext] Error loading history from API:', err.message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          initialLoadDone.current = true;
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  // Persist profile changes to MongoDB API
  const persistProfile = async (newProfile) => {
    try {
      await updateProfile(newProfile, authToken);
    } catch (err) {
      console.warn('[ProfileContext] Error saving profile to API:', err.message);
    }
  };

  const refreshHistory = async () => {
    try {
      const historyData = await getHistory(authToken);
      if (Array.isArray(historyData)) {
        setRecentChecks(historyData);
      }
    } catch (err) {
      console.warn('[ProfileContext] Error refreshing history:', err.message);
    }
  };

  const signIn = async (email, password) => {
    try {
      const res = await authLogin(email, password);
      if (res.token) {
        setAuthToken(res.token);
        try {
          sessionStorage.setItem('nutrilens_auth_token', res.token);
          localStorage.setItem('nutrilens_auth_token', res.token);
        } catch {}
      }
      if (res.user) {
        setProfileState(res.user);
      }
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('[ProfileContext] Sign in API error:', err.message);
      throw err;
    }
  };

  const signUp = async (data) => {
    try {
      const res = await authSignup(data);
      if (res.token) {
        setAuthToken(res.token);
        try {
          sessionStorage.setItem('nutrilens_auth_token', res.token);
          localStorage.setItem('nutrilens_auth_token', res.token);
        } catch {}
      }
      if (res.user) {
        setProfileState(res.user);
      }
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('[ProfileContext] Sign up error:', err.message);
      throw err;
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setAuthToken(null);
    try {
      sessionStorage.removeItem('nutrilens_auth_token');
      localStorage.removeItem('nutrilens_auth_token');
    } catch {}
    setRecentChecks([]);
    setProfileState(DEFAULT_PROFILE);
  };

  const addRecentCheck = (check) => {
    const newEntry = {
      id: check.id || `chk-${Date.now()}`,
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
      flagCount: check.findings?.filter((f) => f.severity && f.severity !== 'safe').length || 0,
      timestamp: 'Just now',
      image: check.product?.image || null,
      createdAt: new Date().toISOString(),
    };

    setRecentChecks((prev) => [newEntry, ...prev.slice(0, 19)]);
  };

  const setName = (name) => {
    setProfileState((prev) => {
      const updated = { ...prev, name };
      persistProfile(updated);
      return updated;
    });
  };

  const setAge = (age) => {
    setProfileState((prev) => {
      const updated = { ...prev, age };
      persistProfile(updated);
      return updated;
    });
  };

  const toggleAllergy = (allergyId) => {
    setProfileState((prev) => {
      const exists = prev.allergies.includes(allergyId);
      const updatedAllergies = exists
        ? prev.allergies.filter((id) => id !== allergyId)
        : [...prev.allergies, allergyId];
      const updated = { ...prev, allergies: updatedAllergies };
      persistProfile(updated);
      return updated;
    });
  };

  const addCustomAllergen = (customName) => {
    const trimmed = (customName || '').trim();
    if (!trimmed) return;
    const id = `custom_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    setProfileState((prev) => {
      if (prev.customAllergens?.some((a) => a.id === id)) return prev;
      const updated = {
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
      persistProfile(updated);
      return updated;
    });
  };

  const removeCustomAllergen = (id) => {
    setProfileState((prev) => {
      const updated = {
        ...prev,
        customAllergens: (prev.customAllergens || []).filter((a) => a.id !== id),
        allergies: prev.allergies.filter((item) => item !== id),
      };
      persistProfile(updated);
      return updated;
    });
  };

  const toggleCondition = (conditionId) => {
    if (conditionId === 'none') {
      setProfileState((prev) => {
        const updated = { ...prev, conditions: [] };
        persistProfile(updated);
        return updated;
      });
      return;
    }

    setProfileState((prev) => {
      const exists = prev.conditions.includes(conditionId);
      const updatedConditions = exists
        ? prev.conditions.filter((id) => id !== conditionId)
        : [...prev.conditions, conditionId];
      const updated = { ...prev, conditions: updatedConditions };
      persistProfile(updated);
      return updated;
    });
  };

  const completeOnboarding = () => {
    setProfileState((prev) => {
      const updated = {
        ...prev,
        onboardingComplete: true,
        hasCompletedOnboarding: true,
      };
      persistProfile(updated);
      return updated;
    });
    setIsAuthenticated(true);
  };

  const resetProfile = () => {
    const reset = {
      name: '',
      age: '',
      allergies: [],
      customAllergens: [],
      conditions: [],
      onboardingComplete: false,
      hasCompletedOnboarding: false,
    };
    setProfileState(reset);
    persistProfile(reset);
  };

  const setProfile = (newProfile) => {
    setProfileState(newProfile);
    persistProfile(newProfile);
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        isAuthenticated,
        authToken,
        recentChecks,
        isLoading,
        signIn,
        signUp,
        signOut,
        addRecentCheck,
        refreshHistory,
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
