import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../lib/useAuth';
import { Plus, Search, User, Briefcase, MessageSquare, Menu, X, Upload, Mic, Sparkles, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out');
    }
  };

  const chats = [
    { id: 1, title: 'June 2024 Mamaearth Campaign', date: 'Jun 2024' },
    { id: 2, title: 'Aug 2025 Nike Campaign', date: 'Aug 2025' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      console.log('Submitted:', inputValue);
      // Add your submission logic here
      setInputValue('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file.name);
      // Add your file upload logic here
    }
  };

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getUserDisplayName = () => {
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden`}>
        
        {/* Logo */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <Sparkles className="text-purple-500" size={24} />
          <span className="text-white font-semibold text-lg">CampnAI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setInputValue('')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition"
          >
            <Plus size={18} />
            <span className="text-sm">New chat</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition">
            <Search size={18} />
            <span className="text-sm">Search chats</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition">
            <User size={18} />
            <span className="text-sm">Account</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition">
            <Briefcase size={18} />
            <span className="text-sm">Campaigns</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition">
            <MessageSquare size={18} />
            <span className="text-sm">Influencer Profiles</span>
          </button>

          {/* Chat History */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs text-slate-500 uppercase font-medium">Your chats</span>
            </div>
            
            {chats.map(chat => (
              <button 
                key={chat.id}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition text-sm truncate"
              >
                {chat.title}
              </button>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-3 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                {getUserInitial()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white transition"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">CampnAI</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition"
          >
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
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
      </main>
    </div>
  );
};

export default Dashboard;