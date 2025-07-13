'use client';

import {
    ArrowUpDown,
    Calendar,
    Check,
    ChevronDown,
    ChevronsDown,
    ChevronsUp,
    Inbox,
    Play,
    Search,
    Settings,
    Shuffle,
    Square,
} from 'lucide-react';

import { useState } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { title } from 'process';
import { url } from 'inspector';

const items = [
    {
        title: 'All',
        url: '#',
        icon: (
            <Shuffle size={28} strokeWidth={2.8} className="text-orange-400" />
        ),
    },
    {
        title: 'Downloading',
        url: '#',
        icon: (
            <ChevronsDown
                size={40}
                strokeWidth={4.5}
                className="text-green-600"
            />
        ),
    },
    {
        title: 'Uploading',
        url: '#',
        icon: (
            <ChevronsUp size={40} strokeWidth={4.5} className="text-blue-500" />
        ),
    },
    {
        title: 'Completed',
        url: '#',
        icon: <Check size={40} strokeWidth={4.0} className="text-purple-500" />,
    },
    {
        title: 'Running',
        url: '#',
        icon: (
            <Play
                size={40}
                strokeWidth={4.5}
                className="text-green-500 fill-current"
            />
        ),
    },
    {
        title: 'Stopped',
        url: '#',
        icon: (
            <Square
                size={40}
                strokeWidth={3}
                className="text-red-500 fill-current"
            />
        ),
    },
    {
        title: 'Active',
        url: '#',
        icon: <ArrowUpDown />,
    },
];
export function AppSidebar() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Seederrr version : {'2.0.0'}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                                <div className="flex justify-between px-2">
                                    Status
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'size-8',
                                                isOpen && 'rotate-180'
                                            )}
                                        >
                                            <ChevronDown />
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent>
                                    {items.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild>
                                                <a
                                                    href={item.url}
                                                    className="flex items-center gap-2"
                                                >
                                                    {item.icon}
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
