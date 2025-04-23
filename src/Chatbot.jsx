// src/Chatbot.jsx (Complete Code with KaTeX fix)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked'; // Import marked library

// --- Constants ---
const CHAT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// KaTeX options (ensure these match delimiters used by the AI and in index.html)
const katexOptions = {
    delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
    ],
    throwOnError: false,
};

function Chatbot({
    isChatActive,    // Boolean to enable/disable chat
    systemPrompt,    // The dynamic system prompt string
    groq,            // The initialized Groq SDK instance
    displayTopic,    // For context
    isPlayful,       // For potential tone adjustments (used in prompt)
    isDisabled       // If the card itself is disabled (e.g., API key missing)
}) {
    // --- State ---
    const [messages, setMessages] = useState([]); // UI messages { id, sender, text, isError?, htmlContent? }
    const [chatHistory, setChatHistory] = useState([]); // API history { role, content }
    const [inputText, setInputText] = useState('');
    const [uploadedImageBase64, setUploadedImageBase64] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isBotTyping, setIsBotTyping] = useState(false); // Loading state for bot response ONLY
    const chatAreaRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Effects ---

    // Effect to initialize or reset the chat
    useEffect(() => {
        if (isChatActive && systemPrompt && !isDisabled) {
            console.log("Chatbot Initializing/Resetting. Prompt:", systemPrompt);
            const initialBotMessage = {
                id: Date.now(),
                sender: 'bot',
                text: `Hello! I'm Tanya, your AI tutor for **${displayTopic || 'this topic'}**. Ask me anything or upload an image related to it!`,
                htmlContent: marked.parse(`Hello! I'm Tanya, your AI tutor for **${displayTopic || 'this topic'}**. Ask me anything or upload an image related to it!`)
            };
            setMessages([initialBotMessage]);
            setChatHistory([{ role: 'system', content: systemPrompt }]);
            setInputText('');
            setUploadedImageBase64(null);
            setImagePreview(null);
            setIsBotTyping(false);
        } else {
            // Clear state if chat becomes inactive or disabled
            setMessages([]);
            setChatHistory([]);
            setInputText('');
            setUploadedImageBase64(null);
            setImagePreview(null);
            setIsBotTyping(false);
        }
    }, [isChatActive, systemPrompt, displayTopic, isDisabled]); // Added isDisabled dependency


    // --- KaTeX Rendering Effect ---
    // Effect to scroll down chat area and render KaTeX in the *entire* chat area
    useEffect(() => {
        // Scroll to bottom first
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }

        // Check if the global renderMathInElement function exists (from KaTeX CDN script)
        // and if the chat area ref is available.
        if (chatAreaRef.current && typeof window !== 'undefined' && typeof window.renderMathInElement === 'function') {
            try {
                 // Call the global function on the entire chat area container
                 // console.log("Attempting KaTeX render on chat area..."); // Optional logging
                 window.renderMathInElement(chatAreaRef.current, katexOptions);
            } catch(e) {
                 console.error("KaTeX render error:", e);
            }
        } else if (messages.length > 0 && typeof window.renderMathInElement !== 'function') {
            // Only warn if messages exist but function doesn't
            console.warn("renderMathInElement is not available. Ensure KaTeX auto-render script is loaded.");
        }
    }, [messages]); // Rerun whenever messages update
    // --- END KaTeX Rendering Effect ---


    // --- Helper Functions ---
    const addMessage = (sender, text, isError = false) => {
        // Parse markdown only for non-error bot messages BEFORE adding to state
        const htmlContent = (sender === 'bot' && !isError) ? marked.parse(text) : null;
        const newMessage = {
            id: Date.now() + Math.random(), // Slightly more unique ID
            sender,
            text,
            isError,
            htmlContent // Store pre-parsed HTML
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => { setUploadedImageBase64(reader.result); setImagePreview(reader.result); }
            reader.onerror = () => { addMessage('bot', 'Error reading image file.', true); removeImage(); }
            reader.readAsDataURL(file);
        } else if (file) { addMessage('bot', 'Please select a valid image file.', true); }
        if(event.target) event.target.value = null; // Reset file input
    };

    const removeImage = () => {
        setUploadedImageBase64(null); setImagePreview(null);
        if (fileInputRef.current) { fileInputRef.current.value = null; }
    };

    // --- API Call Logic ---
    const fetchBotResponse = useCallback(async (currentChatHistory) => {
        if (!groq) { addMessage('bot', "Error: Groq SDK is not initialized.", true); return; }
        if (!currentChatHistory || currentChatHistory.length === 0 || (currentChatHistory.length === 1 && currentChatHistory[0].role === 'system')) {
             addMessage('bot', "Error: Chat history is incomplete for API call.", true); return; // More specific check
        }

        setIsBotTyping(true);

        try {
            const response = await groq.chat.completions.create({
                model: CHAT_MODEL, messages: currentChatHistory, max_tokens: 1500, // Adjust max_tokens if needed
            });
            const botReply = response.choices[0]?.message?.content;
            const botRole = response.choices[0]?.message?.role || 'assistant';

            if (botReply) {
                // Add message will handle markdown parsing now
                addMessage('bot', botReply);
                setChatHistory(prev => [...prev, { role: botRole, content: botReply }]);
            } else { throw new Error("Received an empty response from the AI."); }
        } catch (error) {
            console.error("Error fetching bot response:", error);
            addMessage('bot', `Sorry, I encountered an error: ${error.message || 'Unknown error'}`, true);
        } finally {
            setIsBotTyping(false);
        }
    }, [groq]); // Dependency only on groq instance

    // --- Event Handler ---
    const handleSendMessage = (e) => {
        if (e) e.preventDefault(); // Prevent default form submission
        const textToSend = inputText.trim();
        const imageToSend = uploadedImageBase64; // Data URL 'data:image/...'

        if (!isChatActive || isDisabled || isBotTyping || (!textToSend && !imageToSend)) {
            return; // Exit if chat not ready or nothing to send
        }

        // --- Prepare message for UI ---
        const userMessageForUI = textToSend || "(Image uploaded)";
        const newUserMessage = {
             id: Date.now() + Math.random(),
             sender: 'user',
             text: userMessageForUI,
             isError: false,
             htmlContent: null // User messages are plain text in UI
        };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);


        // --- Prepare message(s) for API History ---
        const userMessageContentForApi = [];
        if (textToSend) {
            userMessageContentForApi.push({ type: "text", text: textToSend });
        }
        if (imageToSend) {
            // Ensure the format matches what the multi-modal model expects
            // Often { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
            userMessageContentForApi.push({ type: "image_url", image_url: { url: imageToSend } });
        }
        // Groq API might expect a string if only text, or array if multi-modal
        const apiContent = userMessageContentForApi.length === 1 && userMessageContentForApi[0].type === 'text'
                            ? userMessageContentForApi[0].text
                            : userMessageContentForApi;

        const newUserHistoryEntry = { role: "user", content: apiContent };
        // --------------------------------------------

        const updatedHistory = [...chatHistory, newUserHistoryEntry];
        setChatHistory(updatedHistory);

        // Clear inputs
        setInputText('');
        removeImage(); // Clears preview and base64 data

        // Fetch bot response
        fetchBotResponse(updatedHistory);
    };


    // --- Render Logic ---
    const disableInput = isDisabled || !isChatActive || isBotTyping;
    const placeholderText = isDisabled ? "Chat disabled (API Key Missing)" : (!isChatActive ? "Generate a map to activate chat..." : (isBotTyping ? "Tanya is thinking..." : "Ask Tanya anything..."));


    return (
        <div className="chatbot-ui">
            <div className="chat-area" ref={chatAreaRef}>
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'} ${message.isError ? 'error-message small' : ''}`}
                    >
                        {/* Render pre-parsed HTML for bot messages, otherwise render plain text */}
                        {message.htmlContent && !message.isError ? (
                            <div className="message-content" dangerouslySetInnerHTML={{ __html: message.htmlContent }} />
                        ) : (
                            <div className="message-content">{message.text}</div>
                        )}
                    </div>
                ))}
                {isBotTyping && (
                    <div className="message bot-message">
                        <div className="message-content typing-indicator"><span></span><span></span><span></span></div>
                    </div>
                )}
                {!isChatActive && !isDisabled && (
                    <div style={{ textAlign: 'center', color: 'var(--playful-text, var(--focused-text))', opacity: 0.7, marginTop: '2rem', padding: '0 1rem' }}>
                        Enter a topic and click 'Generate Map' to start chatting with Tanya!
                    </div>
                )}
            </div>

            {/* Show input area only if chat is active AND not disabled */}
            {(isChatActive && !isDisabled) && (
                 <form className="chat-input-area" onSubmit={handleSendMessage}>
                    {/* Hidden file input */}
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} disabled={disableInput} />
                    {/* Image Preview */}
                    {imagePreview && (
                        <div id="image-preview-container" style={{ display: 'block' }}>
                            <img id="image-preview" src={imagePreview} alt="Preview" />
                            <button id="remove-image-button" type="button" onClick={removeImage} disabled={disableInput}>X</button>
                        </div>
                    )}
                     {/* Upload Button */}
                    <button type="button" className="chatbot-upload-button" title="Upload Image" onClick={() => fileInputRef.current?.click()} disabled={disableInput}>📎</button>
                    {/* Text Input */}
                    <textarea
                        placeholder={placeholderText}
                        className="chat-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                        rows="1"
                        disabled={disableInput}
                        style={{ flexGrow: 1 }} // Ensure textarea grows
                    />
                     {/* Send Button */}
                    <button type="submit" className="chatbot-send-button" title="Send Message" disabled={disableInput || (!inputText.trim() && !uploadedImageBase64)}>➤</button>
                </form>
            )}
        </div>
    );
}

export default Chatbot;