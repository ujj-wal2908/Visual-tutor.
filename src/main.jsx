// src/main.jsx (Updated)
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'; // Global styles
import App from './App.jsx'; // Your main application component
import LandingPage from './LandingPage.jsx'; // The new landing page component (we'll create this)

createRoot(document.getElementById('root')).render(
  <React.StrictMode> {/* Optional, but good practice */}
    <BrowserRouter>
      <Routes>
        {/* Route for the landing page (default) */}
        <Route path="/" element={<LandingPage />} />
        {/* Route for the main application */}
        <Route path="/app" element={<App />} />
        {/* Optional: Add a catch-all or Not Found route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);