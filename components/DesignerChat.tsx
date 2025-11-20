import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Sparkles, Loader2, User, Minimize2, Maximize2 } from 'lucide-react';
import { ChatMessage, RoomAnalysis } from '../types';
import { getDesignerChatResponse } from '../services/geminiService';

interface DesignerChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageBase64: string; // We send the current "After" image context
  originalImageBase64: string; // We send the "Before" image context for memory
  analysis: RoomAnalysis | null;
  roomContext: 'Residential' | 'Commercial';
  onTriggerRedesign: (prompt: string) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const DesignerChat: React.FC<DesignerChatProps> = ({ 
  isOpen, 
  onClose, 
  currentImageBase64, 
  originalImageBase64,
  analysis,
  roomContext,
  onTriggerRedesign,
  messages,
  setMessages
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_CHAR_COUNT = 500;

  // Quick action suggestions
  const quickActions = [
    { icon: '🎨', text: 'Change wall color', prompt: 'Change only the wall color to a warm, neutral tone' },
    { icon: '🪴', text: 'Add plants', prompt: 'Add some indoor plants to bring life to the space' },
    { icon: '💡', text: 'Better lighting', prompt: 'Improve the lighting to make the space brighter' },
    { icon: '🪑', text: 'Update furniture', prompt: 'Update the furniture to a more modern style' },
  ];

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input;
    setInput('');
    
    // Add User Message
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText
    };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      // Call Gemini with full context including roomContext
      const response = await getDesignerChatResponse(
        [...messages, newUserMsg], 
        currentImageBase64, 
        originalImageBase64,
        analysis,
        userText,
        roomContext
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: response.text
      };
      setMessages(prev => [...prev, aiMsg]);

      // If AI suggests a visual change
      if (response.newGenerationPrompt) {
         const sysMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'ai',
            text: "I'm applying those specific adjustments now...",
            isSystemMessage: true
         };
         setMessages(prev => [...prev, sysMsg]);
         onTriggerRedesign(response.newGenerationPrompt);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: "I'm sorry, I had trouble processing that request."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  const remainingChars = MAX_CHAR_COUNT - input.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div className={`fixed bottom-6 left-6 z-50 w-full max-w-[360px] md:max-w-[400px] flex flex-col shadow-2xl transition-all duration-300 ${isMinimized ? 'animate-slide-down' : 'animate-slide-up'}`}>
      {/* Chat Header */}
      <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white shadow-sm border border-slate-600">
                <Sparkles size={20} />
             </div>
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
           </div>
           <div>
             <h3 className="font-bold text-sm">Lumina Designer</h3>
             <p className="text-xs text-slate-300">
               {isTyping ? 'Thinking...' : `Online • ${roomContext}${analysis?.roomType ? ` (${analysis.roomType})` : ''}`}
             </p>
           </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors" title="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <div className="flex-grow bg-gradient-to-b from-white to-slate-50/50 backdrop-blur-xl h-[450px] overflow-y-auto p-4 space-y-4 border-x border-slate-200 custom-scrollbar">
          {messages.length === 0 && (
             <div className="text-center text-slate-500 text-sm mt-8 px-6 space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4 border-2 border-slate-200">
                  <Sparkles size={32} className="text-slate-700" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">👋 Hi! I'm Lumina</p>
                  <p className="mt-2 text-slate-600">I can help you refine this {roomContext.toLowerCase()} space with specific changes.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(action.prompt)}
                        className="bg-white border border-slate-200 hover:border-slate-900 hover:bg-slate-50 rounded-xl p-3 text-left transition-all group shadow-sm hover:shadow-md"
                      >
                        <div className="text-2xl mb-1">{action.icon}</div>
                        <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{action.text}</div>
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
               {msg.isSystemMessage ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-full mx-auto shadow-sm border border-slate-200">
                     <Loader2 size={12} className="animate-spin" /> {msg.text}
                  </div>
               ) : (
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all hover:shadow-md ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
               )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      {!isMinimized && (
        <div className="bg-white p-3 border-t border-slate-200 rounded-b-2xl">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-slate-900 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHAR_COUNT) {
                  setInput(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe your changes... (Shift+Enter for new line)"
              className="flex-grow bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 resize-none min-h-[24px] max-h-[120px]"
              disabled={isTyping}
              rows={1}
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              {input.length > 0 && (
                <span className={`text-xs font-medium transition-colors ${isNearLimit ? 'text-amber-600' : 'text-slate-500'}`}>
                  {remainingChars}
                </span>
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || input.length > MAX_CHAR_COUNT}
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md active:scale-95"
                title="Send message (Enter)"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 px-2">
            <p className="text-xs text-slate-500">
              Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono border border-slate-300">Enter</kbd> to send
            </p>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};