import { useRef, useState, useCallback, useEffect } from 'react';

export const useCameraStream = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getCameraErrorMessage = useCallback((error) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'Camera is unavailable in this browser context. Use HTTPS (or localhost) and try again.';
    }

    if (!globalThis.isSecureContext) {
      return 'Camera access requires a secure context. Open the app using HTTPS (or localhost).';
    }

    switch (error?.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Camera permission was denied. Allow camera access in browser settings and retry.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera device was found on this system.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Camera is already in use by another application.';
      default:
        return 'Unable to access camera. Ensure you are on HTTPS (or localhost) and permissions are enabled.';
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return {
          success: false,
          message: 'Camera is unavailable in this browser context. Use HTTPS (or localhost) and try again.',
        };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      return { success: true };
    } catch (error) {
      const message = getCameraErrorMessage(error);
      console.error('Unable to access camera.', error);
      setStream(null);

      return {
        success: false,
        message,
      };
    }
  }, [getCameraErrorMessage]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
    startCamera,
    stopCamera,
    captureFrame,
  };
};
