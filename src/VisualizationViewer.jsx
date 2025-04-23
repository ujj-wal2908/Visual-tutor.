import React, { useEffect, useRef } from 'react';

// --- CSS to Inject ---
// This CSS aims to make the html, body, and potentially the first main div
// inside the iframe take up the full available height.
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
  /* You might need more specific selectors if the AI generates different structures */
`;
// --------------------

function VisualizationViewer({ htmlContent, isLoading, error, isDisabled }) { // Added isDisabled back
  const iframeRef = useRef(null);
  const iframeSrcDoc = htmlContent || ''; // Use empty string if no content

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlContent || isLoading || error || isDisabled) {
      // Don't run if iframe isn't ready, or no content/loading/error/disabled
      return;
    }

    const handleLoad = () => {
      try {
        // Access the iframe's document
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeDoc) {
          // Create a style element
          const styleElement = iframeDoc.createElement('style');
          styleElement.setAttribute('type', 'text/css');
          styleElement.textContent = injectCss; // Use the CSS string defined above

          // Append the style element to the head of the iframe's document
          iframeDoc.head.appendChild(styleElement);
          console.log("Injected height styles into visualization iframe.");
        } else {
          console.warn("Could not access visualization iframe document.");
        }
      } catch (e) {
        console.error("Error injecting CSS into visualization iframe:", e);
      }
    };

    // Add event listener for when the iframe content has loaded
    iframe.addEventListener('load', handleLoad);

    // --- IMPORTANT: Trigger load if already loaded ---
    // Sometimes, especially with srcDoc, the 'load' event might fire *before*
    // the useEffect runs or the listener is attached. Check the readyState.
    if (iframe.contentDocument?.readyState === 'complete') {
        console.log("Iframe already complete, triggering manual style injection.");
        handleLoad();
    }
    // --------------------------------------------

    // Cleanup function to remove the event listener
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
    // Rerun this effect if the htmlContent changes, or loading/error states resolve
  }, [htmlContent, isLoading, error, isDisabled]);

  return (
    <div style={{
        // Container styles remain the same (height controlled by App.css)
        height: '100%', // Let container fill card-content-area height
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(0,0,0,0.1)',
        background: '#fff' // White background for the iframe container
    }}>
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 'inherit' }}>
          Loading Visualization...
        </div>
      )}
      {/* Added back isDisabled check */}
      {(error || isDisabled) && !isLoading && (
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: isDisabled ? '#aaa' : 'red', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9, padding: '1rem', textAlign: 'center', borderRadius: 'inherit', fontWeight: isDisabled ? 'normal' : 'bold' }}>
            {isDisabled ? 'Visualization requires Gemini API Key' : `Error loading visualization: ${error}`}
         </div>
      )}
      {/* Show iframe container only when ready */}
      {!isLoading && !error && !isDisabled && (
        <iframe
          ref={iframeRef} // Add ref here
          srcDoc={iframeSrcDoc}
          title="Visualization Content"
          style={{ width: '100%', height: '100%', border: 'none', display: htmlContent ? 'block' : 'none' }} // Hide iframe if no content yet
          sandbox="allow-scripts allow-same-origin"
        />
      )}
      {/* Placeholder text if nothing else is showing */}
      {!isLoading && !error && !isDisabled && !htmlContent && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1rem' }}>
              Click a node on the Mind Map <br/> to generate a visualization.
          </div>
      )}
    </div>
  );
}

export default VisualizationViewer;