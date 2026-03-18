import { useState, useCallback } from 'react';
import {
  uploadToKiriEngine,
  checkKiriStatus,
  downloadKiriModel,
  testKiriConnection as testKiriConnectionService,
} from '../services/kiriEngine';
import { getFromLocalStorage, saveToLocalStorage } from '../services/storageService';

export const useKiriAPI = () => {
  const [kiriApiKey, setKiriApiKey] = useState(
    getFromLocalStorage('kiriApiKey', '')
  );
  const [isProcessingKiri, setIsProcessingKiri] = useState(false);
  const [isTestingKiriConnection, setIsTestingKiriConnection] = useState(false);
  const [kiriProgress, setKiriProgress] = useState(0);
  const [kiriStatus, setKiriStatus] = useState('');

  const saveApiKey = useCallback((key) => {
    setKiriApiKey(key);
    saveToLocalStorage('kiriApiKey', key);
  }, []);

  const processWithKiri = useCallback(
    async (capturedFrames, onSuccess, onError) => {
      try {
        if (!kiriApiKey) {
          throw new Error('Please set your Kiri Engine API key in Settings first!');
        }

        if (capturedFrames.length < 20) {
          throw new Error(
            'Please capture at least 20 images for Kiri Engine processing!'
          );
        }

        setIsProcessingKiri(true);
        setKiriStatus('Uploading images to Kiri Engine...');
        setKiriProgress(10);

        const serialNumber = await uploadToKiriEngine(capturedFrames, kiriApiKey);

        setKiriStatus('Upload successful! Waiting for processing to begin...');
        setKiriProgress(30);

        await new Promise(resolve => setTimeout(resolve, 3000));

        await pollKiriStatus(serialNumber, onSuccess, onError);
      } catch (error) {
        console.error('Kiri Engine error:', error);
        setIsProcessingKiri(false);
        setKiriStatus('');
        setKiriProgress(0);
        if (onError) onError(error.message);
      }
    },
    [kiriApiKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const pollKiriStatus = async (serialNumber, onSuccess, onError) => {
    const maxAttempts = 180;
    const pollIntervalMs = 10000;
    const maxTimeoutCycles = 6;
    let attempts = 0;
    let timeoutCycles = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 20;

    const checkStatus = async () => {
      try {
        const statusData = await checkKiriStatus(serialNumber, kiriApiKey);

        consecutiveErrors = 0;

        switch (statusData.status) {
          case 0:
            setKiriStatus('Queued for processing...');
            setKiriProgress(35);
            break;
          case 1:
            setKiriStatus('Processing 3D model...');
            setKiriProgress(50 + attempts * 0.3);
            break;
          case 2:
            setKiriStatus('Processing complete! Downloading...');
            setKiriProgress(90);
            await handleKiriComplete(serialNumber, onSuccess);
            return;
          case 3:
            throw new Error('Processing failed - Kiri Engine reported an error');
          default:
            setKiriStatus('Unknown status');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, pollIntervalMs);
        } else {
          timeoutCycles++;

          if (timeoutCycles < maxTimeoutCycles) {
            attempts = 0;
            setKiriStatus(
              `Kiri is still processing job ${serialNumber}. Continuing checks automatically (${timeoutCycles}/${maxTimeoutCycles - 1}).`
            );
            setTimeout(checkStatus, pollIntervalMs);
            return;
          }

          throw new Error(
            `Kiri processing is still not complete for job ${serialNumber} after extended monitoring. ` +
            'Do not re-upload photos; keep this job ID and retry later from the same session.'
          );
        }
      } catch (error) {
        console.error('Status check error:', error);
        consecutiveErrors++;

        const is500Error = error.message?.includes('500');
        const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('Network');

        if ((is500Error || isNetworkError) && consecutiveErrors < maxConsecutiveErrors && attempts < maxAttempts) {
          console.warn(`[Kiri Engine] Retrying after error (attempt ${consecutiveErrors}/${maxConsecutiveErrors})...`);
          setKiriStatus(`Connecting to Kiri Engine... (retry ${consecutiveErrors})`);
          attempts++;
          setTimeout(checkStatus, pollIntervalMs);
        } else {
          setKiriStatus(`Error: ${error.message}`);
          setIsProcessingKiri(false);
          if (onError) onError(error.message);
        }
      }
    };

    checkStatus();
  };

  const handleKiriComplete = async (serialNumber, onSuccess) => {
    try {
      const modelUrl = await downloadKiriModel(serialNumber, kiriApiKey);

      setKiriProgress(95);
      setKiriStatus('Processing complete! Auto-importing to gallery...');

      if (onSuccess) {
        await onSuccess(modelUrl, serialNumber);
      }

      setKiriProgress(100);
      setKiriStatus('Complete! Model imported successfully.');

      setTimeout(() => {
        setIsProcessingKiri(false);
        setKiriStatus('');
        setKiriProgress(0);
      }, 1500);
    } catch (error) {
      console.error('Download error:', error);
      setKiriStatus(`Error: ${error.message}`);
      setIsProcessingKiri(false);
      setKiriProgress(0);
      throw error;
    }
  };

  const testKiriConnection = useCallback(
    async (apiKey) => {
      const key = (apiKey ?? kiriApiKey ?? '').trim();
      if (!key) {
        throw new Error('Please enter your Kiri Engine API key first.');
      }

      setIsTestingKiriConnection(true);
      try {
        return await testKiriConnectionService(key);
      } finally {
        setIsTestingKiriConnection(false);
      }
    },
    [kiriApiKey]
  );

  return {
    kiriApiKey,
    saveApiKey,
    isProcessingKiri,
    isTestingKiriConnection,
    kiriProgress,
    kiriStatus,
    processWithKiri,
    testKiriConnection,
  };
};
