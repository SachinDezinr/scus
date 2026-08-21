'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';

export interface ActionableCard {
  type: 'resource' | 'lost' | 'found' | 'complaint' | 'stat';
  id?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  link?: string;
  badge?: string;
  badgeColor?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  cards?: ActionableCard[];
  timestamp: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (queryText: string) => Promise<void>;
  clearChat: () => void;
}

const STORAGE_KEY = 'campus_chat_session';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'bot',
  text: `Welcome to the **Campus AI Assistant**!\n\nAsk me about study resources, lost items, infrastructure complaints, or administrative system statistics.`,
  timestamp: 'Just now',
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { authFetch, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Restore messages from sessionStorage on initial load
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // fallback to initial
    } finally {
      setInitialized(true);
    }
  }, []);

  // Sync messages to sessionStorage whenever they change
  useEffect(() => {
    if (!initialized) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // silent ignore on storage quota
    }
  }, [messages, initialized]);

  const sendMessage = useCallback(async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: timeString,
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: data.reply || 'Here is what I found.',
            cards: data.cards || [],
            timestamp: botTime,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: data.error || 'An error occurred while fetching information.',
            timestamp: botTime,
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Network error. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const clearChat = useCallback(() => {
    const resetTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const defaultMsg: ChatMessage = {
      ...INITIAL_MESSAGE,
      timestamp: resetTime,
    };
    setMessages([defaultMsg]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ChatContext.Provider value={{ messages, loading, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}