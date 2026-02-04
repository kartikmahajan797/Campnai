import { useState, useRef, useEffect } from "react";
import { askChat } from "../api/chat";

type Message = {
  role: "user" | "bot";
  text: string;
};

type ChatProps = {
  initialMessage?: string;
};

export default function Chat({ initialMessage }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessage ? [{ role: "user", text: initialMessage }] : [],
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-send the first message when chat loads
  useEffect(() => {
    if (!initialMessage) return;
    sendMessage(initialMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { role: "user", text };
    const botMsg: Message = { role: "bot", text: "" };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setIsTyping(true);

    try {
      await askChat(text, (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].text += token;
          return updated;
        });
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}

        {isTyping && <div className="typing-indicator">Typing…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="input-box">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about influencer marketing..."
          disabled={isTyping}
        />
        <button onClick={handleSend} disabled={isTyping}>
          Send
        </button>
      </div>
    </div>
  );
}
