import React, { createContext, useContext, useState } from 'react';
import { analyzeBarcode, analyzeImage } from '../services/api';
import { useProfile } from './ProfileContext';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const { profile } = useProfile();
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [lastMethod, setLastMethod] = useState(null);

  const runBarcodeScan = async (barcode) => {
    setLoading(true);
    setLoadingMessage('Scanning barcode against food safety registry...');
    setError(null);
    setLastMethod('barcode');

    try {
      const result = await analyzeBarcode(barcode, profile);
      setCurrentResult(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const runImageScan = async (base64Image, options = {}) => {
    setLoading(true);
    setLoadingMessage('Transcribing ingredients with multimodal AI...');
    setError(null);
    setLastMethod('image');

    try {
      const result = await analyzeImage(base64Image, profile, options);
      setCurrentResult(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearAnalysis = () => {
    setCurrentResult(null);
    setError(null);
    setLastMethod(null);
  };

  return (
    <AnalysisContext.Provider
      value={{
        currentResult,
        setCurrentResult,
        loading,
        loadingMessage,
        error,
        setError,
        lastMethod,
        runBarcodeScan,
        runImageScan,
        clearAnalysis,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
