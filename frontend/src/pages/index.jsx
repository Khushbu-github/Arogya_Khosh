import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../ui/index.css';

const Arogyakosh = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="heartbeat-loader">
          <i className="fas fa-heartbeat"></i>
        </div>
        <h2 className="loading-text">Loading Arogyakosh...</h2>
      </div>
    );
  }

  return (
    <div className="arogyakosh-app">
      {/* Animated background with particles */}
      <div className="particle-background">
        <div className="particles" id="particles-js"></div>
        <div className="health-wave"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">Arogyakosh</span>
            <span className="hero-subtitle gradient-text">Your Health, Our Priority</span>
          </h1>
          <p className="hero-description">Experience seamless healthcare management with our cutting-edge platform</p>
          <button onClick={handleLogin} className="login-button">
            <span>Get Started</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        <div className="hero-graphic">
          <div className="health-pulse">
            <svg viewBox="0 0 600 200">
              <path className="ecg-line" d="M0,100 L30,100 L45,50 L60,150 L75,100 L90,100 L105,100 L120,100 L150,20 L180,180 L210,100 L240,100 L300,100 L330,140 L360,60 L390,100 L420,100 L480,100 L510,70 L540,130 L570,100 L600,100" fill="none" stroke="url(#gradient)" strokeWidth="3"></path>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00ffcc" />
                  <stop offset="100%" stopColor="#0066ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title gradient-text">Our Services</h2>
        <div className="features-container">
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <h3>Doctor Consultation</h3>
            <p>Connect with specialists instantly</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-hospital"></i>
            </div>
            <h3>Hospital Network</h3>
            <p>Access to top healthcare facilities</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-file-medical"></i>
            </div>
            <h3>Medical Records</h3>
            <p>Secure digital health documents</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <h3>Mobile Health</h3>
            <p>Healthcare on the go</p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <h2 className="section-title gradient-text">Our Technology</h2>
        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3>Healthcare AI</h3>
            <p>Advanced AI solutions for medical diagnostics</p>
          </div>
          <div className="tech-card">
            <div className="tech-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <h3>Machine Learning</h3>
            <p>Predictive models for personalized care</p>
          </div>
          <div className="tech-card">
            <div className="tech-icon">
              <i className="fas fa-cloud"></i>
            </div>
            <h3>Cloud Computing</h3>
            <p>Secure and scalable infrastructure</p>
          </div>
          <div className="tech-card">
            <div className="tech-icon">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>Cybersecurity</h3>
            <p>Robust data protection</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-content">
          <h2 className="section-title gradient-text">About Arogyakosh</h2>
          <p className="about-description">
            Arogyakosh is your comprehensive healthcare companion, providing seamless access to medical services, 
            secure document management, and expert consultations. Our mission is to make healthcare accessible, 
            efficient, and personalized for everyone.
          </p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Patients</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Doctors</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100+</div>
              <div className="stat-label">Hospitals</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <nav className="footer-nav">
            <a href="#about">About Us</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </nav>
          
          <div className="footer-mission">
            <p>
              Arogyakosh provides comprehensive medical care with compassion and expertise.
              Our mission is to deliver high-quality healthcare tailored to individual patient needs.
            </p>
          </div>
          
          <div className="social-links">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
          </div>
          
          <div className="contact-details">
            <div className="contact-item">
              <i className="fas fa-phone-alt"></i> +919620146061
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i> arogyakoshh@gmail.com
            </div>
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i> Mumbai
            </div>
          </div>
          
          <div className="copyright">
            ©️ 2025 AROGYAKOSH. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Arogyakosh;