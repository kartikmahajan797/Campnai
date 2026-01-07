import React from 'react';
import {
    MessageCircle,
    Mail,
    PauseCircle,
    AlertCircle,
    ChevronRight,
    Settings,
    Activity
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

interface ActivityItem {
    id: number;
    type: string;
    user?: string;
    action: string;
    detail?: string;
    time: string;
    icon: React.ReactNode;
}

const defaultActivities: ActivityItem[] = [
    { id: 1, type: 'whatsapp', user: 'Aditi Kapoor', action: 'WhatsApp sent to', time: '2 seconds ago', icon: <MessageCircle size={14} className="text-green-500" /> },
    { id: 2, type: 'email', user: 'Rahul Verma', action: 'Email delivered to', time: '25 seconds ago', icon: <Mail size={14} className="text-red-500" /> },
    { id: 3, type: 'system', action: 'Agent paused for 90s', detail: 'Rate limit projection enabled', time: '1 minute ago', icon: <PauseCircle size={14} className="text-yellow-500" /> },
    { id: 4, type: 'error', action: 'Instagram DM failed', detail: 'Reason: Message request limit', time: '3 minutes ago', icon: <AlertCircle size={14} className="text-red-500" /> },
];

const AgentActivitySidebar = ({ activities = defaultActivities }: { activities?: ActivityItem[] }) => {
    return (
        <Sidebar side="right" variant="sidebar" collapsible="none" className="border-l border-slate-800 bg-[#0B0D15]">
            <SidebarHeader className="border-b border-slate-800/50 p-4">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-indigo-400" />
                    <h2 className="text-sm font-semibold text-slate-200">Agent Activity</h2>
                </div>
                <p className="text-xs text-slate-500">Live execution log</p>
            </SidebarHeader>

            <SidebarContent className="p-0">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <div className="relative space-y-6 pt-4 px-4 pb-4">
                            {activities.map(activity => (
                                <div key={activity.id} className="relative pl-6 pb-2 last:pb-0 group">
                                    {/* Timeline line */}
                                    <div className="absolute left-[5px] top-2 bottom-0 w-px bg-slate-800 last:hidden group-hover:bg-slate-700 transition-colors"></div>
                                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-[#0B0D15] border border-slate-700 z-10 group-hover:border-indigo-500 transition-colors"></div>

                                    <div className="bg-[#131620] border border-slate-800/50 rounded-lg p-3 hover:border-slate-700 transition-all shadow-sm">
                                        <div className="flex items-start gap-2 mb-1">
                                            <div className="mt-0.5">{activity.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-300 leading-tight">
                                                    {activity.action} <span className="font-medium text-white">{activity.user}</span>
                                                </p>
                                                {activity.detail && <p className="text-xs text-slate-500 mt-1 break-words">{activity.detail}</p>}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-600 pl-6">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-800/50 p-4 bg-[#0B0D15]">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="w-full justify-center bg-slate-800/50 hover:bg-slate-800 text-slate-300 transition-colors h-9 shadow-sm border border-slate-800"
                        >
                            <PauseCircle size={14} />
                            <span>Pause Agent</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="w-full justify-center text-slate-500 hover:text-indigo-400 transition-colors h-9"
                        >
                            <Settings size={14} />
                            <span>Rate Limits</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <div className="text-center mt-2">
                    <span className="text-[10px] text-indigo-500 hover:text-indigo-400 cursor-pointer flex items-center justify-center gap-1 transition-colors">
                        View full execution log <ChevronRight size={10} />
                    </span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
};

export default AgentActivitySidebar;
