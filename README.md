# AI-Powered Content Generator & Visualizer

This project is a React application built with Vite that utilizes AI models (Groq and Google Gemini) to provide interactive features like a chatbot, a dynamic mind map generator, and a data visualization tool.

## Features

*   **Chatbot:** Interact with a language model (powered by Groq) to ask questions and get responses.
*   **Mind Map Viewer:** Generate and visualize mind maps based on prompts (powered by Groq). Uses React Flow for rendering.
*   **Visualization Viewer:** Generate data visualizations based on prompts (powered by Google Gemini). Uses React Flow for rendering.
*   **Landing Page:** An introductory page for the application.

## Technologies Used

*   **Frontend:** React, Vite
*   **State Management:** React hooks (likely `useState`, `useEffect`, `useContext`)
*   **Routing:** React Router DOM
*   **AI APIs:**
    *   Groq SDK (`groq-sdk`)
    *   Google Generative AI (`@google/generative-ai`)
*   **Visualization & Diagrams:** React Flow (`reactflow`)
*   **Markdown Rendering:** Marked (`marked`)
*   **Mathematical Rendering:** KaTeX (`katex`)
*   **Animation:** Framer Motion (`framer-motion`)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

This application requires API keys for Groq and Google Gemini to enable its core functionalities.

1.  Obtain your API keys from:
    *   [Groq Cloud](https://console.groq.com/keys)
    *   [Google AI Studio](https://aistudio.google.com/app/apikey) (for Gemini)
2.  Create a `.env` file in the root directory of the project.
3.  Add your API keys to the `.env` file:
    ```env
    VITE_GROQ_API_KEY=your_groq_api_key
    VITE_GEMINI_API_KEY=your_gemini_api_key
    ```
    **Note:** Features associated with a missing API key will be disabled.

## Running the Application

To start the development server:

```bash
npm run dev

**Project Sturucture**
.
├── public/             # Static assets
├── src/
│   ├── assets/         # Images, etc.
│   ├── components/     # (Likely contains Chatbot, MindMapViewer, VisualizationViewer, LandingPage)
│   ├── App.jsx         # Main application component
│   ├── index.css       # Global styles
│   ├── main.jsx        # Entry point
│   └── ...             # Other files (e.g., utility functions)
├── .env                # Environment variables (for API keys)
├── .gitignore          # Git ignore rules
├── index.html          # Main HTML file
├── package.json        # Project dependencies and scripts
├── vite.config.js      # Vite configuration
└── README.md           # Project description (this file)
