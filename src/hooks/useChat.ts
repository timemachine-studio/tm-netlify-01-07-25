import { useState, useCallback, useEffect, useRef } from 'react';
import { Message } from '../types/chat';
import { generateAIResponse } from '../services/ai/aiProxyService';
import { INITIAL_MESSAGE, AI_PERSONAS } from '../config/constants';

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  persona: keyof typeof AI_PERSONAS;
  createdAt: string;
  lastModified: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([{ ...INITIAL_MESSAGE, hasAnimated: false }]);
  const [isChatMode, setChatMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<keyof typeof AI_PERSONAS>('default');
  const [currentEmotion, setCurrentEmotion] = useState<string>('joy');
  const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // Set theme based on persona
  const setPersonaTheme = useCallback((persona: keyof typeof AI_PERSONAS) => {
    let themeToSet: string;
    
    switch (persona) {
      case 'girlie':
        themeToSet = 'springDark';
        break;
      case 'pro':
        themeToSet = 'summerDark';
        break;
      default:
        themeToSet = 'autumnDark';
    }
    
    window.dispatchEvent(new CustomEvent('themeChange', { detail: themeToSet }));
  }, []);

  // Save chat session function
  const saveChatSession = useCallback((sessionId: string, messagesToSave: Message[], persona: keyof typeof AI_PERSONAS) => {
    if (messagesToSave.length <= 1) return; // Don't save if only initial message

    try {
      const chatSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]') as ChatSession[];
      const now = new Date().toISOString();

      const existingSessionIndex = chatSessions.findIndex(session => session.id === sessionId);

      if (existingSessionIndex !== -1) {
        // Update existing session
        chatSessions[existingSessionIndex] = {
          ...chatSessions[existingSessionIndex],
          messages: messagesToSave,
          lastModified: now
        };
      } else {
        // Create new session
        const firstUserMessage = messagesToSave.find(msg => !msg.isAI);
        const sessionName = firstUserMessage ? firstUserMessage.content.slice(0, 50) : 'New Chat';
        
        const newSession: ChatSession = {
          id: sessionId,
          name: sessionName,
          messages: messagesToSave,
          persona,
          createdAt: now,
          lastModified: now
        };
        chatSessions.push(newSession);
      }
      
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    } catch (error) {
      console.error('Failed to save chat session:', error);
    }
  }, []);

  // Handle persona change
  const handlePersonaChange = useCallback((persona: keyof typeof AI_PERSONAS) => {
    // Save current session before switching
    if (currentSessionId && messages.length > 1) {
      saveChatSession(currentSessionId, messages, currentPersona);
    }

    setCurrentPersona(persona);
    setError(null);
    
    // Start new chat with new persona
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    
    const initialMessage = cleanContent(AI_PERSONAS[persona].initialMessage);
    setMessages([{
      id: Date.now(),
      content: initialMessage,
      isAI: true,
      hasAnimated: false
    }]);
    
    // Set theme based on the new persona
    setPersonaTheme(persona);
  }, [currentSessionId, messages, currentPersona, saveChatSession, setPersonaTheme]);

  // Start new chat function
  const startNewChat = useCallback(() => {
    // Save current session before starting new one
    if (currentSessionId && messages.length > 1) {
      saveChatSession(currentSessionId, messages, currentPersona);
    }

    // Start fresh chat with same persona
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
    
    const initialMessage = cleanContent(AI_PERSONAS[currentPersona].initialMessage);
    setMessages([{
      id: Date.now(),
      content: initialMessage,
      isAI: true,
      hasAnimated: false
    }]);
    
    setError(null);
  }, [currentSessionId, messages, currentPersona, saveChatSession]);

  const extractEmotion = (content: string): string | null => {
    const match = content.match(/<emotion>([a-z]+)<\/emotion>/i);
    if (!match) return null;
    
    const emotion = match[1].toLowerCase();
    const validEmotions = [
      'sadness', 'joy', 'love', 'excitement', 'anger',
      'motivation', 'jealousy', 'relaxation', 'anxiety', 'hope'
    ];
    
    return validEmotions.includes(emotion) ? emotion : 'joy';
  };

  const cleanContent = (content: string): string => {
    const emotion = extractEmotion(content);
    if (emotion) {
      return content.replace(/<emotion>[a-z]+<\/emotion>/i, '').trim();
    }
    return content;
  };

  // Dismiss rate limit modal
  const dismissRateLimitModal = useCallback(() => {
    setShowRateLimitModal(false);
  }, []);

  // Save chat session when messages change (but not on initial load)
  useEffect(() => {
    if (messages.length > 1 && currentSessionId) {
      saveChatSession(currentSessionId, messages, currentPersona);
    }
  }, [messages, currentSessionId, currentPersona, saveChatSession]);

  // Initialize session ID on first load
  useEffect(() => {
    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }
  }, [currentSessionId]);

  const handleSendMessage = useCallback(async (content: string, imageData?: string | string[]) => {
    let messagePersona = currentPersona;
    let messageContent = content;

    // Check for @persona mentions
    const mentionMatch = content.match(/^@(girlie|pro)\s+(.+)$/);
    if (mentionMatch) {
      messagePersona = mentionMatch[1] as keyof typeof AI_PERSONAS;
      messageContent = mentionMatch[2];
    }

    const userMessage: Message = {
      id: Date.now(),
      content: messageContent,
      isAI: false,
      hasAnimated: false,
      imageData: imageData
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const streamingId = Date.now() + 1;
      setStreamingMessageId(streamingId);
      setMessages(prev => [...prev, {
        id: streamingId,
        content: '',
        thinking: messagePersona === 'pro' ? '' : undefined,
        isAI: true,
        hasAnimated: false
      }]);

      const aiResponse = await generateAIResponse(
        [...messages, userMessage],
        imageData,
        '', // System prompt is now handled server-side
        messagePersona,
        (data) => {
          const cleanedContent = cleanContent(data.content);
          setMessages(prev => prev.map(msg => 
            msg.id === streamingId
              ? { 
                  ...msg, 
                  content: cleanedContent,
                  thinking: data.thinking !== undefined ? data.thinking : msg.thinking
                }
              : msg
          ));
        }
      );
      
      const emotion = extractEmotion(aiResponse.content);
      const cleanedContent = cleanContent(aiResponse.content);
      
      if (emotion) {
        setCurrentEmotion(emotion);
      }

      setMessages(prev => prev.map(msg =>
        msg.id === streamingId
          ? { ...msg, content: cleanedContent, thinking: aiResponse.thinking }
          : msg
      ));
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      // Check if it's a rate limit error
      if (error && typeof error === 'object' && 'type' in error && error.type === 'rateLimit') {
        setShowRateLimitModal(true);
        // Remove the streaming message since we're showing a modal instead
        setMessages(prev => prev.filter(msg => msg.id !== (Date.now() + 1)));
      } else {
        setError('Failed to generate response. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, [messages, currentPersona]);

  const markMessageAsAnimated = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, hasAnimated: true } : msg
    ));
  }, []);

  const dismissAboutUs = useCallback(() => {
    setShowAboutUs(false);
  }, []);

  const loadChat = useCallback((session: ChatSession) => {
    // Save current session before loading new one
    if (currentSessionId && messages.length > 1) {
      saveChatSession(currentSessionId, messages, currentPersona);
    }

    setCurrentPersona(session.persona);
    setMessages(session.messages);
    setChatMode(true);
    setCurrentSessionId(session.id);
    setPersonaTheme(session.persona);
  }, [currentSessionId, messages, currentPersona, saveChatSession, setPersonaTheme]);

  return {
    messages,
    isChatMode,
    isLoading,
    currentPersona,
    currentEmotion,
    streamingMessageId,
    error,
    showAboutUs,
    showRateLimitModal,
    setChatMode,
    handleSendMessage,
    handlePersonaChange,
    startNewChat,
    markMessageAsAnimated,
    dismissAboutUs,
    dismissRateLimitModal,
    loadChat
  };
}