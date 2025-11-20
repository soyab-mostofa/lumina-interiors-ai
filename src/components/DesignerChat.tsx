"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Sparkles, Loader2 } from "lucide-react";
import type { ChatMessage, RoomAnalysis } from "~/types";
import { api } from "~/lib/trpc/client";
import { compressBase64 } from "~/lib/utils";

interface DesignerChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageBase64: string; // We send the current "After" image context
  originalImageBase64: string; // We send the "Before" image context for memory
  analysis: RoomAnalysis | null;
  roomContext: "Residential" | "Commercial";
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
  setMessages,
}) => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC mutation for chat
  const chatMutation = api.roomAnalysis.chatRefine.useMutation();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input;
    setInput("");

    // Add User Message
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: userText,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      // Compress images before sending
      const compressedCurrent = await compressBase64(currentImageBase64);
      const compressedOriginal = await compressBase64(originalImageBase64);

      // Call tRPC endpoint
      const response = await chatMutation.mutateAsync({
        history: [...messages, newUserMsg],
        currentImageBase64: compressedCurrent,
        originalImageBase64: compressedOriginal,
        analysis,
        userMessage: userText,
        roomContext,
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.text,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If AI suggests a visual change
      if (response.newGenerationPrompt) {
        const sysMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "ai",
          text: "I'm applying those specific adjustments now...",
          isSystemMessage: true,
        };
        setMessages((prev) => [...prev, sysMsg]);
        onTriggerRedesign(response.newGenerationPrompt);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          text: "I'm sorry, I had trouble processing that request.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="animate-scale-in fixed bottom-6 left-6 z-50 flex w-full max-w-[360px] flex-col shadow-2xl md:max-w-[400px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-800 bg-slate-900 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white">
              <Sparkles size={20} />
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500"></div>
          </div>
          <div>
            <h3 className="text-sm font-bold">Lumina Designer</h3>
            <p className="text-xs text-slate-400">
              Online • {roomContext}{" "}
              {analysis?.roomType ? `(${analysis.roomType})` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 transition-colors hover:bg-slate-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="h-[400px] flex-grow space-y-4 overflow-y-auto border-x border-white/20 bg-white/95 p-4 backdrop-blur-xl">
        {messages.length === 0 && (
          <div className="mt-8 px-6 text-center text-sm text-slate-400">
            <p>👋 Hi! I'm Lumina.</p>
            <p className="mt-2">
              I can help you refine this {roomContext.toLowerCase()} space.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Try specific commands:
            </p>
            <ul className="mt-3 space-y-2 cursor-pointer text-xs font-semibold text-indigo-600">
              <li
                className="rounded-lg bg-indigo-50 px-3 py-2 transition-colors hover:bg-indigo-100"
                onClick={() =>
                  setInput("Change only the wall color to sage green.")
                }
              >
                "Change only the wall color to sage green."
              </li>
              <li
                className="rounded-lg bg-indigo-50 px-3 py-2 transition-colors hover:bg-indigo-100"
                onClick={() => setInput("Restore the original floor.")}
              >
                "Restore the original floor."
              </li>
            </ul>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.isSystemMessage ? (
              <div className="mx-auto flex animate-pulse items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                <Loader2 size={10} className="animate-spin" /> {msg.text}
              </div>
            ) : (
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "rounded-tr-none bg-slate-900 text-white"
                    : "rounded-tl-none border border-slate-100 bg-white text-slate-700"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-none bg-slate-100 px-4 py-3">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></div>
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.1s]"></div>
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="rounded-b-2xl border-t border-slate-100 bg-white p-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-shadow focus-within:ring-2 focus-within:ring-indigo-500">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask for changes or to keep features..."
            className="flex-grow bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
