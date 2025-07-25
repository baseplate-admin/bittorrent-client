import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { ignoredElementsRefAtom, ignoreTableClearAtom } from "@/atoms/table";
import { useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import {
    Copy,
    Megaphone,
    OctagonMinus,
    PencilIcon,
    PlusCircle,
} from "lucide-react";
import { TrackerInfo } from "@/types/socket/torrent_info";
import { CONTEXT_MENU_ATOM_SET_INTERVAL } from "@/consts/context-menu";
import { AddTrackerDialog } from "./dialogs/add-tracker";
import { EditTrackerDialog } from "./dialogs/edit-tracker";
import { useSocketConnection } from "@/hooks/use-socket";

export function TrackerTabContextMenu({
    rowData,
    children,
    infoHash,
}: {
    rowData: TrackerInfo;
    children: React.ReactElement;
    infoHash: string;
}) {
    const [openDialog, setOpenDialog] = useState<"add" | "edit" | null>(null);

    const setIgnoredElements = useSetAtom(ignoredElementsRefAtom);
    const clearTimer = useRef<NodeJS.Timeout | null>(null);
    const setIgnoreTableClear = useSetAtom(ignoreTableClearAtom);
    const lastNodeRef = useRef<HTMLDivElement | null>(null);
    const socket = useSocketConnection();

    const contextMenuRefCallback = useCallback(
        (node: HTMLDivElement | null) => {
            if (node) {
                lastNodeRef.current = node;
                setIgnoredElements((prev) => {
                    const list = Array.isArray(prev) ? prev : [];
                    const exists = list.some((el) => el?.current === node);
                    if (!exists) return [...list, { current: node }];
                    return list;
                });
            } else {
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
            if (clearTimer.current) clearTimeout(clearTimer.current);
            clearTimer.current = setTimeout(() => {
                setIgnoreTableClear(false);
            }, CONTEXT_MENU_ATOM_SET_INTERVAL);
        }
    };

    const handleRemoveButtonClick = () => {
        socket.current?.emit(
            "libtorrent:remove_tracker",
            {
                info_hash: infoHash,
                trackers: [rowData.url],
            },
            (response: { status: "success" | "error"; message: string }) => {
                if (response.status === "success") {
                    console.log("Tracker removed successfully");
                } else {
                    throw new Error(
                        `Failed to remove tracker: ${response.message}`,
                    );
                }
            },
        );
    };

    const handleCopyButtonClick = async () => {
        await navigator.clipboard.writeText(rowData.url);
    };

    return (
        <>
            <AddTrackerDialog
                open={openDialog === "add"}
                onOpenChange={(open) => setOpenDialog(open ? "add" : null)}
                infoHash={infoHash}
            />
            <EditTrackerDialog
                open={openDialog === "edit"}
                onOpenChange={(open) => setOpenDialog(open ? "edit" : null)}
                trackerURL={rowData.url}
                infoHash={infoHash}
            />

            <ContextMenu onOpenChange={handleContextMenuOpenChange}>
                <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
                <ContextMenuContent
                    ref={contextMenuRefCallback}
                    className="w-69"
                >
                    <ContextMenuItem
                        onClick={() => {
                            setOpenDialog("add");
                        }}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add Trackers
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={() => {
                            setOpenDialog("edit");
                        }}
                    >
                        <PencilIcon className="h-4 w-4" />
                        Edit Tracker URL
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleRemoveButtonClick}>
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
        </>
    );
}
