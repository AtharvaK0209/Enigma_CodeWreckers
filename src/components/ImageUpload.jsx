import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, Sparkles, Image as ImageIcon, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import './ImageUpload.css';

/**
 * Client-side image compressor using HTML5 canvas
 * Ensures large camera photos don't freeze the UI or blow out base64 payloads
 */
function compressImage(file, maxWidth = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({ onImageAnalyze, isAnalyzing = false }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Sample food photos for quick testing & validation
  const samplePhotos = [
    {
      label: 'Nutella Ingredients Panel',
      key: '8000500310427',
      url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
      note: 'Tree nuts & milk risk',
      dataQuality: 'good',
    },
    {
      label: 'Oreo Nutrition Label',
      key: '7622210449283',
      url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
      note: 'Gluten & soy triggers',
      dataQuality: 'verify_label', // Tests 2nd data quality state!
    },
    {
      label: 'Certified Pure Oats Label',
      key: '030000010204',
      url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
      note: '100% wholesome & safe',
      dataQuality: 'good',
    },
    {
      label: 'Blurry / Glared Label',
      key: 'SIMULATE_BLURRY_IMAGE',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      note: 'Edge Case 2: Unreadable Image',
      forceUnreadable: true,
      dataQuality: 'clearer_photo', // Tests 3rd data quality state!
    },
  ];

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  };

  const processSelectedFile = async (file) => {
    try {
      const compressedBase64 = await compressImage(file);
      setPreviewUrl(compressedBase64);
      triggerAnalysis(compressedBase64);
    } catch (err) {
      console.error('[ImageUpload] Error reading image:', err);
    }
  };

  const triggerAnalysis = (base64, options = {}) => {
    // Cycle through illustrated phases during analysis
    setLoadingPhase(1);
    const p1 = setTimeout(() => setLoadingPhase(2), 350);
    const p2 = setTimeout(() => setLoadingPhase(3), 650);

    onImageAnalyze(base64, options).finally(() => {
      clearTimeout(p1);
      clearTimeout(p2);
      setLoadingPhase(0);
    });
  };

  const handlePresetSelect = (preset) => {
    setPreviewUrl(preset.url);
    triggerAnalysis(preset.url, {
      productKey: preset.key,
      forceUnreadable: preset.forceUnreadable || false,
      dataQuality: preset.dataQuality || 'good',
    });
  };

  // Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="image-upload-component">
      {/* Hidden file and camera inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
      />

      {/* Main Dropzone / Camera View */}
      {!isAnalyzing ? (
        <div
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <div className="preview-wrap">
              <img src={previewUrl} alt="Ingredient Panel" className="selected-preview-img" />
              <div className="preview-overlay-tag">
                <Sparkles size={14} />
                <span>Ready to Analyze</span>
              </div>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon-bubble">
                <UploadCloud size={32} />
              </div>
              <h3 className="dropzone-title">Upload Food Label Photo</h3>
              <p className="dropzone-desc">
                Drag and drop a photo here, or browse files on your device.
              </p>
              <div className="dropzone-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="btn-pill-primary action-pill"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={16} />
                  <span>Take Live Photo</span>
                </button>
                <button
                  type="button"
                  className="btn-pill-secondary action-pill"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={16} />
                  <span>Choose from Gallery</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Illustrated / Animated Loading State (Mission 4 Constraint) */
        <div className="analysis-loading-card anim-spring-pop">
          <div className="loading-hud-graphic">
            <div className="loading-orbit-ring anim-pulse"></div>
            <div className="loading-icon-center">
              <Sparkles size={36} color="#153C19" />
            </div>
          </div>

          <h3 className="loading-title">Multimodal Ingredient Inspection</h3>

          <div className="loading-phase-indicator">
            <div className={`phase-step ${loadingPhase >= 1 ? 'active' : ''}`}>
              <span className="phase-bullet"></span>
              <span>Scanning OCR bounding boxes</span>
            </div>
            <div className={`phase-step ${loadingPhase >= 2 ? 'active' : ''}`}>
              <span className="phase-bullet"></span>
              <span>Cross-referencing allergy profile</span>
            </div>
            <div className={`phase-step ${loadingPhase >= 3 ? 'active' : ''}`}>
              <span className="phase-bullet"></span>
              <span>Synthesizing safety verdict</span>
            </div>
          </div>

          <p className="loading-note">
            Examining ingredients, hidden derivatives, and advisory statements...
          </p>
        </div>
      )}

      {/* Instant Testing Presets for Desktops & Quick Verification */}
      <div className="photo-presets-section">
        <span className="photo-presets-title">Instant Sample Photos (Click to Analyze):</span>
        <div className="photo-presets-grid">
          {samplePhotos.map((preset, index) => (
            <div
              key={index}
              className="photo-preset-card"
              onClick={() => handlePresetSelect(preset)}
              title={`${preset.label} — ${preset.note}`}
            >
              <img src={preset.url} alt={preset.label} className="preset-thumb" />
              <div className="preset-meta">
                <span className="preset-name">{preset.label}</span>
                <span className="preset-tag">{preset.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
