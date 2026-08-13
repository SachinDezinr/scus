'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Send, Bot, Search, BookOpen,
  Building2, Shield, Download, ExternalLink, Lightbulb
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface ActionableCard {
  type: 'resource' | 'lost' | 'found' | 'complaint' | 'stat';
  id?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  link?: string;
  badge?: string;
  badgeColor?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  cards?: ActionableCard[];
  timestamp: string;
}

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIAssistantPage() {
  const { user, authFetch } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Welcome to the **Campus AI Assistant**!\n\nAsk me about study resources, lost items, infrastructure complaints, or administrative system statistics.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const text = queryText || input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: data.reply || 'Here is what I found.',
            cards: data.cards || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'An error occurred while fetching information.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Network error. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setLoading(false);
  };

  const suggestions = user?.role === 'admin'
    ? [
        { label: 'Admin Overview', query: 'Show system overview stats', icon: Shield, color: '#ff6b6b' },
        { label: 'Active Complaints', query: 'Check pending complaints', icon: Building2, color: '#fbbf24' },
        { label: 'Lost & Found Registry', query: 'Lost & Found Registry', icon: Search, color: '#00f5d4' },
        { label: 'Resource Materials', query: 'Find study notes', icon: BookOpen, color: '#a78bfa' },
      ]
    : [
        { label: 'Find Study Notes', query: 'Find study notes', icon: BookOpen, color: '#fbbf24' },
        { label: 'Lost & Found Registry', query: 'Lost & Found Registry', icon: Search, color: '#00f5d4' },
        { label: 'My Complaints Status', query: 'Check status of my complaints', icon: Building2, color: '#ff6b6b' },
        { label: 'DSA Study Notes', query: 'DSA notes', icon: Lightbulb, color: '#a78bfa' },
      ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-neon" />
          <span className="text-xs font-semibold text-neon uppercase tracking-widest">Natural Language Assistant</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          AI Campus <span className="gradient-text">Chatbot</span>
        </h1>
      </motion.div>

      {/* Main Chat Container */}
      <div className="flex-1 glass-card rounded-2xl border border-border flex flex-col overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[85%]">
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-neon/15 border border-neon/30 flex items-center justify-center text-neon shrink-0 mt-1">
                    <Bot size={18} />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-4 leading-relaxed whitespace-pre-wrap text-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-primary to-[#7b61ff] text-white rounded-tr-xs'
                      : 'glass-card bg-secondary/80 border-border text-foreground rounded-tl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Cards inside messages */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-2 border-t border-border/50">
                      {msg.cards.map((card, idx) => (
                        <div
                          key={idx}
                          className="glass-card rounded-xl p-3.5 border-border bg-secondary/40 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold truncate">{card.title}</span>
                            {card.badge && (
                              <span
                                className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                                style={{
                                  background: `${card.badgeColor || '#a78bfa'}20`,
                                  color: card.badgeColor || '#a78bfa',
                                }}
                              >
                                {card.badge}
                              </span>
                            )}
                          </div>
                          {card.subtitle && <p className="text-muted-foreground text-[11px] mb-1">{card.subtitle}</p>}
                          {card.meta && <p className="text-muted-foreground/80 font-mono text-[10px] mb-2">{card.meta}</p>}
                          {card.link && (
                            <a
                              href={card.link}
                              target={card.type === 'resource' ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                            >
                              {card.type === 'resource' ? <Download size={12} /> : <ExternalLink size={12} />}
                              Open
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground/60 mt-1 px-1">{msg.timestamp}</span>
            </motion.div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-3 border-t border-border bg-secondary/30 grid grid-cols-2 md:grid-cols-4 gap-2">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              className="glass-card rounded-xl p-2.5 text-left text-xs hover:border-primary/40 transition-all flex items-center gap-2"
            >
              <item.icon size={15} style={{ color: item.color }} className="shrink-0" />
              <span className="truncate text-muted-foreground hover:text-foreground font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border bg-secondary/50">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about resources, lost & found, complaints, or stats..."
              className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-[#7b61ff] text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50 hover:shadow-lg transition-shadow shrink-0"
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}