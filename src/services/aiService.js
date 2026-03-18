/**
 * AI Service for Real Estate 3D Scanner
 * Handles communication with the AI backend endpoints
 */

// Get API base URL
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'realestate3d-demo.com' || hostname.includes('workers.dev') || hostname.includes('pages.dev')) {
    return 'https://realestate3d-backend.onrender.com/api';
  }
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Send a chat message to the AI assistant
 * @param {Object} params - Chat parameters
 * @param {string} params.modelId - The model ID being viewed
 * @param {string} params.message - The user's message
 * @param {Array} params.measurements - Any measurements taken
 * @param {Array} params.conversationHistory - Previous messages
 * @returns {Promise<Object>} AI response
 */
export const sendChatMessage = async ({ modelId, message, measurements = [], conversationHistory = [] }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelId,
        message,
        measurements,
        conversationHistory
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'AI chat failed');
    }

    return data;
  } catch (error) {
    console.error('AI chat error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get AI response',
    };
  }
};

/**
 * Get AI description of a property
 * @param {string} modelId - The model ID
 * @returns {Promise<Object>} AI description
 */
export const getPropertyDescription = async (modelId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/describe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ modelId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'AI description failed');
    }

    return data;
  } catch (error) {
    console.error('AI describe error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get AI description',
    };
  }
};

/**
 * Convert speech to text using Web Speech API
 * @returns {Promise<string>} Transcribed text
 */
export const speechToText = () => {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event) => {
      reject(new Error(event.error));
    };

    recognition.start();
  });
};

/**
 * Convert text to speech
 * @param {string} text - Text to speak
 * @param {Object} options - Voice options
 */
export const textToSpeech = (text, options = {}) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 1;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;

  // Use a natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Google') || 
    v.name.includes('Natural') ||
    v.name.includes('Samantha')
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
};

/**
 * Format measurement for display
 * @param {number} meters - Distance in meters
 * @param {string} unit - Desired unit ('m', 'ft', 'in')
 * @returns {Object} Formatted measurement
 */
export const formatMeasurement = (meters, unit = 'm') => {
  switch (unit) {
    case 'ft':
      return {
        value: (meters * 3.28084).toFixed(2),
        unit: 'ft',
        display: `${(meters * 3.28084).toFixed(2)} ft`
      };
    case 'in':
      return {
        value: (meters * 39.3701).toFixed(1),
        unit: 'in',
        display: `${(meters * 39.3701).toFixed(1)} in`
      };
    default:
      return {
        value: meters.toFixed(2),
        unit: 'm',
        display: `${meters.toFixed(2)} m`
      };
  }
};

export default {
  sendChatMessage,
  getPropertyDescription,
  speechToText,
  textToSpeech,
  formatMeasurement,
};
