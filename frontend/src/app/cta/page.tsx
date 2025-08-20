'use client'
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async () => {

    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");

    const res = await fetch('http://127.0.0.1:8000/generate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.concat({ role: "user", content: userMessage }),
      })
    })

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "model", content: data.generated_text || "Error" }]);
  };


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col max-w-md w-full mx-auto min-h-screen p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
        Chat with AI
      </h1>

      <div className="flex-1 border rounded p-2 mb-4 overflow-y-auto h-[60vh] flex flex-col gap-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg max-w-[80%] ${msg.role === "user"
                ? "bg-blue-500 text-white self-end"
                : "bg-gray-200 text-black self-start"
              }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 p-2 border rounded"
          onMouseEnter={() => inputRef.current?.focus()}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
