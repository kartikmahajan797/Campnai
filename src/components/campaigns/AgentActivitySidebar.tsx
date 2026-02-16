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
        <Sidebar side="right" variant="sidebar" collapsible="none" className="border-l border-border bg-card">
            <SidebarHeader className="border-b border-border/50 p-4">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Agent Activity</h2>
                </div>
                <p className="text-xs text-muted-foreground">Live execution log</p>
            </SidebarHeader>

            <SidebarContent className="p-0">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <div className="relative space-y-6 pt-4 px-4 pb-4">
                            {activities.map(activity => (
                                <div key={activity.id} className="relative pl-6 pb-2 last:pb-0 group">
                                    {/* Timeline line */}
                                    <div className="absolute left-[5px] top-2 bottom-0 w-px bg-border last:hidden group-hover:bg-primary/50 transition-colors"></div>
                                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-background border border-border z-10 group-hover:border-primary transition-colors"></div>

                                    <div className="bg-muted/30 border border-border/50 rounded-lg p-3 hover:border-primary/50 transition-all shadow-sm">
                                        <div className="flex items-start gap-2 mb-1">
                                            <div className="mt-0.5">{activity.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground leading-tight">
                                                    {activity.action} <span className="font-medium text-primary">{activity.user}</span>
                                                </p>
                                                {activity.detail && <p className="text-xs text-muted-foreground mt-1 break-words">{activity.detail}</p>}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground pl-6">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/50 p-4 bg-card">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="w-full justify-center bg-muted/50 hover:bg-muted text-muted-foreground transition-colors h-9 shadow-sm border border-border"
                        >
                            <PauseCircle size={14} />
                            <span>Pause Agent</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="w-full justify-center text-muted-foreground hover:text-primary transition-colors h-9"
                        >
                            <Settings size={14} />
                            <span>Rate Limits</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <div className="text-center mt-2">
                    <span className="text-[10px] text-primary hover:text-primary/80 cursor-pointer flex items-center justify-center gap-1 transition-colors">
                        View full execution log <ChevronRight size={10} />
                    </span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
};

export default AgentActivitySidebar;
