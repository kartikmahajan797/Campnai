import React, { useState } from 'react';
import { X, MessageCircle, Mail, Send, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface OutreachReviewModalProps {
  influencer: any;
  onClose: () => void;
  onSend: (channels: string[], messages: { whatsapp: string; email: string }) => void;
}

const OutreachReviewModal = ({ influencer, onClose, onSend }: OutreachReviewModalProps) => {
  const [whatsappMessage, setWhatsappMessage] = useState(`Hi ${influencer.name.split(' ')[0]},\n\nWe loved your content on ${influencer.niche} and wanted to discuss a potential collaboration with our brand.\n\nLet me know if you are interested! 🚀\nThanks!`);
  
  const [emailSubject, setEmailSubject] = useState(`Collab: ${influencer.name} x [Brand Name]`);
  const [emailBody, setEmailBody] = useState(`Hi ${influencer.name.split(' ')[0]},\n\nThis is [Your Name] from [Brand Name], and we'd love to discuss a potential partnership with you for our upcoming campaign.\n\nPlease let me know a good time to connect or share your commercials.\n\nBest,\n[Your Name]`);

  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  const handleSend = () => {
    const channels = [];
    if (sendWhatsapp) channels.push('whatsapp');
    if (sendEmail) channels.push('email');
    
    onSend(channels, {
        whatsapp: whatsappMessage,
        email: `${emailSubject}\n\n${emailBody}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Review Your Outreach
            </h2>
            <p className="text-sm text-muted-foreground">Customize messages before sending to <span className="font-semibold text-foreground">{influencer.name}</span>.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            
            {/* WhatsApp Column */}
            <div className={`flex flex-col h-full rounded-xl border-2 transition-all duration-200 ${sendWhatsapp ? 'border-green-500/20 bg-white dark:bg-zinc-900 shadow-sm' : 'border-transparent bg-muted/50 opacity-60'}`}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${sendWhatsapp ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-muted text-muted-foreground'}`}>
                            <MessageCircle size={18} />
                        </div>
                        <span className="font-semibold text-sm">WhatsApp</span>
                    </div>
                    <Checkbox 
                        checked={sendWhatsapp} 
                        onCheckedChange={(checked) => setSendWhatsapp(checked as boolean)}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                </div>
                
                <div className="p-4 flex-1 flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</label>
                    <Textarea 
                        value={whatsappMessage}
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                        className="flex-1 min-h-[200px] resize-none border-0 bg-muted/20 focus-visible:ring-0 focus-visible:bg-transparent p-3 text-sm leading-relaxed"
                        placeholder="Type your WhatsApp message..."
                        disabled={!sendWhatsapp}
                    />
                    <div className="flex justify-end">
                        <span className="text-xs text-muted-foreground">{whatsappMessage.length} chars</span>
                    </div>
                </div>
            </div>

            {/* Email Column */}
            <div className={`flex flex-col h-full rounded-xl border-2 transition-all duration-200 ${sendEmail ? 'border-blue-500/20 bg-white dark:bg-zinc-900 shadow-sm' : 'border-transparent bg-muted/50 opacity-60'}`}>
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className={`p-2 rounded-lg ${sendEmail ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-muted text-muted-foreground'}`}>
                            <Mail size={18} />
                        </div>
                        <span className="font-semibold text-sm">Email</span>
                    </div>
                    <Checkbox 
                        checked={sendEmail} 
                        onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                </div>

                <div className="p-4 flex-1 flex flex-col gap-4">
                     <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</label>
                        <input
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full bg-muted/20 border-b border-border px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="Email Subject"
                            disabled={!sendEmail}
                        />
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Body</label>
                        <Textarea 
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="flex-1 min-h-[200px] resize-none border-0 bg-muted/20 focus-visible:ring-0 focus-visible:bg-transparent p-3 text-sm leading-relaxed"
                            placeholder="Type your Email body..."
                            disabled={!sendEmail}
                        />
                    </div>
                </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex justify-between items-center">
            <div className="flex items-center gap-4">
               {/* Rate Limit Dropdown Mock */}
               <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border/50 rounded-lg px-3 py-1.5 bg-muted/20">
                  <span>Rate limit</span>
                  <span className="font-medium text-foreground">Send 5 messages / minute</span>
                  <ChevronRight className="rotate-90 w-3 h-3 opacity-50" />
               </div>
               
               <button className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                  Save as Template
               </button>
            </div>
            
            <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="border-border">Cancel</Button>
                <Button 
                    onClick={handleSend} 
                    disabled={!sendWhatsapp && !sendEmail}
                    className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 min-w-[140px] rounded-lg"
                >
                    Send Outreach <ChevronRight size={16} className="ml-2" />
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OutreachReviewModal;
