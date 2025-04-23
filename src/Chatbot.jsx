// src/Chatbot.jsx (Corrected Code with Robust Manual KaTeX Rendering)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked'; // Import marked library

// --- Constants ---
const CHAT_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// KaTeX render options (used by renderToString)
const katexDisplayOptions = { throwOnError: false, displayMode: true };
const katexInlineOptions = { throwOnError: false, displayMode: false };

// Helper function to manually render KaTeX within an HTML string
const renderKatexInHtml = (htmlString) => {
    // Added check for window.katex availability at the start of the helper
    if (!htmlString || typeof window === 'undefined' || !window.katex) {
        // console.warn("renderKatexInHtml: KaTeX object not found or empty string.");
        return htmlString; // Return original if KaTeX not ready or string empty
    }

    try {
        // Render display math ($$ ... $$) - Use 's' flag for multiline matching
        const renderedDisplay = htmlString.replace(/\$\$(.+?)\$\$/gs, (match, mathContent) => {
             try {
                 // Use window.katex which should be available if we passed the initial check
                 return window.katex.renderToString(mathContent.trim(), katexDisplayOptions);
             } catch (e) {
                 console.error("KaTeX display render error:", e);
                 return `<span style="color: red;" title="${e.message || 'Unknown error'}">[Display Math Error]</span>`;
             }
        });

        // Render inline math ($ ... $) on the result of the display math rendering
        const renderedInline = renderedDisplay.replace(/\$(.+?)\$/g, (match, mathContent) => {
             try {
                 const contentTrimmed = mathContent.trim();
                 // Basic check to avoid rendering things like $5 or $100
                 if (!contentTrimmed || /^\d+(\.\d+)?$/.test(contentTrimmed)) {
                     return match; // Return original if it looks like just a price/number
                 }
                 // Use window.katex which should be available
                 return window.katex.renderToString(contentTrimmed, katexInlineOptions);
             } catch (e) {
                 console.error("KaTeX inline render error:", e);
                 return `<span style="color: red;" title="${e.message || 'Unknown error'}">[Inline Math Error]</span>`;
             }
        });

        return renderedInline;

    } catch (error) {
        console.error("Error during KaTeX replacement:", error);
        return htmlString; // Return original string on major failure
    }
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
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [inputText, setInputText] = useState('');
    const [uploadedImageBase64, setUploadedImageBase64] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const chatAreaRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Effects ---

    // Effect to initialize or reset the chat
    useEffect(() => {
        if (isChatActive && systemPrompt && !isDisabled) {
            console.log("Chatbot Initializing/Resetting."); // Simplified log
            const initialText = `Hello! I'm Tanya, your AI tutor for **${displayTopic || 'this topic'}**. Ask me anything or upload an image related to it!`;
            let renderedHtml = '';
             try {
                renderedHtml = marked.parse(initialText);
                // Apply KaTeX rendering even to initial message for safety
                 if (typeof window !== 'undefined' && window.katex) {
                    renderedHtml = renderKatexInHtml(renderedHtml);
                 }
             } catch (e) {
                console.error("Error processing initial message:", e);
                renderedHtml = "<p>Hello!</p>"; // Simple fallback
             }


            const initialBotMessage = {
                id: Date.now(),
                sender: 'bot',
                text: initialText,
                htmlContent: renderedHtml
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
    }, [isChatActive, systemPrompt, displayTopic, isDisabled]);


    // --- Scroll Effect ---
    useEffect(() => {
        if (chatAreaRef.current) {
            // Scroll to bottom after messages render
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);
    // --- END Scroll Effect ---


    // --- addMessage Helper (with robust KaTeX check) ---
    const addMessage = (sender, text, isError = false) => {
        let finalHtmlContent = null;
        // Only process bot messages that are not errors
        if (sender === 'bot' && !isError) {
            // Check if KaTeX is available globally FIRST
            if (typeof window !== 'undefined' && window.katex) {
                try {
                    const parsedHtml = marked.parse(text);         // 1. Parse Markdown
                    finalHtmlContent = renderKatexInHtml(parsedHtml); // 2. Render KaTeX within the parsed HTML
                } catch (e) {
                    console.error("Error processing bot message content (Markdown or KaTeX):", e);
                    finalHtmlContent = `<p style="color: red;">Error displaying message content.</p>`; // Fallback HTML
                }
            } else {
                 // If KaTeX isn't ready, just parse Markdown and log a warning
                 console.warn("KaTeX not available when processing message, rendering Markdown only.");
                 try {
                     finalHtmlContent = marked.parse(text);
                 } catch (e) {
                     console.error("Error parsing Markdown when KaTeX unavailable:", e);
                     finalHtmlContent = `<p style="color: red;">Error displaying message content.</p>`;
                 }
            }
        }
        // For user messages or errors, htmlContent remains null

        const newMessage = {
            id: Date.now() + Math.random(),
            sender,
            text, // Store original text
            isError,
            htmlContent: finalHtmlContent // Store the final HTML or null
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
    };
    // --- END addMessage ---


    // Helper Functions (handleImageUpload, removeImage - No change)
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => { setUploadedImageBase64(reader.result); setImagePreview(reader.result); }
            reader.onerror = () => { addMessage('bot', 'Error reading image file.', true); removeImage(); }
            reader.readAsDataURL(file);
        } else if (file) { addMessage('bot', 'Please select a valid image file.', true); }
        if(event.target) event.target.value = null;
    };
    const removeImage = () => {
        setUploadedImageBase64(null); setImagePreview(null);
        if (fileInputRef.current) { fileInputRef.current.value = null; }
    };

    // API Call Logic (fetchBotResponse - No change)
    const fetchBotResponse = useCallback(async (currentChatHistory) => {
        if (!groq) { addMessage('bot', "Error: Groq SDK is not initialized.", true); return; }
        if (!currentChatHistory || currentChatHistory.length === 0 || (currentChatHistory.length === 1 && currentChatHistory[0].role === 'system')) {
             addMessage('bot', "Error: Chat history is incomplete for API call.", true); return;
        }
        setIsBotTyping(true);
        try {
            const response = await groq.chat.completions.create({
                model: CHAT_MODEL, messages: currentChatHistory, max_tokens: 1500,
            });
            const botReply = response.choices[0]?.message?.content;
            const botRole = response.choices[0]?.message?.role || 'assistant';
            if (botReply) {
                addMessage('bot', botReply); // Pass raw text to addMessage
                setChatHistory(prev => [...prev, { role: botRole, content: botReply }]);
            } else { throw new Error("Received an empty response from the AI."); }
        } catch (error) {
            console.error("Error fetching bot response:", error);
            addMessage('bot', `Sorry, I encountered an error: ${error.message || 'Unknown error'}`, true);
        } finally {
            setIsBotTyping(false);
        }
    }, [groq]); // Keep dependency only on groq

    // Event Handler (handleSendMessage - No change)
    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        const textToSend = inputText.trim();
        const imageToSend = uploadedImageBase64;
        if (!isChatActive || isDisabled || isBotTyping || (!textToSend && !imageToSend)) { return; }

        const userMessageForUI = textToSend || "(Image uploaded)";
        const newUserUIMessage = {
             id: Date.now() + Math.random(), sender: 'user', text: userMessageForUI, isError: false, htmlContent: null
        };
        setMessages(prevMessages => [...prevMessages, newUserUIMessage]);

        const userMessageContentForApi = [];
        if (textToSend) { userMessageContentForApi.push({ type: "text", text: textToSend }); }
        if (imageToSend) { userMessageContentForApi.push({ type: "image_url", image_url: { url: imageToSend } }); }
        const apiContent = userMessageContentForApi.length === 1 && userMessageContentForApi[0].type === 'text' ? userMessageContentForApi[0].text : userMessageContentForApi;
        const newUserHistoryEntry = { role: "user", content: apiContent };

        const updatedHistory = [...chatHistory, newUserHistoryEntry];
        setChatHistory(updatedHistory);
        setInputText('');
        removeImage();
        fetchBotResponse(updatedHistory);
    };


    // Render Logic (No change)
    const disableInput = isDisabled || !isChatActive || isBotTyping;
    const placeholderText = isDisabled ? "Chat disabled (API Key Missing)" : (!isChatActive ? "Generate a map to activate chat..." : (isBotTyping ? "Tanya is thinking..." : "Ask Tanya anything..."));


    // --- Return Statement (JSX - No change) ---
    return (
        <div className="chatbot-ui">
            <div className="chat-area" ref={chatAreaRef}>
                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'} ${message.isError ? 'error-message small' : ''}`}
                    >
                        {/* Render htmlContent if available (now contains Markdown+KaTeX), otherwise plain text */}
                        {message.htmlContent ? (
                            <div className="message-content" dangerouslySetInnerHTML={{ __html: message.htmlContent }} />
                        ) : (
                            <div className="message-content">{message.text}</div> // Fallback for user messages or errors
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

            {(isChatActive && !isDisabled) && (
                 <form className="chat-input-area" onSubmit={handleSendMessage}>
                     <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} disabled={disableInput} />
                    {imagePreview && (
                         <div id="image-preview-container" style={{ display: 'block' }}>
                            <img id="image-preview" src={imagePreview} alt="Preview" />
                            <button id="remove-image-button" type="button" onClick={removeImage} disabled={disableInput}>X</button>
                        </div>
                    )}
                    <button type="button" className="chatbot-upload-button" title="Upload Image" onClick={() => fileInputRef.current?.click()} disabled={disableInput}>📎</button>
                    <textarea
                        placeholder={placeholderText}
                        className="chat-input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                        rows="1"
                        disabled={disableInput}
                        style={{ flexGrow: 1 }}
                    />
                    <button type="submit" className="chatbot-send-button" title="Send Message" disabled={disableInput || (!inputText.trim() && !uploadedImageBase64)}>➤</button>
                 </form>
            )}
        </div>
    );
}

export default Chatbot;