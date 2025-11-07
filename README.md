MagicSlides AI - PowerPoint Generator
An AI-powered chat application that generates and edits PowerPoint presentations using natural language prompts. Built with Next.js, React, TypeScript, and Google Gemini AI.

Features
Core Features
AI-Powered Generation: Create PowerPoint presentations using Google Gemini AI

Interactive Chat Interface: Natural language conversations to create and edit slides

Real-time Preview: Instant preview of generated slides

Dynamic Editing: Edit slides through chat or direct content editing

Plus Features (Implemented)
Streaming PPT Generation: Real-time progress updates during presentation creation
Multiple Download Options: Download as PPTX or PDF formats
Chat History: Persistent chat sessions with history sidebar

Professional Templates: Beautiful slide layouts and designs

Tech Stack
Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
AI Integration: Google Gemini (gemini-1.5-flash, gemini-1.5-pro, gemini-pro)
Presentation Generation: pptxgenjs for PowerPoint creation
State Management: React Hooks (useState, useEffect)
Storage: Browser localStorage for chat history
Icons: Lucide React
Styling: Tailwind CSS with custom components

Prerequisites
Before you begin, ensure you have:
Node.js 18.0 or later installed
Google Gemini API Key (free from Google AI Studio)
Modern web browser with JavaScript enabled

Quick Start
Step 1: Clone and Setup

npx create-next-app@latest magic-slides-app
cd magic-slides-app

# Install dependencies
npm install pptxgenjs google-generative-ai lucide-react
npm install -D tailwindcss postcss autoprefixer @types/node

# Initialize Tailwind CSS
npx tailwindcss init -p
Step 2: Environment Configuration
Create a .env.local file in the root directory:

# env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key_here
How to get your API key:

# Visit Google AI Studio
Click "Create API Key"
Copy the key and paste it in .env.local

Step 3: Project Structure
text
magic-slides-app/
├── app/
│   ├── components/          # React components
│   │   ├── (Future components can go here)
│   ├── lib/                # Utility libraries
│   │   ├── gemini-client.ts    # AI service integration
│   │   ├── ppt-generator.ts    # PowerPoint generation
│   │   └── chat-history.ts     # Chat session management
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── public/                 # Static assets
├── .env.local             # Environment variables
└── package.json           # Dependencies

Step 4: Run the Application

# Start development server
npm run dev

# Open browser and navigate to
http://localhost:3000
🎯 Usage Instructions
Creating Your First Presentation
Start a Conversation:
Type your request in the chat input: "Create a 5-slide presentation about climate change"
Or click one of the example prompts

AI Generation:
The AI will process your request and generate structured slide content
You'll see real-time progress during generation

Preview Slides:
View generated slides in the right panel
Each slide shows title, content, and layout type

Download Options:
PPTX: Native PowerPoint format for editing in Microsoft PowerPoint
PDF: Portable format for sharing and presentations

# Advanced Features
Chat History
Click the menu icon (☰) to open history sidebar
View all previous chat sessions
Load any previous conversation

Delete individual sessions

Start new chats with the "New Chat" button

Progress Streaming
Real-time progress during presentation generation
Visual progress bar with percentage completion
Step-by-step status updates
Slide creation counter

Multiple Download Formats
PPTX: Editable PowerPoint format
PDF: Universal sharing format
Both formats maintain professional styling