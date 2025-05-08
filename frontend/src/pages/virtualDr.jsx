import React, { useState, useEffect, useRef } from 'react';
import '../ui/virtualdr.css';
import '@splinetool/viewer';

// Add OpenCV.js script
const loadOpenCV = () => {
  if (window._opencvLoadingPromise) return window._opencvLoadingPromise;
  window._opencvLoadingPromise = new Promise((resolve) => {
    // Check if OpenCV is already loaded
    if (window.cv) {
      console.log('OpenCV already loaded');
      resolve(window.cv);
      return;
    }

    // Remove any existing OpenCV script
    const existingScript = document.querySelector('script[src*="opencv.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    script.onload = () => {
      if (window.cv) {
        console.log('OpenCV loaded via script');
        resolve(window.cv);
      } else {
        window.onOpenCvReady = () => {
          console.log('OpenCV ready callback');
          resolve(window.cv);
        };
      }
    };
    document.body.appendChild(script);
  });
  return window._opencvLoadingPromise;
};

const VirtualDoctor = () => {
  // State variables
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusIndicator, setStatusIndicator] = useState('Online');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cv, setCv] = useState(null);
  const [faceCascade, setFaceCascade] = useState(null);
  const [debugStatus, setDebugStatus] = useState('');
  
  const messagesContainerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Cookie functions
  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const csrfToken = getCookie('csrftoken');
  const authToken = getCookie('authToken');

  // Request headers for API calls
  const getRequestHeaders = () => {
    const headers = {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Token ${authToken}`;
    }
    
    return headers;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  // Load chat history
  const loadChats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/bot/chats/`, {
        method: 'GET',
        headers: getRequestHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setChats(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading chats:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Load a specific chat
  const loadChat = async (chatId) => {
    setCurrentChatId(chatId);
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/bot/chats/${chatId}/messages/`, {
        method: 'GET',
        headers: getRequestHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setMessages(data);
      setIsLoading(false);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Create a new chat
  const createNewChat = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/bot/chats/`, {
        method: 'POST',
        headers: getRequestHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      await loadChats();
      loadChat(data.chat_id);
      
      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        setIsMobileNavOpen(false);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      setError(error.message);
    }
  };

  // Send a message
  const sendMessage = async (message) => {
    if (!currentChatId || !message.trim()) return;
    
    setInputMessage('');
    
    // Show typing indicator (add temporary message)
    const tempMessages = [...messages, { type: 'typing-indicator', id: 'typing' }];
    setMessages(tempMessages);
    
    // Scroll to bottom
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/bot/chats/${currentChatId}/messages/`, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ message: message })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Remove typing indicator and add actual messages
      setMessages(prevMessages => 
        prevMessages
          .filter(msg => msg.id !== 'typing')
          .concat([data.user_message, data.ai_message])
      );
      
      // Speak AI response
      speakAIResponse(data.ai_message.message);
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator and show error
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== 'typing')
      );
      
      setError(error.message);
      
      // Auto-remove error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  // Text-to-Speech for AI responses
  const speakAIResponse = (text) => {
    // Remove any HTML tags from the text
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    // Create speech synthesis utterance
    const speech = new SpeechSynthesisUtterance(cleanText);
    
    // Configure voice settings
    speech.rate = 1.0;  // Speed of speech
    speech.pitch = 1.0; // Pitch
    speech.volume = 1.0; // Volume
    
    // Try to find a female voice for the doctor
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('female') || 
      voice.name.includes('Woman') || 
      voice.name.includes('girl')
    );
    
    if (femaleVoice) {
      speech.voice = femaleVoice;
    }
    
    // Show speaking indicator
    setStatusIndicator('Speaking');
    
    // Speak the text
    window.speechSynthesis.speak(speech);
    
    // When done speaking, reset the status
    speech.onend = function() {
      setStatusIndicator('Online');
    };
  };

  // Speech-to-Text setup
  const setupSpeechRecognition = () => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition. Try using Chrome or Edge.');
      return false;
    }
    
    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configure
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    // Handle results
    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
        
      // Update input field with transcript
      setInputMessage(transcript);
      
      // If this is a final result
      if (event.results[0].isFinal) {
        // Auto-submit after a short delay
        if (transcript.trim().length > 0) {
          setTimeout(() => {
            if (isListening && currentChatId) {
              sendMessage(transcript.trim());
              stopListening();
            }
          }, 1000);
        }
      }
    };
    
    // Handle errors
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopListening();
    };
    
    // Handle end of speech input
    recognitionRef.current.onend = () => {
      if (isListening) {
        // If we're still supposed to be listening, restart
        recognitionRef.current.start();
      }
    };
    
    return true;
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      if (!setupSpeechRecognition()) {
        return;
      }
    }
    
    setIsListening(true);
    recognitionRef.current.start();
    setStatusIndicator('Listening...');
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
      setStatusIndicator('Online');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Load OpenCV and face cascade classifier
  useEffect(() => {
    let mounted = true;
    let opencvInstance = null;
    let faceCascadeInstance = null;

    const initOpenCV = async () => {
      try {
        console.log('Initializing OpenCV...');
        opencvInstance = await loadOpenCV();
        if (!mounted) return;
        console.log('OpenCV initialized successfully');
        setCv(opencvInstance);
        // Load face cascade classifier
        console.log('Loading face cascade classifier...');
        const response = await fetch('https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml');
        const cascadeText = await response.text();
        const xmlFile = 'haarcascade_frontalface_default.xml';
        // Remove if already exists
        try { opencvInstance.FS_unlink('/' + xmlFile); } catch (e) {}
        opencvInstance.FS_createDataFile('/', xmlFile, cascadeText, true, false, false);
        faceCascadeInstance = new opencvInstance.CascadeClassifier();
        faceCascadeInstance.load(xmlFile);
        console.log('Face cascade classifier loaded successfully');
        console.log('Cascade empty:', faceCascadeInstance.empty());
        if (faceCascadeInstance.empty()) {
          console.error('Failed to load cascade classifier!');
        }
        if (mounted) {
          setFaceCascade(faceCascadeInstance);
        }
      } catch (error) {
        console.error('Error in OpenCV initialization:', error);
      }
    };

    initOpenCV();

    return () => {
      mounted = false;
      // Clean up OpenCV resources
      if (faceCascadeInstance) {
        faceCascadeInstance.delete();
      }
    };
  }, []);

  const testCascadeLoad = () => {
    if (cv && faceCascade && typeof faceCascade.empty === 'function') {
      setDebugStatus('Cascade loaded. empty() = ' + faceCascade.empty());
      console.log('Cascade loaded. empty() =', faceCascade.empty());
    } else {
      setDebugStatus('Cascade or OpenCV not ready.');
      console.log('Cascade or OpenCV not ready.');
    }
  };

  const detectFaceOnce = () => {
    if (
      videoRef.current &&
      canvasRef.current &&
      cameraActive &&
      cv &&
      faceCascade &&
      typeof faceCascade.empty === 'function' &&
      !faceCascade.empty()
    ) {
      setDebugStatus('Running face detection ONCE...');
      console.log('Running face detection ONCE...');
      detectFaces(videoRef.current, canvasRef.current);
    } else {
      setDebugStatus('Cannot run detection: dependencies not ready or cascade empty');
      console.log('Cannot run detection: dependencies not ready or cascade empty');
    }
  };

  // Face detection function
  const detectFaces = (video, canvas) => {
    if (!cv || !faceCascade || !video || !canvas) {
      return;
    }

    try {
      // Create matrices
      const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
      const gray = new cv.Mat();
      const faces = new cv.RectVector();
      
      // Create video capture
      const cap = new cv.VideoCapture(video);
      
      // Read frame
      cap.read(src);
      
      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Detect faces
      faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0);
      
      console.log('Faces detected:', faces.size());
      
      // Draw rectangles around faces
      for (let i = 0; i < faces.size(); ++i) {
        const face = faces.get(i);
        const point1 = new cv.Point(face.x, face.y);
        const point2 = new cv.Point(face.x + face.width, face.y + face.height);
        cv.rectangle(src, point1, point2, [0, 255, 0, 255], 2);
      }
      
      // Display the result
      cv.imshow(canvas, src);
      
      // Clean up
      src.delete();
      gray.delete();
      faces.delete();
    } catch (error) {
      console.error('Error in face detection:', error);
    }
  };

  // Modified startCamera function
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 320,
          height: 240,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        cameraStreamRef.current = stream;
        setCameraActive(true);
        console.log('Camera started successfully');
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          console.log('Video dimensions:', {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          });
          // Do not start detection loop automatically
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Could not access camera. Please ensure you have granted camera permissions.');
    }
  };

  // Modified stopCamera function
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Camera functions
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Check auth status
  const checkAuthStatus = () => {
    return !!authToken;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && currentChatId) {
      sendMessage(inputMessage);
    }
  };

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  // Load chats on component mount
  useEffect(() => {
    if (checkAuthStatus()) {
      loadChats();
    }
    
    // Initialize voices for speech synthesis
    window.speechSynthesis.onvoiceschanged = function() {
      console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
    };
    
    // Load available voices
    window.speechSynthesis.getVoices();
    
    // Clean up on unmount
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Handle window resize to close sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileNavOpen]);

  return (
    <div className="virtual-doctor-container">
      {/* Mobile toggle button */}
      <button className="mobile-toggle" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
      
      {/* Overlay for mobile sidebar */}
      <div 
        className={`sidebar-overlay ${isMobileNavOpen ? 'active' : ''}`} 
        onClick={toggleSidebar}
      ></div>
      
      <div className="main-layout">
        {/* Left sidebar - Chat history */}
        <div className={`chat-history-panel ${isMobileNavOpen ? 'open' : ''}`}>
          <div className="panel-header">
            <h2>Chat History</h2>
            <button className="new-chat-btn" onClick={createNewChat}>
              <i className="fas fa-plus"></i> New Chat
            </button>
          </div>
          
          <div className="chat-list-container">
            {isLoading && chats.length === 0 ? (
              <div className="loading-state">Loading chats...</div>
            ) : error ? (
              <div className="error-state">
                {error.includes('401') 
                  ? 'Please log in to view your chats' 
                  : 'Error loading chats'}
              </div>
            ) : chats.length === 0 ? (
              <div className="empty-state">
                No previous chats found. Start a new conversation!
              </div>
            ) : (
              <ul className="chat-list">
                {chats.map(chat => (
                  <li 
                    key={chat.id} 
                    className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                    onClick={() => {
                      loadChat(chat.id);
                      if (window.innerWidth < 768) {
                        setIsMobileNavOpen(false);
                      }
                    }}
                  >
                    <div className="chat-item-content">
                      <div className="chat-item-preview">{chat.preview}</div>
                      <div className="chat-item-time">{formatDate(chat.created_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Middle column - Avatar and Camera */}
        <div className="avatar-panel">
          <div className="panel-header">
            <h2>Virtual Doctor</h2>
            <div className={`status-badge ${statusIndicator.toLowerCase()}`}>
              {statusIndicator}
            </div>
          </div>
          
          <div className="avatar-content">
            <div className="spline-container">
              <spline-viewer url="https://prod.spline.design/cOzASNbuQZklJ8d0/scene.splinecode"></spline-viewer>
            </div>
            
            <div className="camera-container">
              <div className="camera-feed">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxWidth: '320px' }}
                />
                <canvas
                  ref={canvasRef}
                  width="320"
                  height="240"
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    maxWidth: '320px'
                  }}
                />
              </div>
              <div className="debug-status" style={{marginTop: '10px', fontWeight: 500, color: '#0066ff'}}>{debugStatus}</div>
              <button onClick={startCamera} className="camera-button">Start Camera</button>
              <button onClick={testCascadeLoad} className="camera-button" style={{marginLeft: '8px'}}>Test Cascade Load</button>
              <button onClick={detectFaceOnce} className="camera-button" style={{marginLeft: '8px'}}>Detect Face (Once)</button>
            </div>
          </div>
        </div>
        
        {/* Right column - Chat interface */}
        <div className="chat-panel">
          <div className="panel-header">
            <div className="doctor-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <h2>Consultation</h2>
          </div>
          
          <div className="chat-content">
            <div 
              ref={messagesContainerRef}
              className="messages-container"
            >
              {!currentChatId ? (
                <div className="welcome-screen">
                  <div className="welcome-icon">
                    <i className="fas fa-comment-medical"></i>
                  </div>
                  <h3>Welcome to Virtual Doctor</h3>
                  <p>Select a previous conversation or start a new chat to begin your consultation.</p>
                </div>
              ) : isLoading ? (
                <div className="loading-screen">
                  <div className="loading-spinner"></div>
                  <p>Loading your conversation...</p>
                </div>
              ) : error ? (
                <div className="error-screen">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-chat-screen">
                  <p>Start the conversation by sending a message!</p>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message, index) => (
                    message.type === 'typing-indicator' ? (
                      <div key="typing" className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    ) : (
                      <div key={message.id || index} className={`message ${message.type}`}>
                        <div className="message-bubble">
                          <div className="message-content" dangerouslySetInnerHTML={{ __html: message.message.replace(/\n/g, '<br>') }}></div>
                          <div className="message-time">{formatDate(message.created_at)}</div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="chat-input-form">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message here..."
                disabled={!currentChatId || isLoading}
                className="chat-input"
              />
              <button 
                type="button"
                onClick={toggleListening}
                className={`mic-button ${isListening ? 'active' : ''}`}
                disabled={!currentChatId || isLoading}
              >
                <i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
              </button>
              <button 
                type="submit" 
                className="send-button"
                disabled={!currentChatId || isLoading || !inputMessage.trim()}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualDoctor;