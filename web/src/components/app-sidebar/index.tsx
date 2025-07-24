"use client";
import { usePathname } from "next/navigation";
import {
    Check,
    ChevronDown,
    ChevronsDown,
    ChevronsUp,
    Play,
    Shuffle,
    Square,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpDownDualColor } from "@/styled-components/icons/ArrowUpDownDualColor";
import { parseCustomPathname } from "./utils";
const items: Array<{ title: string; url: string; icon: React.ReactElement }> = [
    {
        title: "All",
        url: "./all",
        icon: (
            <Shuffle size={28} strokeWidth={2.8} className="text-orange-400" />
        ),
    },
    {
        title: "Downloading",
        url: "./downloading",
        icon: (
            <ChevronsDown
                size={40}
                strokeWidth={4.5}
                className="text-green-600"
            />
        ),
    },
    {
        title: "Uploading",
        url: "./uploading",
        icon: (
            <ChevronsUp size={40} strokeWidth={4.5} className="text-blue-500" />
        ),
    },
    {
        title: "Completed",
        url: "./completed",
        icon: <Check size={40} strokeWidth={4.0} className="text-purple-500" />,
    },
    {
        title: "Running",
        url: "./running",
        icon: (
            <Play
                size={40}
                strokeWidth={4.5}
                className="fill-current text-green-500"
            />
        ),
    },
    {
        title: "Stopped",
        url: "./stopped",
        icon: (
            <Square
                size={40}
                strokeWidth={3}
                className="fill-current text-red-500"
            />
        ),
    },
    {
        title: "Active",
        url: "./active",
        icon: (
            <ArrowUpDownDualColor
                strokeWidth={4}
                className={`[--first-color:theme(colors.green.600)] [--second-color:theme(colors.blue.500)]`}
            />
        ),
    },
    {
        title: "Inactive",
        url: "./inactive",
        icon: (
            <ArrowUpDownDualColor
                strokeWidth={4}
                className={`[--first-color:theme(colors.red.500)] [--second-color:theme(colors.red.500)]`}
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
                                                    "size-8",
                                                    panelsOpen.status &&
                                                        "rotate-180",
                                                )}
                                            >
                                                <ChevronDown />
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent className="ml-4">
                                        <div className="flex flex-col gap-0.5">
                                            {items.map((item) => {
                                                const absolutePath =
                                                    parseCustomPathname({
                                                        currentPathname:
                                                            pathname,
                                                        relativeUrl: item.url,
                                                    });
                                                const isActive =
                                                    pathname === absolutePath;

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
                                                                    isActive &&
                                                                        "bg-muted/70",
                                                                    "text-foreground/80 flex items-center justify-start gap-2",
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
