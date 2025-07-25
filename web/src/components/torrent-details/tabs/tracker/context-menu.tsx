import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

import {
    ignoredElementsRefAtom,
    canTorrentDetailsClearAtom,
} from "@/atoms/table";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Copy,
    Megaphone,
    OctagonMinus,
    PencilIcon,
    PlusCircle,
} from "lucide-react";
import { TrackerInfo } from "@/types/socket/torrent_info";
import { AddTrackerDialog } from "./dialogs/add-tracker";
import { EditTrackerDialog } from "./dialogs/edit-tracker";
import { useSocketConnection } from "@/hooks/use-socket";
import { CAN_TORRENT_DETAILS_ATOM_SET_INTERVAL } from "@/consts/atoms";

export function TrackerTabContextMenu({
    rowData,
    children,
    infoHash,
    allRows,
}: {
    allRows: TrackerInfo[];
    rowData: TrackerInfo;
    children: React.ReactElement;
    infoHash: string;
}) {
    // State to track which dialog is open: "add", "edit", or null
    const [openDialog, setOpenDialog] = useState<"add" | "edit" | null>(null);

    // New state to track if the context menu itself is open or closed
    const [contextMenuOpen, setContextMenuOpen] = useState(false);

    const setIgnoredElements = useSetAtom(ignoredElementsRefAtom);
    const setCanTorrentDetailsClear = useSetAtom(canTorrentDetailsClearAtom);
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

    const handleReannounceButtonClick = (
        trackerURL: string | Array<string>,
    ) => {
        socket.current?.emit(
            "libtorrent:force_reannounce",
            {
                info_hash: infoHash,
                trackers: Array.isArray(trackerURL) ? trackerURL : [trackerURL],
            },
            (response: { status: "success" | "error"; message: string }) => {
                if (response.status === "success") {
                    console.log("Reannounced to tracker successfully");
                } else {
                    throw new Error(
                        `Failed to reannounce to tracker: ${response.message}`,
                    );
                }
            },
        );
    };

    const handleCopyButtonClick = async () => {
        await navigator.clipboard.writeText(rowData.url);
    };

    useEffect(() => {
        if (openDialog === null && !contextMenuOpen) {
            setTimeout(() => {
                setCanTorrentDetailsClear(true);
            }, CAN_TORRENT_DETAILS_ATOM_SET_INTERVAL);
        } else {
            setTimeout(() => {
                setCanTorrentDetailsClear(false);
            });
        }
    }, [openDialog, contextMenuOpen]);

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

            <ContextMenu onOpenChange={setContextMenuOpen}>
                <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
                <ContextMenuContent
                    ref={contextMenuRefCallback}
                    className="w-69"
                >
                    <ContextMenuItem onClick={() => setOpenDialog("add")}>
                        <PlusCircle className="h-4 w-4" />
                        Add Trackers
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setOpenDialog("edit")}>
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
                    <ContextMenuItem
                        onClick={() => handleReannounceButtonClick(rowData.url)}
                    >
                        <Megaphone className="h-4 w-4" />
                        Force Reannounce to Tracker
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={() =>
                            handleReannounceButtonClick(
                                allRows.map((row) => row.url),
                            )
                        }
                    >
                        <Megaphone className="h-4 w-4" />
                        Force Reannounce to all Trackers
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>
    );
}
