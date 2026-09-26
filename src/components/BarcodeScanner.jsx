import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Barcode,
  Image as ImageIcon,
  Keyboard,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Lock,
  CheckCircle2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import PillButton from './common/PillButton';
import Card from './common/Card';
import './BarcodeScanner.css';

/**
 * BarcodeScanner component with robust mobile camera permission and lifecycle management:
 * - Explicit Mobile Camera Permission Pop-up Modal ensuring direct user gesture
 * - Prioritizes rear/environment-facing camera explicitly
 * - Guarantees hardware MediaStreamTrack release on unmount / navigation
 * - Implements 3 mandated fallbacks + native mobile camera capture
 */
export default function BarcodeScanner({ onScanSuccess, onSwitchToPhoto, onError }) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isManualFocused, setIsManualFocused] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadBarcodeError, setUploadBarcodeError] = useState(null);

  // Check if camera permission was already granted in this session
  const [showPermissionModal, setShowPermissionModal] = useState(() => {
    try {
      const alreadyGranted = sessionStorage.getItem('nutrilens_camera_granted');
      return alreadyGranted !== 'true';
    } catch {
      return true;
    }
  });

  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);
  const manualInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);
  const barcodeImageInputRef = useRef(null);

  // Quick test barcodes for instant testing & desktop verification
  const sampleBarcodes = [
    { code: '8000500310427', label: 'Nutella Spread', note: 'Allergen triggers' },
    { code: '7622210449283', label: 'Oreo Cookies', note: 'Gluten & soy' },
    { code: '030000010204', label: 'Rolled Oats', note: '100% Wholesome' },
    { code: '5449000000996', label: 'Volt Energy Drink', note: 'Hypertension warning' },
    { code: '999999999999', label: 'Unregistered Barcode', note: 'Edge Case 1' },
  ];

  // Stop and release all video stream tracks completely
  const stopAndReleaseStreams = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('[BarcodeScanner] Error during scanner.stop():', e);
      }
    }

    // Explicit hardware track shutdown to ensure no camera stream hangs or duplicates
    const videoEl = document.querySelector('#nutrilens-qr-reader video');
    if (videoEl && videoEl.srcObject) {
      try {
        const stream = videoEl.srcObject;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        videoEl.srcObject = null;
      } catch (err) {
        console.warn('[BarcodeScanner] Stream track release error:', err);
      }
    }

    setScannerActive(false);
  };

  const startScanner = async () => {
    if (isStartingRef.current || scannerActive) return;
    isStartingRef.current = true;
    setCameraError(null);

    const viewportId = 'nutrilens-qr-reader';
    const element = document.getElementById(viewportId);
    if (!element) {
      isStartingRef.current = false;
      return;
    }

    // Clean any residual instance before initializing
    await stopAndReleaseStreams();

    try {
      scannerRef.current = new Html5Qrcode(viewportId);

      const qrCodeSuccessCallback = async (decodedText) => {
        await stopAndReleaseStreams();
        if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
      };

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.74;
          return { width: Math.round(edge), height: Math.round(edge * 0.68) };
        },
        aspectRatio: 1.0,
      };

      // 1. Prioritize explicit rear/environment camera for mobile phones
      try {
        await scannerRef.current.start(
          { facingMode: { exact: 'environment' } },
          config,
          qrCodeSuccessCallback,
          () => {} // silent scan frame
        );
      } catch (exactEnvErr) {
        console.info('[BarcodeScanner] Exact environment facingMode unavailable, trying soft constraint:', exactEnvErr.message);
        try {
          await scannerRef.current.start(
            { facingMode: 'environment' },
            config,
            qrCodeSuccessCallback,
            () => {}
          );
        } catch (softEnvErr) {
          console.info('[BarcodeScanner] Environment camera unavailable, falling back to default camera device:', softEnvErr.message);
          // 2. Fallback to any default camera (common on desktops/laptops)
          await scannerRef.current.start(
            { facingMode: 'user' },
            config,
            qrCodeSuccessCallback,
            () => {}
          );
        }
      }

      setScannerActive(true);
      setShowPermissionModal(false);
      try {
        sessionStorage.setItem('nutrilens_camera_granted', 'true');
      } catch {}
    } catch (err) {
      console.warn('[BarcodeScanner] Camera initialization failed:', err);
      let errorType = 'UNAVAILABLE';
      let message = 'Unable to open camera on this device.';

      if (err.name === 'NotAllowedError' || err.message?.includes('Permission') || err.message?.includes('denied')) {
        errorType = 'DENIED';
        message = 'Camera permission was denied in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.message?.includes('device not found')) {
        errorType = 'NOT_FOUND';
        message = 'No optical camera device found on this system.';
      }

      setCameraError({ type: errorType, message });
      setScannerActive(false);
      if (onError) onError(err);
    } finally {
      isStartingRef.current = false;
    }
  };

  /**
   * Direct User Gesture handler for Mobile Browsers:
   * iOS Safari & Chrome Mobile require a direct tap/click to request camera permissions
   */
  const handleRequestCameraPermission = async () => {
    setIsRequesting(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API requires a secure connection (HTTPS) or localhost.');
      }

      // Explicit direct user-gesture permission request
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });

      // Stop test stream immediately so Html5Qrcode can bind directly
      stream.getTracks().forEach((track) => track.stop());

      try {
        sessionStorage.setItem('nutrilens_camera_granted', 'true');
      } catch {}

      setShowPermissionModal(false);
      await startScanner();
    } catch (err) {
      console.warn('[BarcodeScanner] Direct permission request error:', err);
      let errorType = 'DENIED';
      let message = 'Camera permission was denied in your browser settings.';

      if (err.message?.includes('HTTPS') || err.name === 'SecurityError') {
        errorType = 'SECURITY';
        message = 'Mobile browsers require HTTPS or localhost for live optical camera access.';
      } else if (err.name === 'NotFoundError') {
        errorType = 'NOT_FOUND';
        message = 'No optical camera hardware found on this device.';
      }

      setCameraError({ type: errorType, message });
      setShowPermissionModal(false);
      if (onError) onError(err);
    } finally {
      setIsRequesting(false);
    }
  };

  // If already granted in current session, auto-start
  useEffect(() => {
    const alreadyGranted = sessionStorage.getItem('nutrilens_camera_granted') === 'true';
    if (alreadyGranted) {
      startScanner();
    }

    return () => {
      stopAndReleaseStreams();
    };
  }, []);

  // Handle native photo capture from mobile camera app
  const handleNativeCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const html5QrCode = new Html5Qrcode('nutrilens-qr-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      await stopAndReleaseStreams();
      onScanSuccess(decodedText);
    } catch (err) {
      console.info('[BarcodeScanner] Barcode not found in captured photo, redirecting to photo label OCR:', err);
      if (onSwitchToPhoto) {
        onSwitchToPhoto();
      }
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Handle direct barcode image file upload (Mission 4)
  const handleBarcodeImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setUploadBarcodeError(null);
    try {
      const html5QrCode = new Html5Qrcode('nutrilens-qr-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      await stopAndReleaseStreams();
      onScanSuccess(decodedText);
    } catch (err) {
      console.warn('[BarcodeScanner] Barcode decode failed from image file:', err);
      setUploadBarcodeError("couldn't read a barcode in that image");
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      await stopAndReleaseStreams();
      onScanSuccess(manualCode.trim());
    }
  };

  const handlePresetClick = async (code) => {
    await stopAndReleaseStreams();
    onScanSuccess(code);
  };

  const handleFocusManualInput = () => {
    setShowPermissionModal(false);
    setIsManualFocused(true);
    if (manualInputRef.current) {
      manualInputRef.current.focus();
      manualInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="barcode-scanner-component">
      {/* Hidden input for native mobile camera fallback */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={handleNativeCapture}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {/* 1. Mobile Camera Permission Card (Rendered when permission not yet granted) */}
      {showPermissionModal && !scannerActive && (
        <Card className="permission-modal-card anim-spring-pop">
          <div className="permission-modal-glow"></div>
          <div className="permission-icon-bubble">
            <Camera size={34} strokeWidth={2.2} />
          </div>

          <span className="permission-badge">Camera Access</span>
          <h3 className="permission-modal-title">Enable Camera to Scan</h3>
          <p className="permission-modal-desc">
            NutriLens inspects food barcodes and ingredients in real-time to alert you of allergens and safety risks.
          </p>

          <div className="permission-trust-bullets">
            <div className="trust-bullet">
              <CheckCircle2 size={14} className="trust-icon" />
              <span>Real-time instant product identification</span>
            </div>
            <div className="trust-bullet">
              <CheckCircle2 size={14} className="trust-icon" />
              <span>Private and evaluated locally on your device</span>
            </div>
          </div>

          <div className="permission-modal-actions">
            <PillButton
              variant="primary"
              size="lg"
              icon={Camera}
              disabled={isRequesting}
              onClick={handleRequestCameraPermission}
              className="permission-cta-btn"
            >
              {isRequesting ? 'Requesting Permission...' : 'Allow Camera & Scan'}
            </PillButton>

            <div className="permission-sub-options">
              <button
                type="button"
                className="permission-text-btn"
                onClick={() => nativeCameraInputRef.current?.click()}
              >
                <Smartphone size={14} />
                <span>Open Phone Camera (Take Photo)</span>
              </button>

              <button
                type="button"
                className="permission-text-btn"
                onClick={handleFocusManualInput}
              >
                <Keyboard size={14} />
                <span>Enter Barcode Manually</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Viewfinder Window with Aspect Ratio Guardrail (Rendered when scanning or error) */}
      {(!showPermissionModal || scannerActive) && (
        <div className="scanner-viewfinder-card">
          <div id="nutrilens-qr-reader" className="scanner-video-feed"></div>

          {/* Viewfinder Reticle Overlay with Animated Scanning Laser */}
          {scannerActive && !cameraError && (
            <div className="reticle-overlay" aria-hidden="true">
              <div className="corner-bracket top-left"></div>
              <div className="corner-bracket top-right"></div>
              <div className="corner-bracket bottom-left"></div>
              <div className="corner-bracket bottom-right"></div>

              <div className="scanning-laser"></div>
              <div className="reticle-instructions">
                <Barcode size={15} />
                <span>Center barcode inside the frame</span>
              </div>
            </div>
          )}

        {/* 2. Camera Permission Denied / Error State */}
        {cameraError && !showPermissionModal && (
          <div className="camera-error-fallback anim-spring-pop">
            <div className="fallback-icon-wrap">
              <CameraOff size={30} />
            </div>
            <h4 className="fallback-title">Camera Permission Needed</h4>
            <p className="fallback-message">{cameraError.message}</p>

            {cameraError.type === 'DENIED' && (
              <div className="browser-permission-hint-box">
                <p className="hint-headline">📱 How to enable camera in your browser:</p>
                <ol className="hint-steps-list">
                  <li>Tap the <strong>lock</strong> or <strong>aA</strong> icon in your browser address bar.</li>
                  <li>Select <strong>Website Settings</strong> or <strong>Permissions</strong>.</li>
                  <li>Set <strong>Camera</strong> to <strong>Allow</strong>, then tap Try Again.</li>
                </ol>
              </div>
            )}

            <div className="mandated-fallbacks-stack">
              <PillButton
                variant="primary"
                size="sm"
                icon={RefreshCw}
                onClick={handleRequestCameraPermission}
              >
                Try Camera Again
              </PillButton>

              <PillButton
                variant="secondary"
                size="sm"
                icon={Smartphone}
                onClick={() => nativeCameraInputRef.current?.click()}
              >
                Take Photo with Phone Camera
              </PillButton>

              <PillButton
                variant="secondary"
                size="sm"
                icon={ImageIcon}
                onClick={() => onSwitchToPhoto && onSwitchToPhoto()}
              >
                Upload Photo Instead
              </PillButton>

              <PillButton
                variant="outline"
                size="sm"
                icon={Keyboard}
                onClick={handleFocusManualInput}
              >
                Type Barcode Manually
              </PillButton>
            </div>
          </div>
        )}

        {/* Idle Loading State before camera starts (when permission modal closed) */}
        {!scannerActive && !cameraError && !showPermissionModal && (
          <div className="scanner-idle-placeholder">
            <div className="idle-pulse-ring">
              <Camera size={26} />
            </div>
            <p className="idle-text">Starting camera stream...</p>
          </div>
        )}
      </div>
      )}

      {/* Hidden input for barcode image upload (Mission 4) */}
      <input
        type="file"
        ref={barcodeImageInputRef}
        onChange={handleBarcodeImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Camera Controls Bar */}
      {!showPermissionModal && (
        <div className="scanner-controls-bar" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {scannerActive ? (
            <PillButton variant="secondary" size="sm" icon={CameraOff} onClick={stopAndReleaseStreams}>
              Pause Camera
            </PillButton>
          ) : (
            <PillButton
              variant="primary"
              size="sm"
              icon={Camera}
              onClick={() => {
                setShowPermissionModal(true);
              }}
            >
              Open Camera Scanner
            </PillButton>
          )}

          <PillButton
            variant="secondary"
            size="sm"
            icon={ImageIcon}
            onClick={() => {
              setUploadBarcodeError(null);
              barcodeImageInputRef.current?.click();
            }}
            loading={isProcessingPhoto}
          >
            Upload Barcode Image
          </PillButton>
        </div>
      )}

      {/* Mission 4: Barcode Image Decode Error Banner */}
      {uploadBarcodeError && (
        <div
          className="upload-barcode-error-banner anim-spring-pop"
          style={{
            margin: '12px auto',
            maxWidth: '460px',
            padding: '12px 16px',
            borderRadius: '14px',
            background: '#FEF2F2',
            border: '1px solid #FECDD3',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: '500',
          }}
        >
          <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
          <span>{uploadBarcodeError}</span>
        </div>
      )}

      {/* Manual Barcode Input & Test Presets */}
      <Card className={`manual-barcode-card ${isManualFocused ? 'is-focused-highlight' : ''}`}>
        <div className="divider-label">
          <span>Or enter barcode manually</span>
        </div>

        <form onSubmit={handleManualSubmit} className="manual-barcode-form">
          <input
            ref={manualInputRef}
            type="text"
            className="barcode-input"
            placeholder="Type 12 or 13 digit EAN / UPC..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <PillButton type="submit" variant="primary" size="md">
            Check
          </PillButton>
        </form>

        {/* Quick Testing Barcodes */}
        <div className="preset-barcodes-block">
          <span className="presets-title">Quick Test Barcodes:</span>
          <div className="presets-list">
            {sampleBarcodes.map((item) => (
              <button
                key={item.code}
                type="button"
                className="barcode-chip"
                onClick={() => handlePresetClick(item.code)}
                title={`${item.note} (${item.code})`}
              >
                <Barcode size={13} />
                <span className="chip-name">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
