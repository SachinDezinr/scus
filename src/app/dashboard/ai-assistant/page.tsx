'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Send, Bot, Search, BookOpen,
  Building2, Shield, Download, ExternalLink, FileText, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';

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
  const { user } = useAuth();
  const { messages, loading, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (queryText?: string) => {
    const text = queryText || input.trim();
    if (!text || loading) return;
    if (!queryText) setInput('');
    sendMessage(text);
  };

  const suggestions = user?.role === 'admin'
    ? [
        { label: 'Admin Stats', query: 'Show system overview stats', icon: Shield, color: '#ff6b6b' },
        { label: 'Complaints', query: 'Check pending complaints', icon: Building2, color: '#fbbf24' },
        { label: 'Lost & Found', query: 'Lost & Found Registry', icon: Search, color: '#00f5d4' },
        { label: 'Study Resources', query: 'Find study notes', icon: BookOpen, color: '#a78bfa' },
      ]
    : [
        { label: 'Study Notes', query: 'Find study notes', icon: BookOpen, color: '#fbbf24' },
        { label: 'Exam PYQs', query: 'Show all PYQs and papers', icon: FileText, color: '#a78bfa' },
        { label: 'Lost & Found', query: 'Lost & Found Registry', icon: Search, color: '#00f5d4' },
        { label: 'My Complaints', query: 'Check status of my complaints', icon: Building2, color: '#ff6b6b' },
      ];

  return (
    <div className="w-full space-y-4 flex-1 flex flex-col h-[calc(100dvh-5.5rem)] lg:h-[calc(100dvh-4.5rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-neon" />
            <span className="text-[11px] font-semibold text-neon uppercase tracking-widest">Natural Language Assistant</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            AI Campus <span className="gradient-text">Chatbot</span>
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">Ask about study resources, lost items, infrastructure complaints, or administrative stats.</p>
        </div>
        {messages.length > 1 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card text-xs font-semibold text-muted-foreground hover:text-white transition-colors shrink-0"
            title="Start new conversation"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </motion.div>

      {/* Main Chat Container */}
      <div className="flex-1 min-h-0 glass-card rounded-2xl border border-border flex flex-col overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 min-h-0 p-3.5 sm:p-5 overflow-y-auto space-y-3.5">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[95%] sm:max-w-[85%]">
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-neon/15 border border-neon/30 flex items-center justify-center text-neon shrink-0 mt-0.5">
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-3 sm:p-4 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-primary to-[#7b61ff] text-white rounded-tr-xs'
                      : 'glass-card bg-secondary/80 border-border text-foreground rounded-tl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Cards inside messages */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-2 border-t border-border/50">
                      {msg.cards.map((card, idx) => (
                        <div
                          key={idx}
                          className="glass-card rounded-xl p-2.5 sm:p-3 border-border bg-secondary/40 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold truncate text-white">{card.title}</span>
                            {card.badge && (
                              <span
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
                                style={{
                                  background: `${card.badgeColor || '#a78bfa'}20`,
                                  color: card.badgeColor || '#a78bfa',
                                }}
                              >
                                {card.badge}
                              </span>
                            )}
                          </div>
                          {card.subtitle && <p className="text-muted-foreground text-[11px] mb-1 truncate">{card.subtitle}</p>}
                          {card.meta && <p className="text-muted-foreground/80 font-mono text-[10px] mb-1.5">{card.meta}</p>}
                          {card.link && (
                            <a
                              href={card.link}
                              target={card.type === 'resource' ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline text-[11px]"
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
              <span className="text-[9px] text-muted-foreground/60 mt-0.5 px-1">{msg.timestamp}</span>
            </motion.div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>AI is searching...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-2 sm:p-3 border-t border-border bg-secondary/30 grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 shrink-0">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              className="glass-card rounded-xl p-2 sm:p-2.5 text-left text-[11px] sm:text-xs hover:border-primary/40 transition-all flex items-center gap-1.5"
            >
              <item.icon size={13} style={{ color: item.color }} className="shrink-0" />
              <span className="truncate text-muted-foreground hover:text-white font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="p-2 sm:p-3 border-t border-border bg-secondary/50 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask for notes, PYQs, lost items, or issues..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-all duration-150"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary to-[#7b61ff] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 disabled:opacity-50 hover:shadow-lg transition-all duration-150 shrink-0"
            >
              <span>Send</span>
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}