import React, { useState } from 'react';
import { Upload, Mic, Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const Dashboard = () => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      setIsLoading(true);
      setResponse('');

      try {
        const response = await fetch('http://localhost:3001/api/influencer-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: inputValue }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        setResponse(data.response);
      } catch (error) {
        console.error('Error:', error);
        setResponse('Sorry, I encountered an error while processing your request. Please try again.');
      } finally {
        setIsLoading(false);
      }

      setInputValue('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file.name);
      // Add your file upload logic here
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex items-center justify-center p-6 h-full">
        <div className="w-full max-w-3xl">

          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">
              Upload your brief and
            </h1>
            <h1 className="text-4xl font-bold text-white mb-2">
              see the magic <span className="inline-block">✨</span>
            </h1>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl px-6 py-4 flex items-center gap-4 hover:bg-slate-800/70 transition">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Plus className="text-slate-400 hover:text-white transition" size={20} />
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </label>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Upload brief or ask anything..."
                className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-base"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-slate-400 hover:text-white transition"
                  aria-label="Voice input"
                >
                  <Mic size={20} />
                </button>

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Submit"
                >
                  <Upload className="text-slate-900" size={18} />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setInputValue('Create a new campaign for ')}
                className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition border border-slate-700"
              >
                📊 Create Campaign
              </button>
              <button
                type="button"
                onClick={() => setInputValue('Find influencers for ')}
                className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition border border-slate-700"
              >
                🎯 Find Influencers
              </button>
              <button
                type="button"
                onClick={() => setInputValue('Show me analytics for ')}
                className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition border border-slate-700"
              >
                📈 View Analytics
              </button>
            </div>
          </form>

          {/* Info Text */}
          <p className="text-center text-slate-500 text-sm mt-8">
            Upload your campaign brief or start a conversation to unlock AI-powered influencer marketing
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;