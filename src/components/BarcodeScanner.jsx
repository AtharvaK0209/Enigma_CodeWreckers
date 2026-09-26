import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Sparkles, AlertCircle, RefreshCw, Barcode } from 'lucide-react';
import './BarcodeScanner.css';

/**
 * BarcodeScanner component utilizing html5-qrcode.
 * Provides camera permission handling, viewfinder overlay, pulse animation,
 * desktop fallback, and quick-test presets.
 */
export default function BarcodeScanner({ onScanSuccess, onError }) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const isStartingRef = useRef(false);

  // Sample barcode presets for testing (especially on laptops/desktops without rear cameras)
  const sampleBarcodes = [
    { code: '8000500310427', label: 'Nutella Spread (Nuts, Milk)', note: 'Triggers allergen risks' },
    { code: '7622210449283', label: 'Oreo Cookies (Wheat, Soy)', note: 'Triggers gluten & trace milk' },
    { code: '030000010204', label: 'Rolled Oats (100% Clean)', note: 'Wholesome safe verdict' },
    { code: '5449000000996', label: 'Volt Energy Drink', note: 'Hypertension & sugar alert' },
    { code: '999999999999', label: 'Unregistered Barcode', note: 'Edge Case 1: Not Found' },
  ];

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

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(viewportId);
      }

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        // Stop scanning on successful read
        stopScanner();
        if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
      };

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 180 },
        aspectRatio: 1.0,
      };

      // Try environment (rear) camera first, fallback to user camera
      try {
        await scannerRef.current.start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          () => {} // silent scan frame error
        );
      } catch (err) {
        // Fallback to any default camera (common on desktop/laptops)
        await scannerRef.current.start(
          { facingMode: 'user' },
          config,
          qrCodeSuccessCallback,
          () => {}
        );
      }

      setScannerActive(true);
    } catch (err) {
      console.warn('[BarcodeScanner] Camera start failed:', err);
      let message = 'Unable to access camera. Please verify camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        message = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.message?.includes('devices not found')) {
        message = 'No optical camera device found on this system. You can use manual entry or sample presets below.';
      }
      setCameraError(message);
      setScannerActive(false);
      if (onError) onError(err);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('[BarcodeScanner] Stop error:', e);
      }
      setScannerActive(false);
    }
  };

  useEffect(() => {
    // Auto-start scanner when mounted
    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopScanner();
      onScanSuccess(manualCode.trim());
    }
  };

  const handlePresetClick = (code) => {
    stopScanner();
    onScanSuccess(code);
  };

  return (
    <div className="barcode-scanner-component">
      {/* Scanner Viewport Window */}
      <div className="scanner-viewfinder-card">
        <div id="nutrilens-qr-reader" className="scanner-video-feed"></div>

        {/* Viewfinder Reticle Overlay with Animated Laser */}
        {scannerActive && (
          <div className="reticle-overlay" aria-hidden="true">
            <div className="corner-bracket top-left"></div>
            <div className="corner-bracket top-right"></div>
            <div className="corner-bracket bottom-left"></div>
            <div className="corner-bracket bottom-right"></div>

            <div className="scanning-laser"></div>
            <div className="reticle-instructions">
              <Barcode size={16} />
              <span>Center barcode inside the frame</span>
            </div>
          </div>
        )}

        {/* Camera Permission / Error Fallback UI */}
        {cameraError && (
          <div className="camera-error-fallback">
            <div className="fallback-icon">
              <CameraOff size={32} />
            </div>
            <h4 className="fallback-title">Camera Feed Unavailable</h4>
            <p className="fallback-message">{cameraError}</p>
            <button className="btn-pill-secondary retry-btn" onClick={startScanner}>
              <RefreshCw size={14} />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Idle / Loading State before camera boots */}
        {!scannerActive && !cameraError && (
          <div className="scanner-idle-placeholder">
            <div className="idle-pulse-ring">
              <Camera size={28} />
            </div>
            <p className="idle-text">Initializing optical lens...</p>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="scanner-controls">
        {scannerActive ? (
          <button className="btn-pill-secondary control-pill" onClick={stopScanner}>
            <CameraOff size={16} />
            <span>Pause Camera</span>
          </button>
        ) : (
          <button className="btn-pill-primary control-pill" onClick={startScanner}>
            <Camera size={16} />
            <span>Launch Camera</span>
          </button>
        )}
      </div>

      {/* Manual Barcode Input & Desktop Testing Presets */}
      <div className="manual-barcode-section">
        <div className="divider-label">
          <span>Or enter barcode manually</span>
        </div>

        <form onSubmit={handleManualSubmit} className="manual-barcode-form">
          <input
            type="text"
            className="barcode-input"
            placeholder="Type 12 or 13 digit EAN/UPC..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button type="submit" className="btn-pill-primary scan-submit-btn">
            <span>Analyze</span>
          </button>
        </form>

        {/* Quick Testing Barcodes */}
        <div className="preset-barcodes-block">
          <span className="presets-title">Quick Test Presets (Instant Simulation):</span>
          <div className="presets-list">
            {sampleBarcodes.map((item) => (
              <button
                key={item.code}
                className="barcode-chip"
                onClick={() => handlePresetClick(item.code)}
                title={`${item.note} (${item.code})`}
              >
                <Barcode size={14} />
                <span className="chip-name">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
