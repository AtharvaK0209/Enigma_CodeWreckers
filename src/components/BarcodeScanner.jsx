import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Barcode,
  Image as ImageIcon,
  Keyboard,
  ArrowRight
} from 'lucide-react';
import PillButton from './common/PillButton';
import Card from './common/Card';
import './BarcodeScanner.css';

/**
 * BarcodeScanner component with robust mobile camera lifecycle management:
 * - Prioritizes rear/environment-facing camera explicitly
 * - Guarantees hardware MediaStreamTrack release on unmount / navigation
 * - Implements all 3 mandated fallbacks: "Try again", "Upload a photo instead", "Type barcode manually"
 * 
 * @param {Object} props
 * @param {Function} props.onScanSuccess - Triggered on valid barcode decode
 * @param {Function} [props.onSwitchToPhoto] - Callback to switch to photo OCR tab
 * @param {Function} [props.onError] - Error callback
 */
export default function BarcodeScanner({ onScanSuccess, onSwitchToPhoto, onError }) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [isManualFocused, setIsManualFocused] = useState(false);
  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);
  const manualInputRef = useRef(null);

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
        fps: 12,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.72;
          return { width: Math.round(edge), height: Math.round(edge * 0.7) };
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

  useEffect(() => {
    startScanner();

    return () => {
      stopAndReleaseStreams();
    };
  }, []);

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
    setIsManualFocused(true);
    if (manualInputRef.current) {
      manualInputRef.current.focus();
      manualInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="barcode-scanner-component">
      {/* Viewfinder Window with Aspect Ratio Guardrail */}
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

        {/* Camera Permission / Hardware Failure: Mandated 3 Fallback Actions */}
        {cameraError && (
          <div className="camera-error-fallback anim-spring-pop">
            <div className="fallback-icon-wrap">
              <CameraOff size={30} />
            </div>
            <h4 className="fallback-title">Camera Can't Open</h4>
            <p className="fallback-message">{cameraError.message}</p>

            <div className="mandated-fallbacks-stack">
              {/* Fallback 1: Try Again */}
              <PillButton
                variant="primary"
                size="sm"
                icon={RefreshCw}
                onClick={startScanner}
              >
                Try Again
              </PillButton>

              {/* Fallback 2: Upload a Photo Instead */}
              <PillButton
                variant="secondary"
                size="sm"
                icon={ImageIcon}
                onClick={() => onSwitchToPhoto && onSwitchToPhoto()}
              >
                Upload a Photo Instead
              </PillButton>

              {/* Fallback 3: Type the Barcode Number In */}
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

        {/* Idle Loading State before camera starts */}
        {!scannerActive && !cameraError && (
          <div className="scanner-idle-placeholder">
            <div className="idle-pulse-ring">
              <Camera size={26} />
            </div>
            <p className="idle-text">Opening rear lens...</p>
          </div>
        )}
      </div>

      {/* Camera Toggle Button */}
      <div className="scanner-controls-bar">
        {scannerActive ? (
          <PillButton variant="secondary" size="sm" icon={CameraOff} onClick={stopAndReleaseStreams}>
            Pause Camera
          </PillButton>
        ) : (
          <PillButton variant="primary" size="sm" icon={Camera} onClick={startScanner}>
            Launch Camera
          </PillButton>
        )}
      </div>

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
