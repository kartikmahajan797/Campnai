import React from 'react';
import { Bot, CheckCheck, Check } from 'lucide-react';

const cleanBody = (body: string) => {
    if (!body) return '';
    let cleaned = body.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/On .+?(?:wrote:|\nwrote:)[\s\S]*/s, '').trim();
    const lines = cleaned.split('\n');
    const clean: string[] = [];
    for (const line of lines) {
        if (line.trim().startsWith('>')) break;
        clean.push(line);
    }
    return clean.join('\n').trim();
};

const fmtDate = (ts: string) => {
    try {
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return ''; }
};

const fmtTime = (ts: string) => {
    try {
        return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return ''; }
};

interface WhatsAppMockupProps {
    messages: any[];
    influencerName: string;
}

const WhatsAppMockup: React.FC<WhatsAppMockupProps> = ({ messages = [], influencerName }) => {
    const endRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    if (!messages || messages.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#efeae2] text-zinc-500 text-sm italic">
                <div className="bg-[#e1f3fd] text-[#556976] text-[11px] px-3 py-1 rounded-lg shadow-sm">
                    No conversation history to display.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#efeae2] font-sans relative overflow-hidden">
            {/* WhatsApp Header - Light Theme to match modal */}
            <div className="w-full bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 shadow-sm z-10 shrink-0">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 shadow-sm shrink-0">
                    {influencerName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-white truncate leading-tight">{influencerName}</h3>
                    {messages.length > 0 && messages[messages.length - 1].role !== 'outbound' && (
                        <p className="text-[12px] text-green-500 font-medium leading-tight mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> online
                        </p>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div 
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2 relative w-full"
                style={{
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                    backgroundRepeat: 'repeat',
                    backgroundBlendMode: 'overlay',
                    backgroundColor: 'rgba(239, 234, 226, 0.95)'
                }}
            >
                {messages.map((msg, i) => {
                    const isOut = msg.role === 'outbound';
                    const prevMsg = messages[i - 1];
                    const showDate = !prevMsg || fmtDate(msg.timestamp) !== fmtDate(prevMsg.timestamp);

                    return (
                        <div key={i} className="flex flex-col w-full">
                            {showDate && (
                                <div className="flex justify-center my-2 w-full">
                                    <span className="bg-[#e1f3fd] text-[#556976] text-[11px] px-3 py-1 rounded-lg shadow-sm font-medium">
                                        {fmtDate(msg.timestamp)}
                                    </span>
                                </div>
                            )}
                            
                            <div className={`flex w-full mb-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
                                <div className={`relative max-w-[85%] rounded-lg px-3 pt-2 pb-1.5 shadow-sm text-[13.5px] leading-relaxed flex flex-col ${
                                    isOut 
                                    ? 'bg-[#dcf8c6] rounded-tr-none text-[#111111]' 
                                    : 'bg-white rounded-tl-none text-[#111111]'
                                }`}>
                                    
                                    {/* Tail */}
                                    {isOut ? (
                                        <div className="absolute top-0 right-[-6px] w-0 h-0 border-t-[8px] border-t-[#dcf8c6] border-r-[8px] border-r-transparent" />
                                    ) : (
                                        <div className="absolute top-0 left-[-6px] w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
                                    )}

                                    {/* AI Agent Tag */}
                                    {isOut && msg.isAI && (
                                        <div className="flex items-center gap-1 text-[#075e54] font-bold text-[10px] mb-0.5 opacity-90">
                                            <Bot size={11} strokeWidth={2.5} /> AI System
                                        </div>
                                    )}

                                    {/* Body */}
                                    <div className="whitespace-pre-wrap break-words pr-2">
                                        {cleanBody(msg.body)}
                                    </div>
                                    
                                    {/* Timestamp & Read Receipts */}
                                    <div className={`flex items-center justify-end gap-1 mt-0.5 min-w-[50px] self-end`}>
                                        <span className="text-[10px] text-black/40">
                                            {fmtTime(msg.timestamp)}
                                        </span>
                                        {/* Only show ticks if there's a subsequent message in the conversation (indicating they read it and replied) or if we want to show single check vs double check */}
                                        {isOut && (i < messages.length - 1) && <CheckCheck size={14} className="text-[#34b7f1]" />}
                                        {isOut && (i === messages.length - 1) && <Check size={14} className="text-black/30" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={endRef} className="h-1" />
            </div>
            
            {/* Input Mockup */}
            <div className="w-full bg-[#f0f0f0] px-2 py-2 flex items-end gap-2 shrink-0 relative z-10 bottom-0">
                <div className="flex-1 bg-white rounded-2xl px-4 py-2.5 text-[15px] text-zinc-400 m-1 flex items-center">
                     Type a message
                </div>
                <div className="w-11 h-11 mb-0.5 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 shadow-sm cursor-pointer hover:bg-[#008f6f] transition mr-1">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppMockup;
