import React, { useState } from "react";
import { Upload, Mic, Plus } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import Chat from "../components/Chat";

type Mode = "landing" | "chat";

const Dashboard = () => {
  const [mode, setMode] = useState<Mode>("landing");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setInitialPrompt(inputValue);
    setMode("chat"); // 🔥 switch UI to chat
    setInputValue("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File uploaded:", file.name);
    }
  };

  return (
    <DashboardLayout>
      {mode === "landing" ? (
        /* 🔵 LANDING UI */
        <div className="flex-1 flex items-center justify-center p-6 h-full">
          <div className="w-full max-w-3xl">
            {/* Welcome Message */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-3">
                Upload your brief and
              </h1>
              <h1 className="text-4xl font-bold text-white mb-2">
                see the magic <span>✨</span>
              </h1>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl px-6 py-4 flex items-center gap-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Plus className="text-slate-400 hover:text-white" size={20} />
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Upload brief or ask anything..."
                  className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
                />

                <div className="flex items-center gap-3">
                  <button type="button" className="text-slate-400">
                    <Mic size={20} />
                  </button>

                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center"
                  >
                    <Upload className="text-slate-900" size={18} />
                  </button>
                </div>
              </div>
            </form>

            {/* Info Text */}
            <p className="text-center text-slate-500 text-sm mt-8">
              Upload your campaign brief or start a conversation to unlock
              AI-powered influencer marketing
            </p>
          </div>
        </div>
      ) : (
        /* 🟢 CHAT UI */
        <Chat initialMessage={initialPrompt} />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
