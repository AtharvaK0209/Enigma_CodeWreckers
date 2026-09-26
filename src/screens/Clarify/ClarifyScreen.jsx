import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ScanLine,
  RefreshCw,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import AllergenGrid from '../../components/common/AllergenGrid';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import { useProfile } from '../../context/ProfileContext';
import { useAnalysis } from '../../context/AnalysisContext';
import { startClarification, answerClarification } from '../../services/api';
import './ClarifyScreen.css';

const DEFAULT_QUESTIONS = [
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

export default function ClarifyScreen({ onNavigate }) {
  const { profile } = useProfile();
  const { setCurrentResult } = useAnalysis();

  const [sessionId, setSessionId] = useState(() => `clarify-${Date.now()}`);

  const [currentStep, setCurrentStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = parseInt(params.get('step'), 10);
    return parsed >= 0 && parsed < DEFAULT_QUESTIONS.length ? parsed : 0;
  });

  const [activeQuestion, setActiveQuestion] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const parsed = parseInt(params.get('step'), 10);
    return parsed >= 0 && parsed < DEFAULT_QUESTIONS.length ? DEFAULT_QUESTIONS[parsed] : DEFAULT_QUESTIONS[0];
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Allergen picker state for Step 2
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [noAllergensDeclared, setNoAllergensDeclared] = useState(false);

  // Terminal state outcomes: 'needs_new_photo' | 'final_result' | null
  const [terminalOutcome, setTerminalOutcome] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('outcome') || null;
  });

  const [terminalMessage, setTerminalMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('outcome') === 'needs_new_photo'
      ? 'The packaging does not appear to show an ingredient panel. Please retake a photo focusing on the ingredients list or allergen box.'
      : '';
  });

  const [finalAnalysisResult, setFinalAnalysisResult] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('outcome') === 'final_result') {
      return {
        verdict: 'risk',
        verdictTitle: 'This product may not be safe for you',
        verdictSummary: 'Direct allergen match detected in confirmed ingredients.',
        dataQuality: 'low',
        source: 'user_confirmed',
        confidence: 'user_reported',
        product: {
          name: 'Package Assessment (User Clarified)',
          brand: 'Unread Label',
          allergensDetected: ['peanut'],
        },
      };
    }
    return null;
  });

  // Initial session startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('outcome') || params.get('step') !== null) {
      return;
    }

    async function initSession() {
      setLoading(true);
      setError(null);
      try {
        const data = await startClarification();
        if (data.sessionId) setSessionId(data.sessionId);
        if (typeof data.stepIndex === 'number') setCurrentStep(data.stepIndex);
        if (data.question) setActiveQuestion(data.question);
      } catch (err) {
        console.warn('[ClarifyScreen] Failed to start server session, using local questions:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  // Answer handler for Yes / No questions (Steps 0 & 1)
  const handleAnswerYesNo = async (isYes) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        sessionId,
        stepIndex: currentStep,
        answer: isYes ? 'yes' : 'no',
        userProfile: profile,
      };

      const res = await answerClarification(payload);

      if (res.isTerminal) {
        if (res.outcome === 'needs_new_photo') {
          setTerminalOutcome('needs_new_photo');
          setTerminalMessage(res.message || 'Please retake a photo focusing on the ingredients or allergen label.');
        } else if (res.outcome === 'final_result') {
          setTerminalOutcome('final_result');
          setFinalAnalysisResult(res.result);
          if (res.result) setCurrentResult(res.result);
        }
      } else {
        if (typeof res.stepIndex === 'number') setCurrentStep(res.stepIndex);
        if (res.question) setActiveQuestion(res.question);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle allergen in step 2
  const handleToggleAllergen = (allergenId) => {
    setNoAllergensDeclared(false);
    setSelectedAllergens((prev) =>
      prev.includes(allergenId) ? prev.filter((id) => id !== allergenId) : [...prev, allergenId]
    );
  };

  // Toggle "No allergens declared"
  const handleToggleNoAllergens = () => {
    if (!noAllergensDeclared) {
      setSelectedAllergens([]);
      setNoAllergensDeclared(true);
    } else {
      setNoAllergensDeclared(false);
    }
  };

  // Submit Allergen Picker (Step 2 - The final terminal question)
  const handleSubmitAllergens = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const confirmedList = noAllergensDeclared ? [] : selectedAllergens;
      const payload = {
        sessionId,
        stepIndex: 2,
        answer: confirmedList,
        selectedAllergens: confirmedList,
        userProfile: profile,
      };

      const res = await answerClarification(payload);

      if (res.result) {
        setCurrentResult(res.result);
        setFinalAnalysisResult(res.result);
      }
      setTerminalOutcome('final_result');
    } catch (err) {
      setError(err.message || 'Failed to generate assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="clarify-screen anim-spring-pop">
        <Card variant="elevated" className="clarify-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="btn-spinner" style={{ margin: '0 auto 16px', width: 28, height: 28, borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#111' }} />
          <h2 className="clarify-question-title" style={{ fontSize: 18 }}>Preparing clarification questions...</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Setting up your 3-question packaging check</p>
        </Card>
      </div>
    );
  }

  // Outcome 1: Clearer Photo Needed
  if (terminalOutcome === 'needs_new_photo') {
    return (
      <div className="clarify-screen anim-spring-pop">
        <div className="clarify-top-nav">
          <PillButton
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => onNavigate('/analyze')}
          >
            Back to Scanner
          </PillButton>
          <div className="clarify-limit-badge">
            <ShieldCheck size={14} />
            <span>3-Question Cap Enforced</span>
          </div>
        </div>

        <Card className="clarify-terminal-card">
          <div className="terminal-icon-bubble bubble-warning">
            <Camera size={32} />
          </div>

          <h2 className="terminal-headline">Clearer Photo Needed</h2>
          <p className="terminal-message">{terminalMessage}</p>

          <div className="terminal-tips-box">
            <span className="terminal-tips-title">Label Photography Tips:</span>
            <ul className="terminal-tips-list">
              <li>Position camera directly above the ingredient panel.</li>
              <li>Avoid harsh overhead glare or dim shadows.</li>
              <li>Flatten any folds or creases on flexible bags.</li>
            </ul>
          </div>

          <div className="terminal-actions-group">
            <PillButton
              variant="primary"
              size="lg"
              icon={RefreshCw}
              fullWidth
              onClick={() => onNavigate('/analyze')}
            >
              Retake Photo
            </PillButton>
            <PillButton
              variant="secondary"
              size="md"
              icon={ScanLine}
              fullWidth
              onClick={() => onNavigate('/analyze')}
            >
              Scan Barcode Instead
            </PillButton>
            <PillButton
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => onNavigate('/dashboard')}
            >
              Return to Dashboard
            </PillButton>
          </div>
        </Card>
      </div>
    );
  }

  // Outcome 2: Final Assessment Result Generated
  if (terminalOutcome === 'final_result') {
    const isSafe = finalAnalysisResult?.verdict === 'safe';

    return (
      <div className="clarify-screen anim-spring-pop">
        <div className="clarify-top-nav">
          <PillButton
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => onNavigate('/analyze')}
          >
            Back
          </PillButton>
          <div className="clarify-limit-badge">
            <ShieldCheck size={14} />
            <span>Clarification Completed</span>
          </div>
        </div>

        <Card className="clarify-terminal-card">
          <div className={`terminal-icon-bubble ${isSafe ? 'bubble-success' : 'bubble-warning'}`}>
            {isSafe ? <CheckCircle2 size={32} /> : <ShieldAlert size={32} />}
          </div>

          <h2 className="terminal-headline">Safety Assessment Ready</h2>
          <p className="terminal-message">
            We synthesized your confirmed package ingredients against your saved dietary profile.
          </p>

          <div className="clarify-result-preview">
            <div className="preview-badge-row">
              <span className={`preview-verdict-tag ${isSafe ? 'tag-safe' : 'tag-risk'}`}>
                {isSafe ? 'Looks safe for you' : 'This product may not be safe for you'}
              </span>
              <span className="evidence-source-tag evidence-tag-user_confirmed">
                You confirmed this
              </span>
            </div>
            <h3 className="preview-product-name">
              {finalAnalysisResult?.product?.name || 'Package Assessment (User Clarified)'}
            </h3>
            <p className="preview-data-safeguard">
              <strong>Data Quality Safeguard:</strong> Marked as low-clarity photo record. Retain packaging if unsure.
            </p>
          </div>

          <div className="terminal-actions-group">
            <PillButton
              variant="primary"
              size="lg"
              icon={Sparkles}
              fullWidth
              onClick={() => onNavigate('/results')}
            >
              View Full Safety Report
            </PillButton>
            <PillButton
              variant="secondary"
              size="md"
              icon={Camera}
              fullWidth
              onClick={() => onNavigate('/analyze')}
            >
              Inspect Another Product
            </PillButton>
          </div>
        </Card>
      </div>
    );
  }

  // Active Clarification Question (Step 0, 1, or 2)
  return (
    <div className="clarify-screen anim-spring-pop">
      {/* Top Nav with Back Button & 3-Question Cap Indicator */}
      <div className="clarify-top-nav">
        <PillButton
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => {
            if (currentStep > 0) {
              setCurrentStep((s) => s - 1);
              setActiveQuestion(DEFAULT_QUESTIONS[currentStep - 1]);
            } else {
              onNavigate('/analyze');
            }
          }}
        >
          {currentStep > 0 ? 'Previous' : 'Cancel'}
        </PillButton>

        <div className="clarify-limit-badge">
          <ShieldCheck size={14} />
          <span>Question {currentStep + 1} of 3 (Hard Cap)</span>
        </div>
      </div>

      {/* 3-Step Visual Progress Bar */}
      <div className="clarify-progress-bar-wrapper">
        <div className="clarify-progress-segments">
          {[0, 1, 2].map((idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <div
                key={idx}
                className={`clarify-progress-segment ${isActive ? 'active' : ''} ${
                  isCompleted ? 'completed' : ''
                }`}
              />
            );
          })}
        </div>
        <div className="clarify-progress-labels">
          <span className={currentStep === 0 ? 'active-label' : ''}>1. Panel Visible</span>
          <span className={currentStep === 1 ? 'active-label' : ''}>2. Text Legible</span>
          <span className={currentStep === 2 ? 'active-label' : ''}>3. Allergen Check</span>
        </div>
      </div>

      {/* Main Question Card */}
      <Card variant="elevated" className="clarify-card">
        <header className="clarify-card-header">
          <span className="clarify-step-kicker">
            Step {currentStep + 1} &bull; Packaging Clarification
          </span>
          <h1 className="clarify-question-title">{activeQuestion?.question}</h1>
        </header>

        {/* Helpful Packaging Guidance Note */}
        {activeQuestion?.hint && (
          <div className="clarify-hint-box">
            <HelpCircle size={18} className="clarify-hint-icon" />
            <p className="clarify-hint-text">{activeQuestion.hint}</p>
          </div>
        )}

        {error && (
          <div className="clarify-error-banner">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 0 & 1: Yes / No Choices */}
        {activeQuestion?.type === 'yes_no' && (
          <div className="clarify-yesno-grid">
            <button
              type="button"
              className="clarify-choice-btn choice-yes"
              disabled={submitting}
              onClick={() => handleAnswerYesNo(true)}
            >
              <div className="clarify-choice-icon-wrap">
                <Eye size={22} />
              </div>
              <div className="clarify-choice-text-wrap">
                <span className="clarify-choice-title">Yes, visible</span>
                <span className="clarify-choice-desc">
                  {currentStep === 0
                    ? 'I see an ingredient block or allergen declaration'
                    : 'The printed ingredient words are legible'}
                </span>
              </div>
            </button>

            <button
              type="button"
              className="clarify-choice-btn choice-no"
              disabled={submitting}
              onClick={() => handleAnswerYesNo(false)}
            >
              <div className="clarify-choice-icon-wrap">
                <EyeOff size={22} />
              </div>
              <div className="clarify-choice-text-wrap">
                <span className="clarify-choice-title">No, not clear</span>
                <span className="clarify-choice-desc">
                  {currentStep === 0
                    ? 'Cannot find any ingredient or allergen statement'
                    : 'The text is blurry, rubbed off, or damaged'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Allergen Picker (Question #3 — The final terminal question) */}
        {activeQuestion?.type === 'allergen_picker' && (
          <section className="clarify-allergen-section">
            {/* Quick Option: No Allergens Listed */}
            <div
              className={`clarify-none-declared-card ${noAllergensDeclared ? 'active' : ''}`}
              onClick={handleToggleNoAllergens}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleNoAllergens();
                }
              }}
            >
              <div>
                <h3 className="clarify-none-title">No Allergens Declared on Label</h3>
                <p className="clarify-none-desc">
                  Packaging states no "Contains:" or bold allergen alerts.
                </p>
              </div>
              {noAllergensDeclared && (
                <span className="tile-selected-badge">
                  <Check size={14} strokeWidth={3} /> Selected
                </span>
              )}
            </div>

            {/* Reused AllergenGrid Component */}
            <AllergenGrid
              selectedAllergens={selectedAllergens}
              onToggleAllergen={handleToggleAllergen}
            />

            {/* Submit Action Bar */}
            <div className="clarify-allergen-actions">
              <span className="clarify-selection-count">
                {noAllergensDeclared
                  ? 'Confirmed no allergens declared'
                  : selectedAllergens.length > 0
                  ? `${selectedAllergens.length} allergen${selectedAllergens.length > 1 ? 's' : ''} marked`
                  : 'Select allergens or mark none above'}
              </span>

              <PillButton
                variant="primary"
                size="md"
                icon={Sparkles}
                loading={submitting}
                disabled={submitting || (!noAllergensDeclared && selectedAllergens.length === 0)}
                onClick={handleSubmitAllergens}
              >
                Confirm & Generate Assessment
              </PillButton>
            </div>
          </section>
        )}
      </Card>
    </div>
  );
}
