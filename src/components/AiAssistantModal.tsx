import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Bot, User, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistantModal: React.FC = () => {
  const { aiModalOpen, setAiModalOpen, settings } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am the official AI Shopping Assistant for AKASH STORE. How can I help you find authentic products, check specifications, or understand our payment and delivery terms today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!aiModalOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process that inquiry at the moment. Please try again or reach our team at akashchondroroy@protonmail.com.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Please check your internet or retry shortly.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    `What is your official bKash number?`,
    `Tell me about the Sony WH-1000XM5 headphones`,
    `How does delivery work in Dhaka and outside?`,
    `Do you offer pure Sundarban Honey?`,
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full h-[600px] max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                AKASH STORE AI Assistant
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-800">
                  Grounded
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Headquarters: {settings?.headquarters || 'Sherpur, Bogura'}</p>
            </div>
          </div>
          <button 
            onClick={() => setAiModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-2xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-2xs'
                }`}
              >
                {m.content}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="p-2.5 bg-white border-t border-slate-200 overflow-x-auto flex gap-2 scrollbar-none">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-200 shrink-0 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="Ask about products, specs, bKash, delivery..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
