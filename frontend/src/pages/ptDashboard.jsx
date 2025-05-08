import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../ui/ptDashboard.css';

const PatientDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patientDetails, setPatientDetails] = useState({});
  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [hospitalDocuments, setHospitalDocuments] = useState([]);
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  
  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';

  // Get cookie helper function
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  };

  // Validate auth token
  const validateAuthToken = () => {
    const authToken = getCookie('authToken');
    return authToken && authToken.length > 10; // Basic validation
  };

  // Redirect to login
  const redirectToLogin = () => {
    localStorage.setItem('redirectAfterLogin', window.location.href);
    navigate('/route/login/');
  };

  // Show toast notification
  const showToast = (message, type = 'success', duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    let iconHtml = '';
    switch(type) {
      case 'success':
        iconHtml = '✓';
        break;
      case 'error':
        iconHtml = '✕';
        break;
      case 'info':
        iconHtml = 'ℹ';
        break;
      case 'warning':
        iconHtml = '⚠';
        break;
    }
    
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.innerHTML = iconHtml;
    
    // Create content container
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-content';
    
    // Add message
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      removeToast(toast);
    });
    
    // Add progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'toast-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'toast-progress-bar';
    progressBar.style.animationDuration = `${duration}ms`;
    
    progressContainer.appendChild(progressBar);
    
    // Assemble toast
    toastContent.appendChild(messageSpan);
    toastContent.appendChild(closeButton);
    toast.appendChild(icon);
    toast.appendChild(toastContent);
    toast.appendChild(progressContainer);
    
    // Add to container
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Set auto-dismiss timer
    setTimeout(() => {
      removeToast(toast);
    }, duration);
    
    return toast;
  };

  const removeToast = (toast) => {
    toast.classList.remove('show');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 400);
  };

  // Get document icon based on type
  const getDocumentIcon = (docType) => {
    const iconMap = {
      'pdf': 'fa-file-pdf',
      'image': 'fa-file-image',
      'doc': 'fa-file-word',
      'xls': 'fa-file-excel',
      'lab': 'fa-flask',
      'prescription': 'fa-prescription',
      'report': 'fa-file-medical',
      'insurance': 'fa-file-invoice-dollar',
      'consent': 'fa-signature',
      'history': 'fa-notes-medical'
    };
    return iconMap[docType.toLowerCase()] || 'fa-file-medical-alt';
  };

  // Check patient authorization
  const checkPatientAuth = async () => {
    setAuthLoading(true);
    
    // Basic client-side validation first
    const authToken = getCookie('authToken');
    console.log("Auth Token:", authToken);
    if (!authToken || authToken.length < 10) {
      setIsUserAuthorized(false);
      setAuthLoading(false);
      console.log("2");
      return;
    }
    console.log(`Authorization : Token ${authToken}`);
    try {
      const response = await fetch(`${baseUrl}/check-patient/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`
        }
      });
      console.log("Response:", response.status);
      if (response.status === 200) {
        setIsUserAuthorized(true);
        console.log("if");
        fetchPatientDocuments(); // Refresh document list
      } else {
        console.log("else");
        setIsUserAuthorized(false);

      }
    } catch (error) {
      console.log("catched");
      console.error("Error checking patient authorization:", error);
      setIsUserAuthorized(false);
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch patient details
  const fetchPatientDetails = async () => {
    const authToken = getCookie('authToken');
    
    try {
      const response = await fetch(`${baseUrl}/patient-dashboard/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': authToken ? `Token ${authToken}` : ''
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        setIsUserAuthorized(false);
        return;
      }
      
      const data = await response.json();
      if (data && data.patient) {
        setPatientDetails(data.patient);
      }
    } catch (error) {
      console.error("Error fetching patient details:", error);
    }
  };

  // Fetch patient documents
  const fetchPatientDocuments = async () => {
    const authToken = getCookie('authToken');
    
    try {
      const response = await fetch(`${baseUrl}/patient-documents/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': authToken ? `Token ${authToken}` : ''
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        setIsUserAuthorized(false);
        return;
      }
      
      const data = await response.json();
      
      if (data) {
        if (data.patient && data.patient.length > 0) {
          setPersonalDocuments(data.patient.map(doc => ({
            id: doc.id,
            title: doc.name || 'Unnamed Document',
            date: new Date(doc.added).toLocaleDateString(),
            icon: getDocumentIcon(doc.type || 'unknown'),
            isPrivate: doc.isPrivate || false,
            isHospital: false,
            type: doc.type || 'unknown'
          })));
        } else {
          setPersonalDocuments([]);
        }
        
        if (data.hospital && data.hospital.length > 0) {
          setHospitalDocuments(data.hospital.map(doc => ({
            id: doc.id,
            title: doc.name || 'Unnamed Document',
            date: new Date(doc.added).toLocaleDateString(),
            icon: getDocumentIcon(doc.type || 'unknown'),
            isPrivate: doc.isPrivate || false,
            isHospital: true,
            type: doc.type || 'unknown'
          })));
        } else {
          setHospitalDocuments([]);
        }
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setPersonalDocuments([]);
      setHospitalDocuments([]);
    }
  };

  // Toggle document visibility
  const toggleVisibility = async (documentId, isHospital) => {
    if (!isUserAuthorized || !validateAuthToken()) {
      console.error("Unauthorized attempt to toggle document visibility");
      alert("Authorization failed. Please log in again.");
      redirectToLogin();
      return;
    }
    
    const apiUrl = isHospital 
      ? `${baseUrl}/change-hospital-document/` 
      : `${baseUrl}/change-patient-document/`;
    
    const authToken = getCookie('authToken');
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          'Authorization': `Token ${authToken}`
        },
        credentials: 'same-origin',
        body: JSON.stringify({ doc: documentId })
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      showToast(`Visibility toggled successfully for ${isHospital ? 'hospital' : 'patient'} document ${documentId}`, 'success', 3000);
      
      // Refresh document lists
      fetchPatientDocuments();
    } catch (error) {
      console.error(`Error toggling visibility:`, error.message);
      alert('An error occurred while toggling document visibility.');
    }
  };

  // Confirm document deletion
  const confirmDelete = (docId, isHospital) => {
    if (!isUserAuthorized || !validateAuthToken()) {
      console.error("Unauthorized attempt to delete document");
      alert("Authorization failed. Please log in again to delete documents.");
      redirectToLogin();
      return;
    }
    
    // Check if modal already exists
    let modal = document.getElementById('delete-verification-modal');
    
    if (!modal) {
      // Create modal if it doesn't exist
      const modalDiv = document.createElement('div');
      modalDiv.innerHTML = `
        <div id="delete-verification-modal" class="modal">
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>Confirm Document Deletion</h2>
            <p>Please enter your verification code to delete this document:</p>
            <input type="password" id="verification-code" class="verification-input" placeholder="Verification Code">
            <div class="modal-buttons">
              <button id="cancel-delete" class="btn btn-secondary">Cancel</button>
              <button id="confirm-delete" class="btn btn-danger">Delete Document</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalDiv.firstElementChild);
      modal = document.getElementById('delete-verification-modal');
    }
    
    // Get buttons
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    
    // Show modal
    modal.style.display = 'block';
    
    // Close modal on X click
    closeBtn.onclick = function() {
      modal.style.display = 'none';
    };
    
    // Close modal on Cancel click
    cancelBtn.onclick = function() {
      modal.style.display = 'none';
    };
    
    // Handle Delete confirmation
    confirmBtn.onclick = function() {
      const verificationCode = document.getElementById('verification-code').value;
      deleteDocument(docId, verificationCode, isHospital);
      modal.style.display = 'none';
    };
    
    // Close modal when clicking outside
    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
  };

  // Delete document
  const deleteDocument = async (docId, verificationCode, isHospital) => {
    if (!isUserAuthorized || !validateAuthToken()) {
      console.error("Unauthorized attempt to delete document");
      alert("Authorization failed. Please log in again to delete documents.");
      redirectToLogin();
      return;
    }
    
    if (!verificationCode || verificationCode.trim() === '') {
      alert("Verification code is required.");
      return;
    }
    
    const authToken = getCookie('authToken');
    const apiEndpoint = isHospital
      ? `${baseUrl}/delete-hospital-document/`
      : `${baseUrl}/delete-patient-document/`;
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc: docId,
          verification_code: verificationCode
        })
      });
      
      if (response.status === 401 || response.status === 403) {
        if (response.status === 403 && verificationCode) {
          alert('Invalid verification code. Document not deleted.');
        } else {
          setIsUserAuthorized(false);
          alert("Your session has expired. Please log in again.");
          redirectToLogin();
        }
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          alert('Document deleted successfully');
          fetchPatientDocuments(); // Refresh document lists
        } else {
          alert('Failed to delete document');
        }
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error(`Error deleting document ${docId}:`, error);
      alert('Error deleting document');
    }
  };

  // View patient document
  const viewPatientDocument = async (docId) => {
    const authToken = getCookie('authToken');
    
    if (!authToken || authToken.length < 10) {
      alert("You need to be logged in to view this document");
      redirectToLogin();
      return;
    }
    
    try {
      const response = await fetch(`${baseUrl}/patients/${id}/documents/${docId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        throw new Error("Not authorized to view this document");
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No URL in response');
      }
    } catch (error) {
      console.error(`Error viewing patient document ${docId}:`, error);
      
      if (error.message === "Not authorized to view this document") {
        alert("You don't have permission to view this document. Please request access.");
      } else {
        alert('Error accessing document. Please try again.');
      }
    }
  };

  // View hospital document
  const viewHospitalDocument = async (docId) => {
    const authToken = getCookie('authToken');
    
    try {
      const response = await fetch(`${baseUrl}/hospital-documents-view/${docId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hospital document: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL in response');
      }
    } catch (error) {
      console.error(`Error viewing hospital document ${docId}:`, error);
      alert('Error accessing hospital document');
    }
  };

  // Request patient access
  const requestPatientAccess = async (docId) => {
    const authToken = getCookie('authToken');
    
    try {
      const response = await fetch(`${baseUrl}/create-patient-req/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc: docId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          alert('Access request submitted successfully');
        } else if (data.message) {
          alert(data.message);
        } else {
          alert('Failed to submit access request');
        }
      } else {
        throw new Error('Failed to submit access request');
      }
    } catch (error) {
      console.error(`Error requesting access for patient document ${docId}:`, error);
      alert('Error requesting access');
    }
  };

  // Request hospital access
  const requestHospitalAccess = async (docId) => {
    const authToken = getCookie('authToken');
    
    try {
      const response = await fetch(`${baseUrl}/create-hospital-req/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc: docId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          alert('Hospital document access request submitted successfully');
        } else if (data.message) {
          alert(data.message);
        } else {
          alert('Failed to submit hospital document access request');
        }
      } else {
        throw new Error('Failed to submit hospital document access request');
      }
    } catch (error) {
      console.error(`Error requesting access for hospital document ${docId}:`, error);
      alert('Error requesting hospital document access');
    }
  };

  // Add document function
  const addDocument = () => {
    if (!isUserAuthorized || !validateAuthToken()) {
      console.error("Unauthorized attempt to add document");
      alert("Authorization failed. Please log in again to add documents.");
      redirectToLogin();
      return;
    }
    navigate(`/route/patient-upload/?patient=${id}`);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Text-to-speech functionality
  const toggleReadAloud = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      const contentToRead = document.querySelector('.main-content').textContent;
      const speech = new SpeechSynthesisUtterance();
      speech.text = contentToRead;
      speech.volume = 1;
      speech.rate = 1;
      speech.pitch = 1;
      
      // Try to get current language from Google Translate
      const googleCombo = document.querySelector('.goog-te-combo');
      const currentLang = googleCombo ? googleCombo.value : 'en-US';
      speech.lang = currentLang;
      
      window.speechSynthesis.speak(speech);
      setSpeaking(true);
      
      speech.onend = function() {
        setSpeaking(false);
      };
    }
  };

  // Google Translate initialization
  useEffect(() => {
    // Check if script already exists
    if (!document.querySelector('script[src*="translate_a/element.js"]')) {
      // Define the callback function if it doesn't exist yet
      if (!window.googleTranslateElementInit) {
        window.googleTranslateElementInit = function() {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi,fr,de,ta,gu,kn',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
            },
            'google_translate_element'
          );
          
          // Apply saved language preference
          setTimeout(() => {
            const savedLang = localStorage.getItem('preferredLanguage');
            if (savedLang && document.querySelector('.goog-te-combo')) {
              document.querySelector('.goog-te-combo').value = savedLang;
              document.querySelector('.goog-te-combo').dispatchEvent(new Event('change'));
            }
          }, 1000);
        };
      }

      // Add Google Translate script
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // Save language preference when changed
    const saveLangPreference = () => {
      const handleComboChange = (comboEl) => {
        if (comboEl) {
          comboEl.addEventListener('change', function() {
            const lang = this.value;
            localStorage.setItem('preferredLanguage', lang);
          });
        }
      };

      // Initial check
      const comboEl = document.querySelector('.goog-te-combo');
      if (comboEl) {
        handleComboChange(comboEl);
      } else {
        // If not available yet, try again after a delay
        setTimeout(() => {
          handleComboChange(document.querySelector('.goog-te-combo'));
        }, 1000);
      }
    };

    saveLangPreference();
  }, []); // Empty dependency array so this runs only once

  // Document card component
  const DocumentCard = ({ doc }) => {
    const [accessStatus, setAccessStatus] = useState('loading');
    
    useEffect(() => {
      checkDocumentAccess(doc.id, doc.isHospital);
    }, [doc.id, doc.isHospital]);
    
    const checkDocumentAccess = async (docId, isHospital) => {
      const authToken = getCookie('authToken');
      const endpoint = isHospital 
        ? `${baseUrl}/hospital-document-check/${docId}` 
        : `${baseUrl}/patient-document-access/${docId}`;
        
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': authToken ? `Token ${authToken}` : ''
          }
        });
        
        if (response.status === 200) {
          setAccessStatus('granted');
        } else if (response.status === 401 || response.status === 403) {
          setAccessStatus('denied');
        } else {
          setAccessStatus('error');
        }
      } catch (error) {
        console.error(`Error checking document access for ID ${docId}:`, error);
        setAccessStatus('error');
      }
    };
    
    // Render access control buttons based on status
    const renderAccessControl = () => {
      switch (accessStatus) {
        case 'loading':
          return <div className="loading">Checking access...</div>;
        case 'granted':
          return (
            <button 
              className="doc-btn view-btn" 
              onClick={() => doc.isHospital ? viewHospitalDocument(doc.id) : viewPatientDocument(doc.id)}
            >
              View Document
            </button>
          );
        case 'denied':
          return (
            <button 
              className="doc-btn request-btn" 
              onClick={() => doc.isHospital ? requestHospitalAccess(doc.id) : requestPatientAccess(doc.id)}
            >
              Request Access
            </button>
          );
        case 'error':
          return (
            <button 
              className="doc-btn error-btn" 
              onClick={() => checkDocumentAccess(doc.id, doc.isHospital)}
            >
              Retry Access Check
            </button>
          );
        default:
          return null;
      }
    };
    
    return (
      <div className="document-card" data-id={doc.id}>
        {isUserAuthorized && (
          <div className="document-menu">
            <i className="fas fa-ellipsis-v menu-trigger"></i>
            <div className="document-menu-options">
              <div 
                className="menu-option edit-option" 
                onClick={() => toggleVisibility(doc.id, doc.isHospital)}
              >
                <i className="fas fa-edit"></i> {doc.isPrivate ? 'Make Public' : 'Make Private'}
              </div>
              <div 
                className="menu-option delete-option" 
                onClick={() => confirmDelete(doc.id, doc.isHospital)}
              >
                <i className="fas fa-trash"></i> Delete
              </div>
            </div>
          </div>
        )}
        <div className="document-icon">
          <i className={`fas ${doc.icon}`}></i>
        </div>
        <div className="document-title">{doc.title}</div>
        <div className="document-date">{doc.date}</div>
        <div className="document-visibility">
          {doc.isPrivate ? 
            <><i className="fas fa-lock"></i> Private</> : 
            <><i className="fas fa-unlock"></i> Public</>
          }
        </div>
        <div 
          id={`${doc.isHospital ? 'hospital' : 'patient'}-access-control-${doc.id}`} 
          className="document-access-control"
        >
          {renderAccessControl()}
        </div>
      </div>
    );
  };

  // Filter documents by search term
  const filterDocuments = (documents) => {
    if (!searchTerm) return documents;
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.date.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Initialize component
  useEffect(() => {
    if (!id) {
      console.error("No patient ID provided");
      alert("Error: No patient ID provided");
      return;
    }
    
    checkPatientAuth();
    fetchPatientDetails();
    fetchPatientDocuments();
    
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Apply dark mode styling
    document.body.classList.add('dark-mode');
    
    // Add CSS for dark mode with gradients
    const style = document.createElement('style');
    style.textContent = `
      body.dark-mode {
        background: #121212;
        color: #e0e0e0;
      }
      
      .app-container {
        background: linear-gradient(135deg, #0a192f 0%, #041a29 50%, #022c43 100%);
      }
      
      .sidebar {
        background: linear-gradient(180deg, #0a1a2f 0%, #041e36 100%);
        border-right: 1px solid #1e3a5f;
        color: #e0e0e0;
      }
      
      .content-card {
        background: rgba(13, 27, 42, 0.7);
        border: 1px solid #1e3a5f;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      
      /* Updated document card styles for new alignment */
      .documents-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        padding: 1rem;
      }
      
      .document-card {
        background: linear-gradient(145deg, #0d253f 0%, #0f3a5f 100%);
        border: 1px solid #1e4a7f;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        color: #e0e0e0;
        transition: all 0.3s ease;
        padding: 1.25rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .document-card:hover {
        box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        border-color: #14b8a6;
        transform: translateY(-3px);
      }
      
      .document-icon {
        font-size: 2rem;
        color: #14b8a6;
        margin-bottom: 0.75rem;
        text-align: center;
      }
      
      .document-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        text-align: center;
        word-break: break-word;
      }
      
      .document-date {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 0.75rem;
        text-align: center;
      }
      
      .document-visibility {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 1rem;
      }
      
      .document-access-control {
        margin-top: auto;
        text-align: center;
      }
      
      .doc-btn {
        width: 100%;
        padding: 0.6rem;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.3s ease;
        cursor: pointer;
        border: none;
        color: white;
        font-size: 0.9rem;
      }
      
      .doc-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }

      .doc-btn.view-btn {
        background: linear-gradient(135deg, #0e7490 0%, #06b6d4 100%);
        border: none;
      }
      
      .doc-btn.request-btn {
        background: linear-gradient(135deg, #0e7490 0%, #0284c7 100%);
        border: none;
      }
      
      .doc-btn.error-btn {
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        border: none;
      }
      
      .loading {
        text-align: center;
        color: #94a3b8;
        font-style: italic;
        padding: 0.5rem;
      }
      
      /* Updated document menu styles */
      .document-menu {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        z-index: 10;
      }
      
      .menu-trigger {
        cursor: pointer;
        padding: 0.5rem;
        color: #94a3b8;
        transition: color 0.3s ease;
      }
      
      .menu-trigger:hover {
        color: #14b8a6;
      }
      
      .document-menu-options {
        display: none;
        position: absolute;
        top: 100%;
        right: 0;
        background: #0d1b2a;
        border: 1px solid #1e3a5f;
        border-radius: 6px;
        width: 150px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 20;
      }
      
      .document-menu:hover .document-menu-options {
        display: block;
      }
      
      .menu-option {
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .menu-option:hover {
        background: #1e3a5f;
      }
      
      .menu-option.edit-option {
        color: #14b8a6;
      }
      
      .menu-option.delete-option {
        color: #ef4444;
        border-top: 1px solid #1e3a5f;
      }
      
      /* Section headers */
      .document-section-header {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 1.5rem 0 1rem;
        color: #e0e0e0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #1e3a5f;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      /* Document counter badge */
      .document-counter {
        background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
      }
      
      /* Header styling */
      .header {
        background: rgba(13, 27, 42, 0.9);
        border-bottom: 1px solid #1e3a5f;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      
      .header-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #e0e0e0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      
      .header-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      
      /* Search input styling */
      .search-container {
        position: relative;
        width: 300px;
      }
      
      .search-input {
        background: rgba(13, 27, 42, 0.8);
        border: 1px solid #1e3a5f;
        border-radius: 8px;
        color: #e0e0e0;
        padding: 0.5rem 1rem 0.5rem 2.5rem;
        width: 100%;
        transition: all 0.3s ease;
      }
      
      .search-input:focus {
        border-color: #14b8a6;
        box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
        outline: none;
      }
      
      .search-icon {
        position: absolute;
        top: 50%;
        left: 0.75rem;
        transform: translateY(-50%);
        color: #94a3b8;
      }
      
      /* Modal styling */
      .modal {
        background-color: rgba(0, 0, 0, 0.7);
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .modal-content {
        background: #0d1b2a;
        border: 1px solid #1e3a5f;
        border-radius: 10px;
        padding: 2rem;
        width: 90%;
        max-width: 500px;
        position: relative;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      }
      
      .close-modal {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        cursor: pointer;
        color: #94a3b8;
        transition: color 0.3s ease;
      }
      
      .close-modal:hover {
        color: #ef4444;
      }
      
      .modal h2 {
        color: #e0e0e0;
        margin-bottom: 1rem;
      }
      
      .verification-input {
        background: #0d2b45;
        border: 1px solid #1e4a7f;
        border-radius: 6px;
        color: #e0e0e0;
        padding: 0.75rem;
        width: 100%;
        margin: 1rem 0;
      }
      
      .modal-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
      }
      
      .btn {
        padding: 0.6rem 1.25rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
      }
      
      .btn-secondary {
        background: #1e293b;
        color: #e0e0e0;
      }
      
      .btn-secondary:hover {
        background: #334155;
      }
      
      .btn-danger {
        background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
        color: white;
      }
      
      .btn-danger:hover {
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      }
      
      /* Toast notification styling */
      .toast-container {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        z-index: 1000;
      }
      
      .toast {
        display: flex;
        background: #0d1b2a;
        border-left: 4px solid;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        max-width: 350px;
        opacity: 0;
        transform: translateX(50px);
        transition: all 0.4s ease;
      }
      
      .toast.show {
        opacity: 1;
        transform: translateX(0);
      }
      
      .toast.success {
        border-left-color: #14b8a6;
      }
      
      .toast.error {
        border-left-color: #ef4444;
      }
      
      .toast.info {
        border-left-color: #0ea5e9;
      }
      
      .toast.warning {
        border-left-color: #f59e0b;
      }
      
      .toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        background: rgba(255, 255, 255, 0.05);
        font-size: 1.25rem;
        font-weight: bold;
      }
      
      .toast.success .toast-icon {
        color: #14b8a6;
      }
      
      .toast.error .toast-icon {
        color: #ef4444;
      }
      
      .toast.info .toast-icon {
        color: #0ea5e9;
      }
      
      .toast.warning .toast-icon {
        color: #f59e0b;
      }
      
      .toast-content {
        flex: 1;
        padding: 1rem;
        position: relative;
      }
      
      .toast-message {
        color: #e0e0e0;
        padding-right: 1.5rem;
      }
      
      .toast-close {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.25rem;
        cursor: pointer;
        transition: color 0.3s ease;
      }
      
      .toast-close:hover {
        color: #e0e0e0;
      }
      
      .toast-progress {
        height: 4px;
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .toast-progress-bar {
        height: 100%;
        width: 100%;
        transform-origin: left;
        animation: progress-animation linear forwards;
      }
      
      .toast.success .toast-progress-bar {
        background: #14b8a6;
      }
      
      .toast.error .toast-progress-bar {
        background: #ef4444;
      }
      
      .toast.info .toast-progress-bar {
        background: #0ea5e9;
      }
      
      .toast.warning .toast-progress-bar {
        background: #f59e0b;
      }
      
      @keyframes progress-animation {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }
      
      /* Add document button */
      .add-doc-btn {
        background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
        border: none;
        color: white;
        padding: 0.6rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .add-doc-btn:hover {
        background: linear-gradient(135deg, #14b8a6 0%, #0f766e 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      }
      
      /* Action buttons */
      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.05);
        color: #94a3b8;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .action-button:hover {
        background: rgba(20, 184, 166, 0.2);
        color: #14b8a6;
      }
      
      .action-button.active {
        background: rgba(20, 184, 166, 0.2);
        color: #14b8a6;
      }
      
      /* Responsive layout */
      @media (max-width: 768px) {
        .documents-container {
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }
        
        .search-container {
          width: 200px;
        }
        
        .header {
          padding: 0.75rem 1rem;
        }
        
        .header-title {
          font-size: 1.25rem;
        }
        
        .document-section-header {
          font-size: 1.25rem;
        }
      }
      
      @media (max-width: 576px) {
        .documents-container {
          grid-template-columns: 1fr;
        }
        
        .search-container {
          width: 100%;
        }
        
        .header {
          flex-direction: column;
          gap: 0.75rem;
          align-items: stretch;
        }
        
        .header-controls {
          flex-wrap: wrap;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // Clean up on unmount
    return () => {
      // Remove toast container
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) {
        toastContainer.remove();
      }
      
      // Remove modal if it exists
      const modal = document.getElementById('delete-verification-modal');
      if (modal) {
        modal.remove();
      }
      
      // Remove dark mode class
      document.body.classList.remove('dark-mode');
      
      // Remove added style tag
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [id]);

  // Render main dashboard
  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Patient Portal</h2>
          <button className="close-sidebar" onClick={toggleSidebar}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div id="google_translate_element"></div>
        <div className="menu">
          <div className="menu-item active">
            <i className="fas fa-file-medical"></i>
            <span>Documents</span>
          </div>
          <div className="menu-item">
            <i className="fas fa-calendar-alt"></i>
            <span>Appointments</span>
          </div>
          <div className="menu-item">
            <i className="fas fa-notes-medical"></i>
            <span>Medical Records</span>
          </div>
          <div className="menu-item">
            <i className="fas fa-prescription"></i>
            <span>Prescriptions</span>
          </div>
          <div className="menu-item">
            <i className="fas fa-chart-line"></i>
            <span>Health Trends</span>
          </div>
          <div className="menu-item">
            <i className="fas fa-user-md"></i>
            <span>Healthcare Team</span>
          </div>
          <div className="menu-item">
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <div className="header-title">
            <button className="toggle-sidebar" onClick={toggleSidebar}>
              <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`}></i>
            </button>
            <span>
              {patientDetails.name ? `${patientDetails.name}'s Documents` : 'Patient Documents'}
            </span>
          </div>
          <div className="header-controls">
            <div className="search-container">
              <i className="fas fa-search search-icon"></i>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search documents..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button 
              className="action-button"
              onClick={toggleReadAloud}
              title={speaking ? "Stop reading aloud" : "Read page aloud"}
            >
              <i className={`fas ${speaking ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
            </button>
            <button 
              className="add-doc-btn" 
              onClick={addDocument}
              disabled={!isUserAuthorized}
            >
              <i className="fas fa-plus"></i> Add Document
            </button>
          </div>
        </div>
        
        {/* Content cards */}
        <div className="content-card">
          {authLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Verifying access...</p>
            </div>
          ) : isUserAuthorized ? (
            <>
              {/* Personal documents section */}
              <div className="document-section">
                <div className="document-section-header">
                  <span>Personal Documents</span>
                  <span className="document-counter">{personalDocuments.length}</span>
                </div>
                <div className="documents-container">
                  {filterDocuments(personalDocuments).length > 0 ? (
                    filterDocuments(personalDocuments).map(doc => (
                      <DocumentCard key={`personal-${doc.id}`} doc={doc} />
                    ))
                  ) : (
                    <div className="no-documents-message">
                      <i className="fas fa-folder-open"></i>
                      <p>No personal documents found</p>
                      {searchTerm && <p>Try adjusting your search criteria</p>}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hospital documents section */}
              <div className="document-section">
                <div className="document-section-header">
                  <span>Hospital Documents</span>
                  <span className="document-counter">{hospitalDocuments.length}</span>
                </div>
                <div className="documents-container">
                  {filterDocuments(hospitalDocuments).length > 0 ? (
                    filterDocuments(hospitalDocuments).map(doc => (
                      <DocumentCard key={`hospital-${doc.id}`} doc={doc} />
                    ))
                  ) : (
                    <div className="no-documents-message">
                      <i className="fas fa-hospital"></i>
                      <p>No hospital documents found</p>
                      {searchTerm && <p>Try adjusting your search criteria</p>}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="unauthorized-message">
              <i className="fas fa-exclamation-triangle"></i>
              <h2>Access Denied</h2>
              <p>You do not have permission to view this patient's documents.</p>
              <button className="login-redirect-btn" onClick={redirectToLogin}>
                Log In Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
