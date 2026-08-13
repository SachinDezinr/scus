'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Send, Sparkles, Download, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

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

export default function AIChatWidget() {
  const { user, authFetch } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello! 👋 I'm your **Smart Campus AI Assistant**. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  // Hide floating widget if user is on the dedicated AI Assistant page
  if (pathname === '/dashboard/ai-assistant') {
    return null;
  }

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || input.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customQuery) setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await res.json();

      if (res.ok) {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.reply || 'Here is what I found.',
          cards: data.cards || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: 'Sorry, I encountered an issue while processing your request.',
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
          text: 'Network error. Please check your connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setLoading(false);
  };

  const prompts = user?.role === 'admin' 
    ? ['Show system overview stats', 'Check active complaints', 'Search lost phones', 'Find study materials']
    : ['Search Data Structures notes', 'Find lost black wallet', 'Check status of my complaints', 'Show recently uploaded PYQs'];

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#a78bfa] via-[#00f5d4] to-[#7b61ff] p-0.5 shadow-2xl glow-neon flex items-center justify-center cursor-pointer"
        aria-label="AI Campus Assistant"
      >
        <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center text-[#00f5d4]">
          {open ? <X size={24} /> : <Bot size={26} className="animate-pulse" />}
        </div>
      </motion.button>

      {/* Chat Dialog Drawer / Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 md:right-6 z-40 w-[92vw] max-w-[400px] h-[540px] bg-gradient-to-b from-[#12121a]/98 via-[#161624]/98 to-[#0d0d15]/99 backdrop-blur-2xl rounded-3xl flex flex-col shadow-2xl border border-primary/30 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/80 bg-[#161624]/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a78bfa]/25 to-[#00f5d4]/25 border border-[#00f5d4]/40 flex items-center justify-center text-[#00f5d4]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    Campus AI Assistant
                    <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Ask about notes, lost items, complaints</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#0f0f17]/60">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-primary to-[#7b61ff] text-white rounded-br-xs font-medium'
                        : 'bg-[#181826] border border-border/80 rounded-bl-xs text-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Actionable items/cards */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="w-full mt-2.5 space-y-2">
                      {msg.cards.map((card, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="rounded-xl p-3 border border-border/80 bg-[#1a1a2a] hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-xs truncate flex-1">{card.title}</h4>
                            {card.badge && (
                              <span
                                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                                style={{
                                  background: `${card.badgeColor || '#a78bfa'}25`,
                                  color: card.badgeColor || '#a78bfa',
                                }}
                              >
                                {card.badge}
                              </span>
                            )}
                          </div>
                          {card.subtitle && <p className="text-[11px] text-muted-foreground mb-1">{card.subtitle}</p>}
                          {card.meta && <p className="text-[10px] text-muted-foreground/80 font-mono mb-2">{card.meta}</p>}

                          {card.link && (
                            <a
                              href={card.link}
                              target={card.type === 'resource' ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline mt-1"
                            >
                              {card.type === 'resource' ? <Download size={12} /> : <ExternalLink size={12} />}
                              {card.type === 'resource' ? 'Download PDF' : 'View Details'}
                            </a>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-muted-foreground/60 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </motion.div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Searching campus database...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length < 5 && (
              <div className="px-3 py-2 border-t border-border/60 bg-[#141420] overflow-x-auto flex gap-1.5 shrink-0 no-scrollbar">
                {prompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p)}
                    className="text-[10px] whitespace-nowrap px-2.5 py-1.5 rounded-full bg-[#1e1e30] border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all shrink-0"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input field */}
            <div className="p-3 border-t border-border/80 bg-[#161624] shrink-0">
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
                  placeholder="Ask AI anything..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0e0e16] border border-border/80 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}