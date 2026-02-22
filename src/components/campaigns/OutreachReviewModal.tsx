import React, { useState, useEffect } from 'react';
import { X, Mail, ChevronRight, IndianRupee, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface OutreachReviewModalProps {
    influencer: any;
    campaign: any;
    userDisplayName?: string;
    onClose: () => void;
    onSend: (channels: string[], messages: { whatsapp: string; email: string }, budget: { min: number; max: number }) => void;
}

function fmtIN(val: number): string {
    if (!val || isNaN(val)) return '';
    return val.toLocaleString('en-IN');
}

function applyIndianCommas(raw: string): string {
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('en-IN');
}

function parseInput(raw: string): number {
    const n = parseFloat(raw.replace(/[₹,\s]/g, ''));
    return isNaN(n) ? 0 : Math.max(0, n);
}

const OutreachReviewModal = ({ influencer, campaign, userDisplayName, onClose, onSend }: OutreachReviewModalProps) => {
    const brandName   = campaign?.name || campaign?.analysisResult?.brand_name || 'Our Brand';
    const managerName = userDisplayName || 'Campaign Manager';
    const firstName   = influencer.name.split(' ')[0];

    const [emailSubject, setEmailSubject] = useState(
        `Collab: ${influencer.name} x ${brandName}`
    );
    const [emailBody, setEmailBody] = useState(
        `Hi ${firstName},\n\nThis is ${managerName} from ${brandName}, and we'd love to discuss a potential partnership with you for our upcoming campaign.\n\nPlease let me know a good time to connect or share your commercials.\n\nBest,\n${managerName}\n${brandName}`
    );

    const [minBudget, setMinBudget] = useState<string>(fmtIN(10000));
    const [maxBudget, setMaxBudget] = useState<string>(fmtIN(50000));
    const [sending, setSending]     = useState(false);

    const handleSend = async () => {
        setSending(true);
        await onSend(
            ['email'],
            { whatsapp: '', email: `${emailSubject}\n\n${emailBody}` },
            { min: parseInput(minBudget), max: parseInput(maxBudget) }
        );
        setSending(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Review Your Outreach</h2>
                        <p className="text-sm text-muted-foreground">
                            Customize message before sending to{' '}
                            <span className="font-semibold text-foreground">{influencer.name}</span>.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Budget Row */}
                <div className="px-6 py-3 border-b border-border bg-muted/20 flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <IndianRupee size={14} className="text-muted-foreground" />
                        <span>Negotiation Budget</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Min (₹)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={minBudget}
                                onChange={e => setMinBudget(applyIndianCommas(e.target.value))}
                                onBlur={() => setMinBudget(fmtIN(parseInput(minBudget)))}
                                className="w-32 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                placeholder="10,000"
                            />
                        </div>
                        <span className="text-muted-foreground mt-4">→</span>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Max (₹)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={maxBudget}
                                onChange={e => setMaxBudget(applyIndianCommas(e.target.value))}
                                onBlur={() => setMaxBudget(fmtIN(parseInput(maxBudget)))}
                                className="w-32 bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                                placeholder="50,000"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-auto">AI will negotiate within this range automatically</p>
                </div>

                {/* Email Panel — full width, centered */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
                    <div className="rounded-xl border-2 border-blue-500/20 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
                        {/* Panel header */}
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                    <Mail size={18} />
                                </div>
                                <span className="font-semibold text-sm">Email</span>
                            </div>
                            {/* WhatsApp badge */}
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-full">
                                <Wrench size={10} /> WhatsApp coming soon
                            </span>
                        </div>

                        {/* Subject & Body */}
                        <div className="p-4 flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                    className="w-full bg-muted/20 border-b border-border px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Email Subject"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Body</label>
                                <Textarea
                                    value={emailBody}
                                    onChange={e => setEmailBody(e.target.value)}
                                    className="min-h-[220px] resize-none border-0 bg-muted/20 focus-visible:ring-0 focus-visible:bg-transparent p-3 text-sm leading-relaxed"
                                    placeholder="Type your email body..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-card flex justify-end items-center gap-3">
                    <Button variant="outline" onClick={onClose} className="border-border" disabled={sending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sending}
                        className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 min-w-[140px] rounded-lg"
                    >
                        {sending ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Send Outreach <ChevronRight size={16} />
                            </span>
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default OutreachReviewModal;
