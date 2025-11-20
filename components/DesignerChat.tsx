import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Sparkles, Loader2, User } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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

  return (
    <div className="fixed bottom-6 left-6 z-50 w-full max-w-[360px] md:max-w-[400px] flex flex-col shadow-2xl animate-scale-in">
      {/* Chat Header */}
      <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                <Sparkles size={20} />
             </div>
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
           </div>
           <div>
             <h3 className="font-bold text-sm">Lumina Designer</h3>
             <p className="text-xs text-slate-400">Online • {roomContext} {analysis?.roomType ? `(${analysis.roomType})` : ''}</p>
           </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-grow bg-white/95 backdrop-blur-xl h-[400px] overflow-y-auto p-4 space-y-4 border-x border-white/20">
        {messages.length === 0 && (
           <div className="text-center text-slate-400 text-sm mt-8 px-6">
              <p>👋 Hi! I'm Lumina.</p>
              <p className="mt-2">I can help you refine this {roomContext.toLowerCase()} space.</p>
              <p className="mt-2 text-xs text-slate-400">Try specific commands:</p>
              <ul className="mt-3 space-y-2 text-indigo-600 text-xs font-semibold cursor-pointer">
                <li className="bg-indigo-50 py-2 px-3 rounded-lg hover:bg-indigo-100 transition-colors" onClick={() => setInput("Change only the wall color to sage green.")}>"Change only the wall color to sage green."</li>
                <li className="bg-indigo-50 py-2 px-3 rounded-lg hover:bg-indigo-100 transition-colors" onClick={() => setInput("Restore the original floor.")}>"Restore the original floor."</li>
              </ul>
           </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.isSystemMessage ? (
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mx-auto animate-pulse">
                   <Loader2 size={10} className="animate-spin" /> {msg.text}
                </div>
             ) : (
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
             )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-slate-100 rounded-b-2xl">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for changes or to keep features..."
            className="flex-grow bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};