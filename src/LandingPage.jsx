// src/LandingPage.jsx (Complete Code)
import React, { useEffect } from 'react'; // Import useEffect
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.css';

// Animation variants (optional but good for organization)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3, delayChildren: 0.2 }
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

function LandingPage() {

  // --- ADDED useEffect ---
  // Set a flag in sessionStorage when the landing page loads
  useEffect(() => {
    sessionStorage.setItem('visitedLanding', 'true');
    console.log("Landed on Landing Page, setting session flag.");
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- END ADDED useEffect ---

  return (
    <motion.div
      className="landing-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- Hero Section --- */}
      <motion.section className="hero-section" variants={itemVariants}>
        <h1>Welcome to the Learning Adventure Crafter!</h1>
        <p>Generate interactive mind maps, visualizations, and chat with an AI tutor about any topic.</p>
      </motion.section>

      {/* --- How it Works Section --- */}
      <motion.section className="workflow-section" variants={itemVariants}>
        <h2>How It Works</h2>
        <motion.div className="steps-container" variants={containerVariants}>
          {/* Step 1 */}
          <motion.div className="step" variants={itemVariants}>
            <span className="step-icon">📝</span>
            <h3>1. Enter Topic & Level</h3>
            <p>Type the subject you want to explore and select your current understanding level.</p>
          </motion.div>
          {/* Step 2 */}
          <motion.div className="step" variants={itemVariants}>
            <span className="step-icon">✨</span>
            <h3>2. Generate Magic Map</h3>
            <p>Click the button to create a visual mind map of the topic's key concepts.</p>
          </motion.div>
          {/* Step 3 */}
          <motion.div className="step" variants={itemVariants}>
            <span className="step-icon">🖱️</span>
            <h3>3. Explore & Visualize</h3>
            <p>Click on any node in the mind map to generate an interactive visualization for that specific concept.</p>
          </motion.div>
          {/* Step 4 */}
          <motion.div className="step" variants={itemVariants}>
             <span className="step-icon">💬</span>
            <h3>4. Chat with Tanya</h3>
            <p>Ask questions, get explanations, or even upload related images to discuss with your AI Tutor.</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* --- Footer / Call to Action --- */}
      <motion.footer className="landing-footer" variants={itemVariants}>
        <h2>Ready to Start?</h2>
        <Link to="/app" className="cta-button">
          Begin Your Adventure!
        </Link>
      </motion.footer>
    </motion.div>
  );
}

export default LandingPage;