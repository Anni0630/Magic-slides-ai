export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  slides?: Slide[];
}

export interface Slide {
  title: string;
  content: string[];
  layout: 'TITLE' | 'TITLE_CONTENT' | 'SECTION_HEADER';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

class ChatHistoryService {
  private readonly STORAGE_KEY = 'magicslides_chat_sessions';
  private currentSessionId: string | null = null;

  constructor() {
    this.ensureDefaultSession();
  }

  private ensureDefaultSession() {
    const sessions = this.getSessions();
    if (sessions.length === 0) {
      this.createNewSession('New Presentation');
    } else {
      this.currentSessionId = sessions[0].id;
    }
  }

  getSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })) : [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  }

  createNewSession(title: string = 'New Presentation'): ChatSession {
    const newSession: ChatSession = {
      id: this.generateId(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sessions = this.getSessions();
    sessions.unshift(newSession);
    this.saveSessions(sessions);
    
    this.currentSessionId = newSession.id;
    return newSession;
  }

  getCurrentSession(): ChatSession | null {
    if (!this.currentSessionId) return null;
    
    const sessions = this.getSessions();
    return sessions.find(session => session.id === this.currentSessionId) || null;
  }

  setCurrentSession(sessionId: string) {
    this.currentSessionId = sessionId;
  }

  addMessageToCurrentSession(message: ChatMessage, slides?: Slide[]): void {
    if (!this.currentSessionId) {
      this.createNewSession(this.generateSessionTitle(message.text));
    }

    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === this.currentSessionId);
    
    if (sessionIndex !== -1) {
      const messageWithSlides = slides ? { ...message, slides } : message;
      
      sessions[sessionIndex].messages.push(messageWithSlides);
      sessions[sessionIndex].updatedAt = new Date();
      
      if (message.isUser && sessions[sessionIndex].messages.filter(m => m.isUser).length === 1) {
        sessions[sessionIndex].title = this.generateSessionTitle(message.text);
      }
      
      this.saveSessions(sessions);
    }
  }

  updateCurrentSessionSlides(slides: Slide[]): void {
    if (!this.currentSessionId) return;

    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === this.currentSessionId);
    
    if (sessionIndex !== -1 && sessions[sessionIndex].messages.length > 0) {
      const lastMessageIndex = sessions[sessionIndex].messages.length - 1;
      if (!sessions[sessionIndex].messages[lastMessageIndex].isUser) {
        sessions[sessionIndex].messages[lastMessageIndex].slides = [...slides];
        sessions[sessionIndex].updatedAt = new Date();
        this.saveSessions(sessions);
      }
    }
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter(s => s.id !== sessionId);
    this.saveSessions(sessions);
    
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = sessions.length > 0 ? sessions[0].id : null;
    }
  }

  clearAllSessions(): void {
    this.saveSessions([]);
    this.currentSessionId = null;
    this.ensureDefaultSession();
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private generateSessionTitle(firstMessage: string): string {
    const words = firstMessage.split(' ').slice(0, 5).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  }

  private saveSessions(sessions: ChatSession[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }
  }
}

export const chatHistoryService = new ChatHistoryService();