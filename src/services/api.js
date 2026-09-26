/**
 * NutriLens API Client
 * Single point of contact for food safety risk analysis.
 * Strictly communicates with backend API without fake/mock product databases.
 */

const API_BASE = '';

/**
 * Analyze product by barcode
 */
export async function analyzeBarcode(code, userProfile = {}, token = null) {
  const cleanCode = String(code || '').trim();
  console.log(`[SCAN] detected barcode: ${cleanCode}`);

  if (!cleanCode) {
    const error = new Error("Couldn't read the barcode. Please scan again.");
    error.code = 'BARCODE_NOT_RECEIVED';
    throw error;
  }

  const authToken =
    token ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nutrilens_auth_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nutrilens_auth_token') : null);

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/analyze/barcode`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ barcode: cleanCode, userProfile }),
  });

  if (response.ok) {
    return await response.json();
  }

  const errJson = await response.json().catch(() => ({}));

  if (response.status === 404 || errJson.code === 'BARCODE_NOT_FOUND' || errJson.error?.includes('not found')) {
    const error = new Error('Product not found in Open Food Facts.');
    error.code = 'BARCODE_NOT_FOUND';
    error.barcode = cleanCode;
    throw error;
  }

  if (errJson.error === 'BARCODE_NOT_RECEIVED') {
    const error = new Error("Couldn't read the barcode. Please scan again.");
    error.code = 'BARCODE_NOT_RECEIVED';
    throw error;
  }

  if (errJson.error === 'OFF_RESULT_BARCODE_MISMATCH') {
    const error = new Error('Scanned barcode did not match Open Food Facts catalog entry.');
    error.code = 'OFF_RESULT_BARCODE_MISMATCH';
    throw error;
  }

  throw new Error(errJson.error || errJson.message || `Barcode analysis failed with status ${response.status}`);
}

/**
 * Analyze product by image (base64)
 */
export async function analyzeImage(base64, userProfile = {}, options = {}) {
  if (options.forceUnreadable || (base64 && typeof base64 === 'string' && base64.includes('SIMULATE_BLURRY_IMAGE'))) {
    const error = new Error('Image too blurry or poorly lit. The ingredient panel could not be transcribed.');
    error.code = 'IMAGE_UNREADABLE';
    throw error;
  }

  const authToken =
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nutrilens_auth_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nutrilens_auth_token') : null);

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/analyze/image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: base64, userProfile, ...options }),
  });

  if (response.ok) {
    return await response.json();
  }

  const errJson = await response.json().catch(() => ({}));
  const error = new Error(errJson.message || errJson.error || 'Product identification from image is unavailable.');
  error.code = errJson.code || 'IMAGE_IDENTIFICATION_UNAVAILABLE';
  throw error;
}

/**
 * Search food catalog by product or brand name
 */
export async function searchFood(query, userProfile = {}) {
  const cleanQ = String(query || '').trim().toLowerCase();
  if (!cleanQ) return [];

  const authToken =
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nutrilens_auth_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nutrilens_auth_token') : null);

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(cleanQ)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: cleanQ, userProfile }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[NutriLens API] Remote search unavailable:', err.message);
  }

  // Return empty without fake fallbacks
  return [];
}

/**
 * Fetch user profile from MongoDB API
 */
export async function getProfile(token = null) {
  const authToken =
    token ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nutrilens_auth_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nutrilens_auth_token') : null);

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/api/profile`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to load profile: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Update user profile in MongoDB API
 */
export async function updateProfile(profileData, token = null) {
  const authToken =
    token ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nutrilens_auth_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nutrilens_auth_token') : null);

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(profileData),
  });
  if (!res.ok) {
    throw new Error(`Failed to update profile: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch scan history from MongoDB API
 */
export async function getHistory(token = null) {
  const authToken =
    token ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nutrilens_auth_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nutrilens_auth_token') : null);

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/api/history`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to load scan history: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Clear scan history in MongoDB API
 */
export async function clearHistory(token = null) {
  const authToken =
    token ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('nutrilens_auth_token') : null) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('nutrilens_auth_token') : null);

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/api/history`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to clear history: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Find safer alternative suggestions via /api/alternatives
 */
export async function getAlternatives(product, userProfile = {}, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, userProfile, ...options }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[NutriLens API] Error requesting alternatives:', err.message);
  }

  return {
    status: 'no_verified_alternative',
    hasAlternatives: false,
    alternatives: [],
    message: "We couldn't find a verified alternative for this product yet. NutriLens only recommends verified manufacturer products, never automated placeholders.",
  };
}

/**
 * Initialize a 3-question clarification session
 */
export async function startClarification() {
  try {
    const res = await fetch(`${API_BASE}/api/clarify/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[NutriLens API] Server clarify/start unavailable:', err.message);
  }

  return {
    sessionId: `clarify-${Date.now()}`,
    stepIndex: 0,
    totalQuestionsAllowed: 3,
    isTerminal: false,
    question: {
      stepIndex: 0,
      questionId: 'panel_visible',
      question: 'Can you see an ingredient list or allergen box on the packaging?',
      type: 'yes_no',
      hint: 'Look for "Ingredients:" or a highlighted allergen callout on the container.',
    },
  };
}

/**
 * Submit clarification answer
 */
export async function answerClarification(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/clarify/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[NutriLens API] Server clarify/answer unavailable:', err.message);
  }

  const { sessionId, stepIndex, answer } = payload;
  const currentStep = typeof stepIndex === 'number' ? stepIndex : 0;

  if (currentStep === 0) {
    const isYes = answer === true || answer === 'yes' || answer === 'YES';
    if (!isYes) {
      return {
        sessionId,
        isTerminal: true,
        outcome: 'needs_new_photo',
        message: 'The packaging does not appear to show an ingredient panel. Please retake a photo focusing on the ingredients list or allergen box.',
        dataQuality: 'low',
      };
    }
    return {
      sessionId,
      stepIndex: 1,
      totalQuestionsAllowed: 3,
      isTerminal: false,
      question: {
        stepIndex: 1,
        questionId: 'panel_legible',
        question: 'Is the text clear enough to read any parts of it?',
        type: 'yes_no',
        hint: 'Check if you can distinguish printed words without severe glare or blur.',
      },
    };
  }

  return {
    sessionId,
    isTerminal: true,
    outcome: 'concluded',
    dataQuality: 'low',
  };
}

/**
 * Auth Login (bcrypt + JWT)
 */
export async function authLogin(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return await res.json();
}

/**
 * Auth Signup (bcrypt + JWT)
 */
export async function authSignup(data) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Signup failed');
  }
  return await res.json();
}

export default {
  analyzeBarcode,
  analyzeImage,
  searchFood,
  getProfile,
  updateProfile,
  getHistory,
  clearHistory,
  getAlternatives,
  startClarification,
  answerClarification,
  authLogin,
  authSignup,
};
