'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Send, Download, ExternalLink, RotateCcw
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChat } from '@/lib/chat-context';
import { usePathname } from 'next/navigation';

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIChatWidget() {
  const { user } = useAuth();
  const { messages, loading, sendMessage, clearChat } = useChat();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (pathname === '/dashboard/ai-assistant') {
    return null;
  }

  const handleSend = (customQuery?: string) => {
    const textToSend = customQuery || input.trim();
    if (!textToSend || loading) return;
    if (!customQuery) setInput('');
    sendMessage(textToSend);
  };

  const prompts = user?.role === 'admin' 
    ? ['System stats overview', 'Check active complaints', 'Lost & Found Registry', 'Find study notes']
    : ['Find study notes', 'Show all PYQs and papers', 'Lost & Found Registry', 'Check status of my complaints'];

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
        aria-label="Campus AI Assistant"
      >
        {open ? <X size={20} /> : <Bot size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="fixed bottom-22 right-4 md:right-6 z-40 w-[92vw] max-w-[380px] h-[520px] max-h-[80vh] bg-[#12131b] rounded-2xl flex flex-col shadow-2xl border border-[#232634] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#232634] bg-[#161822] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#252838] flex items-center justify-center text-primary">
                  <Bot size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Campus Assistant</h3>
                  <p className="text-[10px] text-muted-foreground">Session saved</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-white transition-colors"
                    title="Clear Chat"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 text-xs bg-[#0e0f14]">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white font-medium'
                        : 'bg-[#181a24] border border-[#262938] text-[#e2e8f0]'
                    }`}
                  >
                    {renderFormattedText(msg.text)}
                  </div>

                  {msg.cards && msg.cards.length > 0 && (
                    <div className="w-full mt-2 space-y-1.5">
                      {msg.cards.map((card, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg p-2.5 border border-[#282c3c] bg-[#151720]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-xs text-white truncate">{card.title}</h4>
                            {card.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#232634] text-muted-foreground shrink-0">
                                {card.badge}
                              </span>
                            )}
                          </div>
                          {card.subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>}
                          {card.link && (
                            <a
                              href={card.link}
                              target={card.type === 'resource' ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline mt-1.5"
                            >
                              {card.type === 'resource' ? <Download size={12} /> : <ExternalLink size={12} />}
                              <span>{card.type === 'resource' ? 'Download PDF' : 'View Details'}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-muted-foreground/60 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs p-1">
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length < 4 && (
              <div className="px-3 py-2 border-t border-[#1f2230] bg-[#14161f] overflow-x-auto flex gap-1.5 shrink-0">
                {prompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p)}
                    className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-md bg-[#1d1f2b] border border-[#2b2e40] text-muted-foreground hover:text-white transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-[#232634] bg-[#161822] shrink-0">
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
                  placeholder="Ask assistant..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0e0f14] border border-[#262938] text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}