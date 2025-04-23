// src/VisualizationViewer.jsx (Complete Code with Dynamic Text and Loading Dots)
import React, { useState, useEffect, useRef } from 'react';

// --- Array of Playful Loading Messages ---
const playfulLoadingMessages = [
  "Conjuring up some visualization magic... ✨",
  "Hold on, asking the digital sprites for insights!🚀🚀🚀",
  "This topic looks interesting! Let me draw it out...😶‍🌫️😶‍🌫️😶‍🌫️😶‍🌫️",
  "Warming up the pixels... Almost there!👨‍🎓👨‍🎓🚀",
  "Wow, you picked a cool one! Generating...🕵️🕵️",
  "Brewing a fresh visualization just for you! ☕",
  "Hang tight! Mapping the knowledge constellation...🤖🤖🤖",
  "Reticulating splines... (Just kidding! Mostly.) 😉",
  "Engaging hyperdrive for data visualization!🛼🛼",
  "Polishing the visual elements...🗿🗿🗿🤗🤗",
  "Translating concepts into interactive graphics...🐦‍🔥🐦‍🔥",
  "Just a moment while we make this awesome!⌚⌚⌚⏳⏳",
];
// ----------------------------------------

// --- CSS to Inject ---
const injectCss = `
  html, body {
    height: 100% !important; /* Force height */
    margin: 0 !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    display: flex !important; /* Use flexbox for body */
    flex-direction: column !important; /* Stack elements vertically */
  }
  /* Attempt to make the direct child wrapper fill space */
  body > *:first-child {
     flex-grow: 1 !important; /* Allow the main container to grow */
     min-height: 0; /* Allow shrinking if needed within flex */
     display: flex; /* Often needed for inner content */
     flex-direction: column; /* Often needed for inner content */
  }
`;
// --------------------

function VisualizationViewer({ htmlContent, isLoading, error, isDisabled }) {
  const iframeRef = useRef(null);
  const iframeSrcDoc = htmlContent || '';
  const [loadingMessage, setLoadingMessage] = useState(playfulLoadingMessages[0]);

  // Effect for CSS Injection
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlContent || isLoading || error || isDisabled) { return; }
    const handleLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const styleElement = iframeDoc.createElement('style');
          styleElement.setAttribute('type', 'text/css');
          styleElement.textContent = injectCss;
          iframeDoc.head.appendChild(styleElement);
        }
      } catch (e) { console.error("Error injecting CSS into visualization iframe:", e); }
    };
    iframe.addEventListener('load', handleLoad);
    if (iframe.contentDocument?.readyState === 'complete') { handleLoad(); }
    return () => { if (iframe) { iframe.removeEventListener('load', handleLoad); } };
  }, [htmlContent, isLoading, error, isDisabled]);


  // Effect for Dynamic Loading Text
  useEffect(() => {
    let intervalId = null;
    if (isLoading) {
      setLoadingMessage(playfulLoadingMessages[0]);
      intervalId = setInterval(() => {
        setLoadingMessage(currentMessage => {
          const currentIndex = playfulLoadingMessages.indexOf(currentMessage);
          const nextIndex = (currentIndex + 1) % playfulLoadingMessages.length;
          return playfulLoadingMessages[nextIndex];
        });
      }, 5000);
    } else {
      if (intervalId) clearInterval(intervalId);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);


  return (
    <div style={{
        height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden',
        position: 'relative', border: '1px solid rgba(0,0,0,0.1)', background: '#fff'
    }}>

      {/* --- Loading State Overlay (Text + Dots) --- */}
      {isLoading && (
        <div style={{
             position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
             background: 'rgba(53, 169, 225, 0.87)', color: 'white',
             display: 'flex', flexDirection: 'column',
             alignItems: 'center', justifyContent: 'center',
             zIndex: 10, borderRadius: 'inherit', padding: '2rem',
             textAlign: 'center'
           }}>
             {/* Display the DYNAMIC loading message */}
             <p style={{ fontSize: '1.3em', fontWeight: '500', lineHeight: '1.5', marginBottom: '1.5rem' }}>
               {loadingMessage}
             </p>

             {/* --- Loading Dots Animation --- */}
             <div className="loading-dots-buffer">
               <span className="dot"></span>
               <span className="dot"></span>
               <span className="dot"></span>
             </div>
             {/* --- END Loading Dots Animation --- */}
        </div>
      )}
      {/* --- END Loading State --- */}


      {/* Error/Disabled State Overlay */}
      {(error || isDisabled) && !isLoading && (
         <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              color: isDisabled ? '#aaa' : 'red',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9, padding: '1rem', textAlign: 'center',
              borderRadius: 'inherit',
              fontWeight: isDisabled ? 'normal' : 'bold'
            }}>
            {isDisabled ? 'Visualization requires Gemini API Key' : `Error loading visualization: ${error}`}
         </div>
      )}

      {/* Iframe Container */}
      {!isLoading && !error && !isDisabled && (
        <iframe
          ref={iframeRef}
          srcDoc={iframeSrcDoc}
          title="Visualization Content"
          style={{
              width: '100%', height: '100%', border: 'none',
              display: htmlContent ? 'block' : 'none'
            }}
          sandbox="allow-scripts allow-same-origin"
        />
      )}

      {/* Placeholder Text */}
      {!isLoading && !error && !isDisabled && !htmlContent && (
          <div style={{
               position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
               color: '#555',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               textAlign: 'center', padding: '1rem'
             }}>
              Click a node on the Mind Map <br/> to generate a visualization.
          </div>
      )}
    </div>
  );
}

export default VisualizationViewer;