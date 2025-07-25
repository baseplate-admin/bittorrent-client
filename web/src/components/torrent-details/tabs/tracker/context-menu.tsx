import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { ignoredElementsRefAtom, ignoreTableClearAtom } from "@/atoms/table";
import { useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import {
    Copy,
    Megaphone,
    OctagonMinus,
    PencilIcon,
    PlusCircle,
} from "lucide-react";
import { TrackerInfo } from "@/types/socket/torrent_info";
import { CONTEXT_MENU_ATOM_SET_INTERVAL } from "@/consts/context-menu";
export function TrackerTabContextMenu({
    rowData,
    children,
}: {
    rowData: TrackerInfo;
    children: React.ReactElement;
}) {
    const setIgnoredElements = useSetAtom(ignoredElementsRefAtom);
    const lastNodeRef = useRef<HTMLDivElement | null>(null);
    const clearTimer = useRef<NodeJS.Timeout | null>(null);
    const setIgnoreTableClear = useSetAtom(ignoreTableClearAtom);

    const contextMenuRefCallback = useCallback(
        (node: HTMLDivElement | null) => {
            if (node) {
                // Mounting
                lastNodeRef.current = node;
                setIgnoredElements((prev) => {
                    const list = Array.isArray(prev) ? prev : [];
                    const exists = list.some((el) => el?.current === node);
                    if (!exists) {
                        return [...list, { current: node }];
                    }
                    return list;
                });
            } else {
                // Unmounting
                const nodeToRemove = lastNodeRef.current;
                lastNodeRef.current = null;
                if (nodeToRemove) {
                    setIgnoredElements((prev) => {
                        const list = Array.isArray(prev) ? prev : [];
                        return list.filter(
                            (el) => el?.current !== nodeToRemove,
                        );
                    });
                }
            }
        },
        [setIgnoredElements],
    );
    const handleContextMenuOpenChange = (open: boolean) => {
        if (open) {
            setIgnoreTableClear(true);
        } else {
            if (clearTimer.current) {
                clearTimeout(clearTimer.current);
            }

            clearTimer.current = setTimeout(() => {
                setIgnoreTableClear(false);
            }, CONTEXT_MENU_ATOM_SET_INTERVAL);
        }
    };
    const handleCopyButtonClick = async () => {
        await navigator.clipboard.writeText(rowData.url);
    };

    return (
        <ContextMenu onOpenChange={handleContextMenuOpenChange}>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent ref={contextMenuRefCallback} className="w-69">
                <ContextMenuItem>
                    <PlusCircle className="h-4 w-4" />
                    Add Trackers
                </ContextMenuItem>
                <ContextMenuItem>
                    <PencilIcon className="h-4 w-4" />
                    Edit Tracker URL
                </ContextMenuItem>
                <ContextMenuItem>
                    <OctagonMinus className="h-4 w-4" />
                    Remove Tracker
                </ContextMenuItem>
                <ContextMenuItem onClick={handleCopyButtonClick}>
                    <Copy className="h-4 w-4" />
                    Copy Tracker URL
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                    <Megaphone className="h-4 w-4" />
                    Force Reannounce to Tracker
                </ContextMenuItem>
                <ContextMenuItem>
                    <Megaphone className="h-4 w-4" />
                    Force Reannounce to all Trackers
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
