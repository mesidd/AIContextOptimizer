'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, CornerDownLeft, HelpCircle, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Assuming this is from shadcn/ui
import ReactMarkdown from 'react-markdown';

// --- INTERFACE DEFINITION ---
interface Message {
  role: "user" | "model";
  content: string;
}

// --- CUSTOM TYPEWRITER HOOK ---
const useTypewriter = (text: string, speed = 25) => {
  const [displayText, setDisplayText] = useState('');
  useEffect(() => {
    setDisplayText('');
    if (text) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(prev => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, speed);
      return () => clearInterval(typingInterval);
    }
  }, [text, speed]);
  return displayText;
};

// --- CHAT MESSAGE COMPONENT ---
const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  const animatedContent = isUser ? message.content : useTypewriter(message.content);

  return (
    <div className={`flex items-start gap-4 w-full ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg">
          <Bot size={20} className="text-violet-300" />
        </div>
      )}
      <div
        className={`max-w-[75%] p-3 rounded-2xl shadow-lg break-words transition-all duration-300 ${ // Padding reduced to p-3
          isUser 
            ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white' 
            : 'bg-gray-800 text-gray-200'
        }`}
      >
        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2">
          <ReactMarkdown>{animatedContent}</ReactMarkdown>
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-600 shadow-lg">
          <User size={20} className="text-white" />
        </div>
      )}
    </div>
  );
};

// --- LOADING INDICATOR ---
const LoadingIndicator = () => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg">
            <Bot size={20} className="text-violet-300" />
        </div>
        <div className="max-w-[75%] p-3 rounded-2xl bg-gray-800 text-gray-200 shadow-lg"> {/* Padding reduced to p-3 */}
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse delay-0"></span>
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse delay-150"></span>
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse delay-300"></span>
            </div>
        </div>
    </div>
);

// --- MAIN PAGE COMPONENT ---
export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [contextEnabled, setContextEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- FastAPI Call (Original Logic) ---
  const sendMessage = async () => {
    if (!input.trim()) return;
    setIsLoading(true);

    const userMessage = input;
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    try {
      const res = await fetch('http://127.0.0.1:8000/generate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: contextEnabled
            ? messages.concat({ role: "user", content: userMessage })
            : [{ role: "user", content: userMessage }]
        })
      });

      if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", content: data.generated_text || "An unexpected error occurred." }]);
    } catch (err) {
      console.error("API Error:", err);
      setMessages(prev => [...prev, { role: "model", content: "Error: I couldn't connect to the backend. Please ensure it's running." }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-screen fixed w-full bg-gradient-to-br from-gray-900 to-black text-white font-sans flex flex-col items-center">
      <div className="flex flex-col w-full max-w-3xl h-screen">

        {/* Header */}
        <header className="text-center py-4 border-b border-gray-800/50">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">
            AI Context Optimizer
          </h1>
          <p className="text-lg text-gray-400 mt-1">
            Experience the Power of Context
          </p>
        </header>

        {/* Controls */}
        <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-800/50">
            <label htmlFor="context-toggle" className="flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-white">Context Mode (Memory)</span>
                <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${contextEnabled ? 'bg-violet-600' : 'bg-gray-700'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${contextEnabled ? 'translate-x-6' : ''}`} />
                </div>
            </label>
            <input 
                id="context-toggle" 
                type="checkbox" 
                className="hidden" 
                checked={!!contextEnabled} 
                onChange={() => setContextEnabled(!contextEnabled)} 
            />
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <HelpCircle size={14} />
            {contextEnabled
              ? "ON: The AI remembers the conversation."
              : "OFF: The AI forgets after every message."}
          </p>
        </div>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-300 p-8 bg-gray-800/30 rounded-lg">
              <Sparkles className="w-12 h-12 text-violet-500 mb-4" />
              <p className="text-lg font-semibold mb-2">Start the Demonstration</p>
              <p className="mt-4 font-semibold text-xl text-white">Test it with Context Mode ON and OFF!</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={chatEndRef} />
        </main>

        {/* Input Area */}
        <footer 
          className="bg-gray-900/50 border-t border-gray-800/50 px-4 py-3 backdrop-blur-sm"
          onMouseEnter={() => inputRef.current?.focus()} // Auto-focus on mouse enter
        >
          <div className="flex gap-3 items-center">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            {/* Assuming Button component from shadcn/ui */}
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="lg"
              className="p-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform active:scale-95"
            >
              <CornerDownLeft size={20} />
            </Button>
          </div>
        </footer>

      </div>
    </div>
  );
}

