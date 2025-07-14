'use client';
import { usePathname } from 'next/navigation';
import {
    ArrowUpDown,
    Check,
    ChevronDown,
    ChevronsDown,
    ChevronsUp,
    Play,
    Shuffle,
    Square,
} from 'lucide-react';
import Link from 'next/link';
import styles from '@/styles/logos/arrow-up-down.module.css';
import React, { useState } from 'react';
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

const items: Array<{ title: string; url: string; icon: React.ReactElement }> = [
    {
        title: 'All',
        url: '/',
        icon: (
            <Shuffle size={28} strokeWidth={2.8} className="text-orange-400" />
        ),
    },
    {
        title: 'Downloading',
        url: '/downloading',
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
        url: '/uploading',
        icon: (
            <ChevronsUp size={40} strokeWidth={4.5} className="text-blue-500" />
        ),
    },
    {
        title: 'Completed',
        url: '/completed',
        icon: <Check size={40} strokeWidth={4.0} className="text-purple-500" />,
    },
    {
        title: 'Running',
        url: '/running',
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
        url: '/stopped',
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
        url: '/active',
        icon: (
            <ArrowUpDown
                strokeWidth={4}
                className={`${styles.red_black} [--first-color:theme(colors.green.600)] [--second-color:theme(colors.blue.500)]`}
            />
        ),
    },
    {
        title: 'Inactive',
        url: '/inactive',
        icon: (
            <ArrowUpDown
                strokeWidth={4}
                className={`${styles.red_black} [--first-color:theme(colors.red.500)] [--second-color:theme(colors.red.500)]`}
            />
        ),
    },
];

export function AppSidebar() {
    const [panelsOpen, setPanelsOpen] = useState({
        status: true,
        tracker: true,
    });
    const pathname = usePathname();

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        {/* Seederrr version : {'2.0.0'} */}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <div className="flex flex-col gap-2">
                                <Collapsible
                                    open={panelsOpen.status}
                                    onOpenChange={(open) =>
                                        setPanelsOpen((prev) => ({
                                            ...prev,
                                            status: open,
                                        }))
                                    }
                                >
                                    <div className="flex justify-between px-2 py-2">
                                        <h2 className="text-lg">Status</h2>
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    'size-8',
                                                    panelsOpen.status &&
                                                        'rotate-180'
                                                )}
                                            >
                                                <ChevronDown />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent className="ml-4">
                                        <div className="flex flex-col gap-0.5">
                                            {items.map((item) => {
                                                const isActive =
                                                    pathname === item.url;

                                                return (
                                                    <SidebarMenuItem
                                                        key={item.title}
                                                    >
                                                        <SidebarMenuButton
                                                            asChild
                                                        >
                                                            <Link
                                                                href={item.url}
                                                                className={cn(
                                                                    'flex items-center gap-2 justify-start text-foreground/80',
                                                                    isActive &&
                                                                        'bg-muted/70'
                                                                )}
                                                            >
                                                                {item.icon}
                                                                <span>
                                                                    {item.title}
                                                                </span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                );
                                            })}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
