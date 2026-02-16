import React from 'react';
import { ChatInterface } from '@/components/Chat/ChatInterface';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Chat with Neo
          </h1>
          <p className="text-muted-foreground">
            Your AI assistant for influencer marketing
          </p>
        </div>
        
        <ChatInterface />
      </div>
    </div>
  );
}
