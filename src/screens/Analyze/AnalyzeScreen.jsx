import React, { useState } from 'react';
import { ScanLine, Camera, AlertCircle, RefreshCw, ArrowLeft, SearchX, EyeOff, ShieldCheck } from 'lucide-react';
import BarcodeScanner from '../../components/BarcodeScanner';
import ImageUpload from '../../components/ImageUpload';
import { useAnalysis } from '../../context/AnalysisContext';
import { useProfile } from '../../context/ProfileContext';
import './AnalyzeScreen.css';

export default function AnalyzeScreen({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('barcode'); // 'barcode' | 'photo'
  const { runBarcodeScan, runImageScan, loading, error, setError } = useAnalysis();
  const { profile } = useProfile();
  const [edgeCaseError, setEdgeCaseError] = useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const edge = params.get('edge');
    if (edge === 'barcode_not_found') {
      setEdgeCaseError({
        type: 'barcode_not_found',
        code: '999999999999',
        title: 'Barcode Not in Safety Registry',
        description: 'We searched over 3.2M global food items, but barcode "999999999999" was not found in registered food safety catalogs.',
        actionPrompt: 'Try snapping a photo of the ingredient list instead for instant AI OCR transcription.',
      });
    } else if (edge === 'image_unreadable') {
      setEdgeCaseError({
        type: 'image_unreadable',
        title: 'Ingredient Panel Unreadable',
        description: 'The uploaded photo was too blurry, shadowed, or glare-reflective for our vision model to transcribe the fine print safely.',
        actionPrompt: 'Flatten the packaging, wipe your camera lens, and ensure good indirect lighting before retrying.',
      });
    }
  }, []);

  const handleBarcodeSuccess = async (code) => {
    setEdgeCaseError(null);
    try {
      await runBarcodeScan(code);
      onNavigate('/results');
    } catch (err) {
      if (err.code === 'BARCODE_NOT_FOUND') {
        setEdgeCaseError({
          type: 'barcode_not_found',
          code: err.barcode || code,
          title: 'Barcode Not in Safety Registry',
          description: `We searched over 3.2M global food items, but barcode "${code}" was not found in registered food safety catalogs.`,
          actionPrompt: 'Try snapping a photo of the ingredient list instead for instant AI OCR transcription.',
        });
      } else {
        setEdgeCaseError({
          type: 'generic',
          title: 'Analysis Interrupted',
          description: err.message || 'Unable to complete barcode lookup. Please try again.',
        });
      }
    }
  };

  const handleImageAnalyze = async (base64, options = {}) => {
    setEdgeCaseError(null);
    try {
      await runImageScan(base64, options);
      onNavigate('/results');
    } catch (err) {
      if (err.code === 'IMAGE_UNREADABLE') {
        setEdgeCaseError({
          type: 'image_unreadable',
          title: 'Ingredient Panel Unreadable',
          description: 'The uploaded photo was too blurry, shadowed, or glare-reflective for our vision model to transcribe the fine print safely.',
          actionPrompt: 'Flatten the packaging, wipe your camera lens, and ensure good indirect lighting before retrying.',
        });
      } else {
        setEdgeCaseError({
          type: 'generic',
          title: 'Image Analysis Failed',
          description: err.message || 'Unable to parse the product image. Please retry.',
        });
      }
      throw err;
    }
  };

  const clearError = () => {
    setEdgeCaseError(null);
    setError(null);
  };

  return (
    <div className="analyze-screen anim-spring-pop">
      {/* Top Header & Segmented Pill Switcher */}
      <header className="analyze-header">
        <div className="analyze-title-row">
          <div>
            <span className="analyze-eyebrow">Product Verification</span>
            <h1 className="analyze-title">Scan & Inspect</h1>
          </div>
          <div className="profile-indicator-pill" onClick={() => onNavigate('/profile')}>
            <ShieldCheck size={14} />
            <span>{profile.allergies.length} Rules Active</span>
          </div>
        </div>

        {/* Segmented Pill Control (Design Reference specification) */}
        <div className="segmented-pill-control">
          <button
            type="button"
            className={`segment-btn ${activeTab === 'barcode' ? 'active' : ''}`}
            onClick={() => { setActiveTab('barcode'); clearError(); }}
          >
            <ScanLine size={16} />
            <span>Barcode Scanner</span>
          </button>
          <button
            type="button"
            className={`segment-btn ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => { setActiveTab('photo'); clearError(); }}
          >
            <Camera size={16} />
            <span>Label Photo OCR</span>
          </button>
        </div>
      </header>

      {/* Edge Case Error States (Mission 7 Dedicated UI) */}
      {edgeCaseError ? (
        <section className="wellness-card edge-case-card anim-spring-pop">
          {edgeCaseError.type === 'barcode_not_found' ? (
            /* Edge Case 1: Barcode Not Found */
            <div className="edge-state-wrap">
              <div className="edge-icon-bubble not-found-bubble">
                <SearchX size={38} color="#452600" />
              </div>
              <h2 className="edge-title">{edgeCaseError.title}</h2>
              <p className="edge-desc">{edgeCaseError.description}</p>
              <div className="edge-advice-box">
                <p>💡 {edgeCaseError.actionPrompt}</p>
              </div>
              <div className="edge-actions">
                <button
                  className="btn-pill-primary"
                  onClick={() => { setActiveTab('photo'); clearError(); }}
                >
                  <Camera size={16} />
                  <span>Switch to Photo OCR</span>
                </button>
                <button className="btn-pill-secondary" onClick={clearError}>
                  <RefreshCw size={14} />
                  <span>Scan Another Barcode</span>
                </button>
              </div>
            </div>
          ) : edgeCaseError.type === 'image_unreadable' ? (
            /* Edge Case 2: Image Unreadable */
            <div className="edge-state-wrap">
              <div className="edge-icon-bubble unreadable-bubble">
                <EyeOff size={38} color="#50100C" />
              </div>
              <h2 className="edge-title">{edgeCaseError.title}</h2>
              <p className="edge-desc">{edgeCaseError.description}</p>
              <div className="edge-advice-box">
                <p>📸 {edgeCaseError.actionPrompt}</p>
              </div>
              <div className="edge-actions">
                <button className="btn-pill-primary" onClick={clearError}>
                  <RefreshCw size={16} />
                  <span>Retake Clearer Photo</span>
                </button>
                <button
                  className="btn-pill-secondary"
                  onClick={() => { setActiveTab('barcode'); clearError(); }}
                >
                  <ScanLine size={14} />
                  <span>Try Barcode Instead</span>
                </button>
              </div>
            </div>
          ) : (
            /* Generic error */
            <div className="edge-state-wrap">
              <div className="edge-icon-bubble generic-bubble">
                <AlertCircle size={38} color="#111111" />
              </div>
              <h2 className="edge-title">{edgeCaseError.title}</h2>
              <p className="edge-desc">{edgeCaseError.description}</p>
              <button className="btn-pill-primary" onClick={clearError}>
                <span>Dismiss & Retry</span>
              </button>
            </div>
          )}
        </section>
      ) : (
        /* Normal Capture View */
        <main className="capture-viewport-container">
          {activeTab === 'barcode' ? (
            <BarcodeScanner
              onScanSuccess={handleBarcodeSuccess}
              onError={(err) => console.warn('Scanner error:', err)}
            />
          ) : (
            <ImageUpload
              onImageAnalyze={handleImageAnalyze}
              isAnalyzing={loading}
            />
          )}
        </main>
      )}
    </div>
  );
}
