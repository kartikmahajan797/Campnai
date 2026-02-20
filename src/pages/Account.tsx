import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/useAuth';
import { User, Mail, Shield, CreditCard, Settings, Camera } from 'lucide-react';

const Account = () => {
    const { user } = useAuth();

    return (
        <DashboardLayout title="Account Settings">
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">My Account</h1>
                    <p className="text-muted-foreground">Manage your profile and subscription settings.</p>
                </div>

                {/* Profile Card */}
                <div className="glass-card p-8 relative overflow-hidden group">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 p-[2px] shadow-xl shadow-primary/20">
                                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden relative group/avatar cursor-pointer">
                                    {user?.photoURL ? (
                                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-3xl font-bold text-primary">
                                            {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 space-y-6 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <User size={14} /> Full Name
                                    </label>
                                    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium backdrop-blur-sm">
                                        {user?.displayName || 'Not items set'}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Mail size={14} /> Email Address
                                    </label>
                                    <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium backdrop-blur-sm">
                                        {user?.email}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Current Plan</h3>
                                <p className="text-xs text-muted-foreground">Your subscription details</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 border border-blue-500/20">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-blue-400">Pro Plan</span>
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">Active</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Renews on Mar 20, 2026</p>
                        </div>

                        <button className="w-full py-2.5 rounded-xl border border-border bg-transparent hover:bg-white/5 transition text-sm font-medium">
                            Manage Subscription
                        </button>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Payment Method</h3>
                                <p className="text-xs text-muted-foreground">Manage your billing</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold">VISA</div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">•••• 4242</p>
                                <p className="text-[10px] text-muted-foreground">Expires 12/28</p>
                            </div>
                        </div>

                        <button className="w-full py-2.5 rounded-xl border border-border bg-transparent hover:bg-white/5 transition text-sm font-medium">
                            Update Payment Method
                        </button>
                    </div>
                </div>

                {/* Preferences */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Settings size={18} /> App Preferences
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10 group cursor-pointer">
                            <div>
                                <p className="font-medium text-foreground">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive updates about your campaigns</p>
                            </div>
                            <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                                <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10 group cursor-pointer">
                            <div>
                                <p className="font-medium text-foreground">Usage Reports</p>
                                <p className="text-sm text-muted-foreground">Weekly summaries of your AI usage</p>
                            </div>
                            <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                                <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};

export default Account;
