import React, { useState, useRef, useEffect } from 'react';
import './AIAssistant.css';

/**
 * AI Assistant Component
 * Provides chat interface with voice/text input for property Q&A
 */
const AIAssistant = ({ 
  modelId, 
  propertyData,
  measurements = [],
  isVisible,
  onClose,
  onMeasureModeToggle,
  isMeasureMode
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Get API base URL
  const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'realestate3d-demo.com' || hostname.includes('workers.dev') || hostname.includes('pages.dev')) {
      return 'https://realestate3d-backend.onrender.com/api';
    }
    return `http://${hostname}:5000/api`;
  };

  const API_BASE_URL = getApiBaseUrl();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        // Auto-send after voice input
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on first open
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: getWelcomeMessage()
      };
      setMessages([welcomeMessage]);
    }
  }, [isVisible]);

  const getWelcomeMessage = () => {
    if (propertyData) {
      return `Hi! I'm your AI property assistant. I can answer questions about this ${propertyData.bedrooms || ''}${propertyData.bedrooms ? ' bedroom' : ''} property${propertyData.address ? ' at ' + propertyData.address : ''}. You can also use the measure tool to check room dimensions. How can I help?`;
    }
    return "Hi! I'm your AI property assistant. I can answer questions about real estate and help you explore this 3D model. Use the measure tool to check dimensions. What would you like to know?";
  };

  const handleSendMessage = async (text = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          message: text.trim(),
          measurements,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.message
        }]);
        
        // Text-to-speech for response (optional)
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.data.message);
          utterance.rate = 1;
          utterance.pitch = 1;
          // Uncomment to enable auto-speak responses:
          // window.speechSynthesis.speak(utterance);
        }
      } else {
        throw new Error(data.error || 'AI response failed');
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that request. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How many bedrooms?",
    "What's the price?",
    "Square footage?",
    "Tell me about this property"
  ];

  if (!isVisible) return null;

  return (
    <div className={`ai-assistant ${isExpanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="ai-header">
        <div className="ai-title">
          <span className="ai-icon">🤖</span>
          <span>Property Assistant</span>
        </div>
        <div className="ai-header-buttons">
          <button 
            className={`measure-btn ${isMeasureMode ? 'active' : ''}`}
            onClick={onMeasureModeToggle}
            title="Tap-to-measure"
          >
            📏
          </button>
          <button 
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Measurements Display */}
      {measurements.length > 0 && (
        <div className="measurements-display">
          <div className="measurements-title">📏 Your Measurements:</div>
          {measurements.slice(-3).map((m, i) => (
            <div key={i} className="measurement-item">
              {m.label || `Measurement ${i + 1}`}: {m.distance.toFixed(2)} {m.unit || 'm'}
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="ai-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content loading">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="quick-questions">
          {quickQuestions.map((q, i) => (
            <button 
              key={i}
              className="quick-btn"
              onClick={() => handleSendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="ai-input-area">
        <button 
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={handleVoiceInput}
          title="Voice input"
        >
          🎤
        </button>
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isListening ? "Listening..." : "Ask about this property..."}
          disabled={isListening || isLoading}
        />
        <button 
          className="send-btn"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
