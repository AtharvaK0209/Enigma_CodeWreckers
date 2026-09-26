import express from 'express';
import { runPipeline } from '../controllers/analysisController.js';
import UserModel from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Ephemeral in-memory state store for active clarification sessions
const clarificationSessions = new Map();
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

const MAX_QUESTIONS = 3; // HARD LIMIT: Structurally impossible to exceed 3 questions

export const CLARIFICATION_QUESTIONS = [
  {
    stepIndex: 0,
    questionId: 'panel_visible',
    question: 'Can you see an ingredient list or allergen box on the packaging?',
    type: 'yes_no',
    hint: 'Look for "Ingredients:" or a highlighted allergen callout on the container.',
  },
  {
    stepIndex: 1,
    questionId: 'panel_legible',
    question: 'Is the text clear enough to read any parts of it?',
    type: 'yes_no',
    hint: 'Check if you can distinguish printed words without severe glare or blur.',
  },
  {
    stepIndex: 2,
    questionId: 'allergens_listed',
    question: 'Does the packaging display a "Contains:" statement or bold allergen warnings?',
    type: 'allergen_picker',
    hint: 'Select all allergens explicitly declared on the physical label.',
  },
];

/**
 * POST /api/clarify/start
 * Initializes a new capped clarification session
 */
router.post('/start', (req, res) => {
  const sessionId = `clarify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const session = {
    sessionId,
    userId: req.userId || 'demo-user-123',
    stepIndex: 0,
    answers: {},
    confirmedAllergens: [],
    createdAt: Date.now(),
  };

  clarificationSessions.set(sessionId, session);

  res.json({
    sessionId,
    stepIndex: 0,
    totalQuestionsAllowed: MAX_QUESTIONS,
    isTerminal: false,
    question: CLARIFICATION_QUESTIONS[0],
  });
});

/**
 * POST /api/clarify/answer
 * Submits an answer for the current step and progresses the state machine
 */
router.post('/answer', async (req, res) => {
  try {
    const { sessionId, stepIndex, answer, selectedAllergens, userProfile } = req.body;
    const userId = req.userId || 'demo-user-123';

    let session = clarificationSessions.get(sessionId);
    if (!session) {
      session = {
        sessionId: sessionId || `clarify-${Date.now()}`,
        userId,
        stepIndex: typeof stepIndex === 'number' ? stepIndex : 0,
        answers: {},
        confirmedAllergens: [],
        createdAt: Date.now(),
      };
      clarificationSessions.set(session.sessionId, session);
    }

    const currentStep = session.stepIndex;

    // Invariant check: structurally impossible to answer beyond MAX_QUESTIONS
    if (currentStep >= MAX_QUESTIONS) {
      return res.status(400).json({
        error: 'Clarification flow already concluded. Maximum 3 questions exceeded.',
        isTerminal: true,
      });
    }

    session.answers[currentStep] = answer;

    // STEP 0: Is panel visible?
    if (currentStep === 0) {
      const isYes = answer === true || answer === 'yes' || answer === 'YES';
      if (!isYes) {
        // Outcome: Needs new photo
        clarificationSessions.delete(sessionId);
        return res.json({
          sessionId,
          isTerminal: true,
          outcome: 'needs_new_photo',
          message: 'The packaging does not appear to show an ingredient panel. Please retake a photo focusing on the ingredients list or allergen box.',
          dataQuality: 'low',
        });
      }

      session.stepIndex = 1;
      return res.json({
        sessionId,
        stepIndex: 1,
        totalQuestionsAllowed: MAX_QUESTIONS,
        isTerminal: false,
        question: CLARIFICATION_QUESTIONS[1],
      });
    }

    // STEP 1: Is text legible?
    if (currentStep === 1) {
      const isYes = answer === true || answer === 'yes' || answer === 'YES';
      if (!isYes) {
        // Outcome: Needs new photo
        clarificationSessions.delete(sessionId);
        return res.json({
          sessionId,
          isTerminal: true,
          outcome: 'needs_new_photo',
          message: 'The text is too blurry or damaged to read safely. Please retake a photo in better lighting.',
          dataQuality: 'low',
        });
      }

      session.stepIndex = 2;
      return res.json({
        sessionId,
        stepIndex: 2,
        totalQuestionsAllowed: MAX_QUESTIONS,
        isTerminal: false,
        question: CLARIFICATION_QUESTIONS[2],
      });
    }

    // STEP 2: Contains statement / Allergen picker (This is question #3 — THE FINAL QUESTION)
    if (currentStep === 2) {
      // Must terminate immediately. A 4th question is structurally impossible!
      const allergens = Array.isArray(selectedAllergens)
        ? selectedAllergens
        : Array.isArray(answer)
        ? answer
        : [];

      session.confirmedAllergens = allergens;

      // Fetch user profile
      let profile = userProfile;
      if (!profile || Object.keys(profile).length === 0) {
        const dbUser = await UserModel.findById(userId);
        if (dbUser) profile = dbUser;
      }

      // Run pipeline with strict constraints:
      // dataQuality: 'low', source: 'user_confirmed', confidence: 'user_reported'
      const finalResult = await runPipeline({
        rawProduct: {
          id: `clarified-${Date.now()}`,
          name: 'Package Assessment (User Clarified)',
          brand: 'Unread Label',
          ingredients: allergens.length > 0 ? allergens.map((a) => `${a} (confirmed by user)`) : ['Ingredients partially transcribed via user confirmation'],
          allergensDetected: allergens,
          primaryAllergenKey: allergens[0] || null,
        },
        userProfile: profile,
        userId,
        method: 'image',
        source: 'user_confirmed',
        userConfirmedAllergens: allergens,
        forcedDataQuality: 'low', // Stays 'low' even after pipeline runs!
      });

      clarificationSessions.delete(sessionId);

      return res.json({
        sessionId,
        isTerminal: true,
        outcome: 'final_result',
        dataQuality: 'low',
        source: 'user_confirmed',
        confidence: 'user_reported',
        result: finalResult,
      });
    }

    // Catch-all: enforce termination
    res.json({
      sessionId,
      isTerminal: true,
      outcome: 'concluded',
      dataQuality: 'low',
    });
  } catch (err) {
    console.error('[Clarify Route] Error processing clarification answer:', err);
    res.status(500).json({ error: 'Failed to process clarification step', details: err.message });
  }
});

/**
 * State inspector for tests
 */
router.get('/sessions', (req, res) => {
  res.json({
    activeCount: clarificationSessions.size,
    maxQuestions: MAX_QUESTIONS,
  });
});

export default router;
