'use client'

import { useState, useEffect } from 'react';
import { chatHistoryService, ChatSession, ChatMessage } from './lib/chat-history';

interface Slide {
  title: string;
  content: string[];
  layout: 'TITLE' | 'TITLE_CONTENT' | 'SECTION_HEADER';
}

// Simple function to check if API key is available
function isApiKeyAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [geminiService, setGeminiService] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize Gemini service and chat history
  useEffect(() => {
    if (!isApiKeyAvailable()) {
      setApiError('GEMINI_API_KEY is not set. Please check your .env.local file.');
      return;
    }

    // Load chat sessions
    const sessions = chatHistoryService.getSessions();
    setChatSessions(sessions);
    
    const currentSession = chatHistoryService.getCurrentSession();
    setCurrentSession(currentSession);
    
    if (currentSession) {
      setMessages(currentSession.messages);
      // Load slides from the last AI message if available
      const lastAiMessage = [...currentSession.messages]
        .reverse()
        .find(msg => !msg.isUser && msg.slides);
      if (lastAiMessage?.slides) {
        setSlides(lastAiMessage.slides);
      }
    }

    // Dynamically import the Gemini service
    import('./lib/gemini-client')
      .then((module) => {
        setGeminiService(module.geminiService);
      })
      .catch((error) => {
        console.error('Failed to load Gemini service:', error);
        setApiError('Failed to initialize AI service. Please check your API key.');
      });
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !geminiService) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    // Add user message to history
    chatHistoryService.addMessageToCurrentSession(userMessage);
    
    const updatedSession = chatHistoryService.getCurrentSession();
    setCurrentSession(updatedSession);
    setMessages(updatedSession?.messages || []);
    setInputText('');
    setIsLoading(true);

    try {
      // Generate slides using Gemini
      const newSlides = await geminiService.generateSlides(inputText, slides);
      setSlides(newSlides);

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `I've created a presentation with ${newSlides.length} slides! You can now preview or download it.`,
        isUser: false,
        timestamp: new Date(),
        slides: newSlides
      };

      // Add AI message to history with slides
      chatHistoryService.addMessageToCurrentSession(aiMessage, newSlides);
      
      const finalSession = chatHistoryService.getCurrentSession();
      setCurrentSession(finalSession);
      setMessages(finalSession?.messages || []);
      
      // Update chat sessions list
      setChatSessions(chatHistoryService.getSessions());

    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: error.message || 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      
      chatHistoryService.addMessageToCurrentSession(errorMessage);
      const errorSession = chatHistoryService.getCurrentSession();
      setCurrentSession(errorSession);
      setMessages(errorSession?.messages || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newSession = chatHistoryService.createNewSession();
    setCurrentSession(newSession);
    setMessages([]);
    setSlides([]);
    setChatSessions(chatHistoryService.getSessions());
    setShowHistory(false);
  };

  const handleSelectSession = (sessionId: string) => {
    chatHistoryService.setCurrentSession(sessionId);
    const session = chatHistoryService.getCurrentSession();
    setCurrentSession(session);
    setMessages(session?.messages || []);
    
    // Load slides from the last AI message
    const lastAiMessage = [...(session?.messages || [])]
      .reverse()
      .find(msg => !msg.isUser && msg.slides);
    setSlides(lastAiMessage?.slides || []);
    
    setShowHistory(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    chatHistoryService.deleteSession(sessionId);
    const sessions = chatHistoryService.getSessions();
    setChatSessions(sessions);
    
    if (currentSession?.id === sessionId) {
      const newCurrentSession = sessions[0] || null;
      setCurrentSession(newCurrentSession);
      setMessages(newCurrentSession?.messages || []);
      setSlides([]);
    }
  };

  const handleDownload = async () => {
    if (slides.length === 0) return;

    try {
      setIsLoading(true);
      const { generatePresentation } = await import('./lib/ppt-generator');
      await generatePresentation(slides, false, 'pptx', (progress) => {
        console.log('Generation progress:', progress);
      });
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading presentation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI Components ---

  // Show API error message (keep your existing error UI)
  if (apiError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Setup Required</h1>
          <p className="text-gray-600 mb-4">{apiError}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <p className="text-sm font-semibold mb-2">To fix this:</p>
            <ol className="text-sm list-decimal list-inside space-y-1">
              <li>Open your <code>.env.local</code> file</li>
              <li>Add: <code>NEXT_PUBLIC_GEMINI_API_KEY=your_key_here</code></li>
              <li>Restart the server: <code>npm run dev</code></li>
            </ol>
          </div>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Get API Key
          </a>
        </div>
      </div>
    );
  }
  
  // Conditionally render the simplified initial UI
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hello!
          </h1>
          <p className="text-gray-600 mb-8">
            What do you want me to generate today?
          </p>

          {/* Example Prompts */}
        {geminiService && (
          <div className="max-w-4xl mx-auto mt-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Try these examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Create a 5-slide presentation about renewable energy",
                "Make a business pitch deck for a coffee shop",
                "Generate slides about the benefits of exercise",
                "Create an educational presentation about the solar system"
              ].map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputText(prompt);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                  disabled={isLoading || !geminiService}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <br></br>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex items-center">
            <button
              className="p-3 text-gray-400 hover:text-gray-600"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Start with a topic, we'll turn it into slides!"
              className="flex-1 px-4 py-3 text-lg border-none focus:outline-none"
              disabled={!geminiService}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || !geminiService}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-45 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          {/* Hidden file input for attachment icon functionality */}
          <input type="file" id="file-upload-input" className="hidden" />
          
          <p className="text-xs text-gray-400 mt-4">Powered by Gemini</p>
        </div>
      </div>
    );
  }


  // Render the complex UI once a message has been sent
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
  <div className="flex justify-between items-center mb-4">
    {/* Menu Button */}
    <button
      onClick={() => setShowHistory(!showHistory)}
      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center space-x-2"
    >
      <span>☰</span>
      <span>Menu</span>
    </button>

    <h1 className="text-4xl font-bold text-gray-800">
      MagicSlides AI
    </h1>

    <div className="w-[80px]"></div> {/* spacer to keep center alignment */}
  </div>

  <p className="text-gray-600">
    Create PowerPoint presentations with AI - Just describe what you want!
  </p>
  {currentSession && (
    <div className="mt-2 text-sm text-gray-500">
      Current: {currentSession.title}
    </div>
  )}
  {!geminiService && !apiError && (
    <div className="mt-4 text-blue-600">
      🔧 Initializing AI service...
    </div>
  )}
</header>


        {/* Chat History Sidebar */}
       {showHistory && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
    <div className="bg-white w-80 h-full overflow-y-auto p-4">
      {/* Close button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Menu</h2>
        <button
          onClick={() => setShowHistory(false)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ✕
        </button>
      </div>

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        className="w-full mb-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        ➕ New Chat
      </button>

      <h3 className="text-md font-semibold mb-2">Chat History</h3>

      {/* Chat History List */}
      {chatSessions.length === 0 ? (
        <div className="text-gray-500 text-center py-6">
          No chat history yet
        </div>
      ) : (
        <div className="space-y-2">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`p-3 border rounded-lg cursor-pointer hover:bg-blue-50 ${
                currentSession?.id === session.id
                  ? 'bg-blue-100 border-blue-300'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm truncate">
                    {session.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {session.messages.length} messages •{' '}
                    {session.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear All History */}
      {chatSessions.length > 0 && (
        <button
          onClick={() => chatHistoryService.clearAllSessions()}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Clear All History
        </button>
      )}
    </div>

    {/* Click outside to close */}
    <div className="flex-1" onClick={() => setShowHistory(false)}></div>
  </div>
)}


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Chat Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Chat with AI</h2>

            <div className="h-96 overflow-y-auto mb-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-2xl max-w-[80%] ${
                    message.isUser
                      ? 'bg-blue-500 text-white ml-auto rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="text-sm opacity-75 mb-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  {message.text}
                </div>
              ))}
              {isLoading && (
                <div className="p-4 bg-gray-100 rounded-2xl rounded-bl-none max-w-[80%] text-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm font-medium italic">Generating slides... please wait ⏳</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe your presentation... (e.g., 'Create a 5-slide presentation about climate change')"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading || !geminiService}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading || !geminiService}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>

          {/* Slides Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Presentation</h2>
              {slides.length > 0 && (
                <button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  Download PPTX
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="h-96 flex flex-col items-center justify-center text-gray-600">
                <div className="text-6xl mb-3 animate-spin">💫</div>
                <p className="text-lg font-semibold">Generating your slides...</p>
                <p className="text-sm">This may take a few seconds ⏳</p>
              </div>
            ) : slides.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <p>Your presentation will appear here</p>
                  <p className="text-sm">Try asking for a presentation about your favorite topic!</p>
                </div>
              </div>
            ) : (
              <div className="h-96 overflow-y-auto space-y-4">
                {slides.map((slide, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg text-blue-600 mb-2">
                      Slide {index + 1}: {slide.title}
                    </h3>
                    <div className="space-y-1">
                      {slide.content.map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Layout: {slide.layout}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}