// src/App.jsx (Complete Code)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './App.css';
import MindMapViewer from './MindMapViewer';
import VisualizationViewer from './VisualizationViewer';
import Chatbot from './Chatbot';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- API Configurations ---
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// --- API Key Status ---
const isGroqKeyMissing = !GROQ_API_KEY;
const isGeminiKeyMissing = !GEMINI_API_KEY;

// --- SDK Initializations ---
let groq = null;
let genAI = null;
let geminiModel = null;

if (!isGroqKeyMissing) {
    try {
        groq = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });
    } catch (error) {
        console.error("Error initializing Groq SDK:", error);
    }
} else {
    console.warn("Groq API Key (VITE_GROQ_API_KEY) not found.");
}

if (!isGeminiKeyMissing) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" }); // Or your specific model
    } catch (error) {
        console.error("Error initializing Gemini SDK:", error);
    }
} else {
    console.warn("Gemini API Key not provided or invalid.");
}

const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Use the specific model name


// --- System Prompts ---
const MINDMAP_SYSTEM_PROMPT = `
You are an assistant that generates hierarchical mind map structures for a given topic.
The output MUST be a valid JSON object following this exact structure:
{
  "nodes": [
    { "id": "unique_node_id_1", "data": { "label": "Node Label 1" }, "position": { "x": 0, "y": 0 } },
    { "id": "unique_node_id_2", "data": { "label": "Node Label 2" }, "position": { "x": 100, "y": 100 } }
  ],
  "edges": [
    { "id": "edge_id_1", "source": "source_node_id", "target": "target_node_id" }
  ]
}
Ensure node IDs are unique strings. Provide appropriate x/y positions. Make the central topic node ID 'root'. Do not include any explanations or markdown formatting. Output ONLY the JSON object.
`;

// --- REFINED VISUALIZATION PROMPT (with height instructions) ---
const VISUALIZATION_SYSTEM_PROMPT = `
You are an expert web developer assistant creating **highly interactive and engaging** educational tools.
Generate a single, self-contained HTML snippet (no \`<html>\`, \`<head>\`, or \`<body>\` tags around the *entire* snippet, but you can use them *within* if needed for styling) that provides an interactive visualization for the given concept/topic.
Requirements:
1.  **Meaningful Interactivity:** User actions (clicks, inputs) should directly relate to exploring or understanding the concept. Avoid static displays.
2.  **Self-Contained:** All HTML, CSS (\`<style>\`), and JS (\`<script>\`) within the snippet. No external libraries/resources.
3.  **Informative & Clear:** Accurately represent the concept. Keep text concise.
4.  **Safe for iframe:** Must run in \`<iframe srcDoc>\` sandbox. Avoid \`window.top\`/etc. Use unique IDs.
5.  **Output ONLY Raw HTML:** No explanations, markdown, or other text outside the HTML snippet.
6.  **Full Height Visualization:** *** CRITICAL: Style the content within your HTML snippet so it fills the entire available vertical height. Apply \`height: 100%\` to the \`html\` and \`body\` elements *within* the snippet's \`<style>\` tag. Ensure the main visual container element(s) also expand to use this full height (e.g., using \`min-height: 100%\`, flexbox \`flex-grow: 1\`, or similar techniques). The goal is NO significant empty space below the visualization content when placed in a tall container and it should be scrollable inside the container so the user can interact with the all.***
7. **More visualization elements:** there should be more than one and diffrent type of visual elements in the snippet.
8. **Reset button:** There should be a reset button to reset the visual elements so user can interact with then again and again.
`;
// --- END REFINED PROMPT ---


const generateChatbotSystemPrompt = (topic, level, isPlayful) => {
    const basePrompt = `You are an expert AI tutor specializing in "${topic}". The user's current expertise level is "${level}". Your goal is to help the user understand this topic better through conversation. Answer questions clearly, provide explanations, and ask clarifying questions if needed. Adapt your language and depth based on the user's level. You can understand and discuss images uploaded by the user. Use Markdown for formatting when appropriate.`; // Added format hint
    const playfulPrefix = `Adopt a fun, encouraging, and slightly playful tone! Use occasional emojis where appropriate (but don't overdo it). Let's make learning an adventure! `;
    return isPlayful ? playfulPrefix + basePrompt : basePrompt;
};
// ---------------------------------

function App() {
    // --- State variables ---
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState('Novice Explorer');
    const [isPlayful, setIsPlayful] = useState(false);
    const [mindMapData, setMindMapData] = useState({ nodes: [], edges: [] });
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [visualizationHtml, setVisualizationHtml] = useState('');
    const [isVisLoading, setIsVisLoading] = useState(false);
    const [visError, setVisError] = useState(null);
    const [selectedNodeLabel, setSelectedNodeLabel] = useState('');
    const [isChatActive, setIsChatActive] = useState(false);
    const [chatbotSystemPrompt, setChatbotSystemPrompt] = useState('');
    // ---------------------

    // --- Navigation Hook ---
    const navigate = useNavigate();
    // ----------------------

    // --- Redirect Logic ---
    useEffect(() => {
        const hasVisitedLanding = sessionStorage.getItem('visitedLanding');
        // Only redirect if the flag is NOT set
        if (!hasVisitedLanding) {
            console.log("App mounted without visiting landing page first in this session. Redirecting to /");
            navigate('/', { replace: true }); // Use replace to avoid adding /app to history
        }
        // If the flag IS set, do nothing and let the App component render
    }, [navigate]); // Dependency on navigate is correct
    // --- END: Redirect Logic ---


    // --- Theme Effect ---
    useEffect(() => {
        if (isGroqKeyMissing && !mapError) {
           setMapError("Groq API Key missing. Mind map generation disabled.");
        }
        const themeClass = isPlayful ? 'theme-playful' : 'theme-focused';
        document.body.className = themeClass;
        return () => { document.body.className = ''; };
    }, [isPlayful, isGroqKeyMissing, mapError]);
    // --------------------


    // --- Card Definitions ---
     const gridCardDefinitions = [
        { id: 'mind-map', icon: '🧠', iconPlayful: '🤪', title: 'Mind Map', titlePlayful: 'Cosmic Map', description: 'Explore connections within [topic]. Click a node!', descriptionPlayful: 'Chart the constellations of [topic]! Click a node!', apiKeyMissing: isGroqKeyMissing, },
        { id: 'chatbot', icon: '💬', iconPlayful: '🤖', title: 'AI Tutor (Tanya)', titlePlayful: 'Adventure Guide (Tanya)', description: '', descriptionPlayful: '', apiKeyMissing: isGroqKeyMissing, },
        { id: 'visualization', icon: '💡', iconPlayful: '🧪', title: 'Visualization', titlePlayful: 'Idea Lab', apiKeyMissing: isGeminiKeyMissing, },
    ];
    // ----------------------


    // --- Callbacks ---
    const handleGenerateMindMap = useCallback(async (e) => {
        if (e) e.preventDefault();

        if (isGroqKeyMissing) { setMapError("Groq API Key missing."); return; }
        if (!groq) { setMapError("Configuration Error: Groq SDK failed to initialize."); return; }
        if (!topic.trim()) { setMapError('Please enter a topic.'); return; }

        console.log('Generating Mind Map for:', topic, 'Level:', level, 'Playful:', isPlayful);
        setIsMapLoading(true);
        setMapError(null);
        setMindMapData({ nodes: [], edges: [] });
        setVisualizationHtml('');
        setVisError(null);
        setSelectedNodeLabel('');
        setIsChatActive(true); // Activate chat
        setChatbotSystemPrompt(generateChatbotSystemPrompt(topic, level, isPlayful)); // Set prompt

        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "system", content: MINDMAP_SYSTEM_PROMPT }, { role: "user", content: `Generate a mind map for the topic: ${topic}` }],
                model: GROQ_MODEL, // Ensure this is correct for mind maps
                temperature: 0.3, stream: false, response_format: { type: "json_object" }
            });
            const messageContent = chatCompletion.choices[0]?.message?.content;
            if (!messageContent) throw new Error("No content received from Groq API for mind map.");
            const cleanedJsonString = messageContent.replace(/^\`\`\`(?:json)?\s*|\s*\`\`\`$/g, '').trim();
            let jsonData;
            try { jsonData = JSON.parse(cleanedJsonString); } catch (parseError) { throw new SyntaxError(`Failed to parse mind map: ${parseError.message}`); }
            if (!jsonData || typeof jsonData !== 'object' || !Array.isArray(jsonData.nodes) || !Array.isArray(jsonData.edges)) { throw new Error("Invalid JSON structure received for mind map."); }
            setMindMapData(jsonData);
            console.log(`Mind Map generated: ${jsonData.nodes.length} nodes, ${jsonData.edges.length} edges.`);
        } catch (err) {
            console.error('Error during Mind Map generation (Groq):', err);
            setMapError(err.message || 'Failed to generate mind map.');
            setMindMapData({ nodes: [], edges: [] });
        } finally {
            setIsMapLoading(false);
        }
    }, [topic, level, isPlayful, isGroqKeyMissing, groq]);

    const handleNodeClickGenerateVisualization = useCallback(async (nodeLabel) => {
        if (isGeminiKeyMissing) { setVisError("Gemini API Key missing."); return; }
        if (!geminiModel) { setVisError("Configuration Error: Gemini SDK failed to initialize."); return; }
        if (!topic || !nodeLabel) { setVisError("Please generate a map and click a node first."); return; }

        const fullConcept = `${topic}: ${nodeLabel}`;
        console.log('Generating Visualization for:', fullConcept);
        setIsVisLoading(true);
        setVisError(null);
        setVisualizationHtml('');
        setSelectedNodeLabel(nodeLabel);

        try {
            // This prompt uses the REFINED VISUALIZATION_SYSTEM_PROMPT
            const prompt = `${VISUALIZATION_SYSTEM_PROMPT}\n\nGenerate an interactive visualization for the concept: ${fullConcept}`;
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            if (response.promptFeedback?.blockReason) { throw new Error(`Visualization blocked: ${response.promptFeedback.blockReason}`); }
            const text = response.text();
            if (!text) { throw new Error("Empty response received from Gemini."); }
            const cleanedHtml = text.replace(/^\`\`\`(?:html)?\s*|\s*\`\`\`$/g, '').trim();
            setVisualizationHtml(cleanedHtml);
        } catch (err) {
            console.error('Error during Visualization generation (Gemini):', err);
            setVisError(err.message || 'Failed to generate visualization.');
            setVisualizationHtml('');
        } finally {
            setIsVisLoading(false);
        }
    }, [topic, isGeminiKeyMissing, geminiModel]);
    // ---------------

    // --- Render Logic Variables ---
    const displayTopic = topic.trim() || 'the Topic';
    const isAnythingLoading = isMapLoading || isVisLoading;
    const disableMapControls = isMapLoading || isGroqKeyMissing;
    const showVisualizationSection = !!(selectedNodeLabel || isVisLoading || visualizationHtml || visError);
    // ----------------------------

    // --- Return Statement (JSX) ---
    // No changes needed within the JSX structure itself
    return (
        <div className={`app-container`}>
            <h1>Craft Your Learning Adventure! <span role="img" aria-label={isPlayful ? 'party popper' : 'robot'}>{isPlayful ? '🥳' : '🤖'}</span></h1>

            {isGroqKeyMissing && <p className="error-message critical-error">⚠️ Groq API Key missing. Mind Map & Chatbot disabled.</p>}
            {isGeminiKeyMissing && <p className="error-message critical-error">⚠️ Gemini API Key missing. Visualization disabled.</p>}

            <form className="input-panel" onSubmit={handleGenerateMindMap}>
                <div className="form-group" style={{ flexGrow: 2 }}>
                    <label htmlFor="topic-input" className="input-label">
                        Topic
                    </label>
                    <input
                        type="text"
                        id="topic-input"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={isGroqKeyMissing ? "Groq Key Missing" : "Enter topic..."}
                        aria-label="Learning Topic"
                        disabled={disableMapControls}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="level-select" className="input-label">
                        Level
                    </label>
                    <select
                        id="level-select"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        aria-label="Select Learning Level"
                        disabled={disableMapControls}
                    >
                        <option value="Novice Explorer">{isPlayful ? '🌱 Space Cadet' : '🌱 Novice Explorer'}</option>
                        <option value="Curious Apprentice">{isPlayful ? '🧐 Star Gazer' : '🧐 Curious Apprentice'}</option>
                        <option value="Adept Scholar">{isPlayful ? '🎓 Galaxy Brain' : '🎓 Adept Scholar'}</option>
                        <option value="Wise Master">{isPlayful ? '🧙 Cosmic Sage' : '🧙 Wise Master'}</option>
                    </select>
                </div>

                <div className="button-container">
                    <span className="button-description">Click to see the magic!</span>
                    <button type="submit" className="submit-button" disabled={disableMapControls || !topic.trim()}>
                        {isMapLoading ? 'Generating...' : '✨ Generate Map ✨'}
                    </button>
                </div>
            </form>


            {mapError && !isGroqKeyMissing && <p className="error-message main-error">Mind Map Error: {mapError}</p>}

            <div className="controls-panel">
                <div className="switch-container">
                    <span className={`switch-label ${!isPlayful ? 'active' : ''}`}>Focused</span>
                    <label className="switch"><input type="checkbox" checked={isPlayful} onChange={() => setIsPlayful(!isPlayful)} aria-label="Toggle Focused/Playful modes" disabled={isAnythingLoading || isGroqKeyMissing || isGeminiKeyMissing} /><span className="slider"></span></label>
                    <span className={`switch-label ${isPlayful ? 'active' : ''}`}>Playful</span>
                </div>
            </div>

            <div className="content-grid-two-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {gridCardDefinitions.slice(0, 2).map((card, index) => {
                    const baseTitle = isPlayful ? card.titlePlayful : card.title;
                    const currentTitle = baseTitle.replace('[topic]', displayTopic);
                    const currentIcon = isPlayful ? card.iconPlayful : card.icon;
                    const animationDelay = `${0.3 + index * 0.1}s`;
                    const isCardDisabled = card.apiKeyMissing;
                    const cardIsMapLoading = (card.id === 'mind-map' && isMapLoading);
                    const dimCard = (isAnythingLoading && !cardIsMapLoading) || isCardDisabled;

                    return (
                        <div key={card.id} className={`content-card ${isCardDisabled ? 'disabled-card' : ''}`} style={{ animationDelay, opacity: dimCard ? 0.6 : 1, position: 'relative' }}>
                            {isCardDisabled && <div className="api-key-missing-overlay">API Key Missing</div>}
                            <div className="card-header">
                                <span className="card-icon" role="img" aria-label={`${currentTitle} icon`}>{currentIcon}</span>
                                <h3 className="card-title">{currentTitle}</h3>
                            </div>
                            {card.id === 'mind-map' && (
                                <p className="card-description">
                                    {(isPlayful ? card.descriptionPlayful : card.description).replace('[topic]', displayTopic)}
                                </p>
                            )}
                            <div className="card-content-area" style={{ marginTop: 'auto' }}>
                                {card.id === 'mind-map' ? (
                                    <MindMapViewer
                                        key={topic || 'initial-map'} nodes={mindMapData.nodes} edges={mindMapData.edges} isLoading={isMapLoading} isDisabled={isCardDisabled}
                                        onNodeClick={isCardDisabled ? undefined : handleNodeClickGenerateVisualization}
                                    />
                                ) : card.id === 'chatbot' ? (
                                    <Chatbot
                                        key={topic || 'initial-chat'}
                                        isChatActive={isChatActive}
                                        systemPrompt={chatbotSystemPrompt}
                                        groq={groq}
                                        displayTopic={displayTopic}
                                        isPlayful={isPlayful}
                                        isDisabled={isCardDisabled}
                                    />
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showVisualizationSection && (
                (() => {
                    const visCard = gridCardDefinitions.find(card => card.id === 'visualization');
                    if (!visCard) return null;
                    const isVisCardDisabled = visCard.apiKeyMissing;
                    const visCardTitle = isPlayful ? visCard.titlePlayful : visCard.title;
                    const visCardIcon = isPlayful ? visCard.iconPlayful : visCard.icon;
                    return (
                        <div className={`visualization-container content-card ${isVisCardDisabled ? 'disabled-card' : ''}`}>
                            {isVisCardDisabled && <div className="api-key-missing-overlay">API Key Missing</div>}
                            <div className="card-header">
                                <span className="card-icon" role="img" aria-label={`${visCardTitle} icon`}>{visCardIcon}</span>
                                <h3 className="card-title">{selectedNodeLabel ? `${selectedNodeLabel} Visualization` : visCardTitle}</h3>
                            </div>
                            {visError && !isGeminiKeyMissing && <p className="error-message small">Visualization Error: {visError}</p>}
                            <div className="card-content-area">
                                <VisualizationViewer htmlContent={visualizationHtml} isLoading={isVisLoading} isDisabled={isVisCardDisabled} error={visError} />
                            </div>
                        </div>
                    );
                })()
            )}
        </div>
    );
    // -----------------------------
}

export default App;