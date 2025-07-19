"use client";
import {
    torrentPauseQueueAtom,
    torrentResumeQueueAtom,
    torrentRemoveQueueAtom,
} from "@/atoms/torrent";
import { TorrentInfo } from "@/types/socket/torrent_info";
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
    ContextMenuCheckboxItem,
} from "../ui/context-menu";
import { useSetAtom } from "jotai";
import {
    PlayIcon,
    StopCircle,
    PlayCircle,
    Trash2,
    Pencil,
    FolderOpen,
    Tag,
    Plus,
    Folder,
    RefreshCcw,
    UploadCloud,
} from "lucide-react";
import { useState } from "react";
import { RemoveTorrentDialog } from "./remove-torrent-dialog";

export function RowContextMenu({
    rowData,
    children,
}: Readonly<{
    rowData: TorrentInfo;
    children: React.ReactNode;
}>) {
    const data = rowData;

    const [removedDialogOpen, setRemovedDialogOpen] = useState(false);

    const setTorrentPauseQueue = useSetAtom(torrentPauseQueueAtom);
    const setTorrentResumeQueue = useSetAtom(torrentResumeQueueAtom);
    const setTorrentRemoveQueue = useSetAtom(torrentRemoveQueueAtom);

    const handlePauseButtonClick = () => {
        setTorrentPauseQueue((prev) => {
            if (!prev) return [data.info_hash];
            return [...prev, data.info_hash];
        });
    };
    const handleResumeButtonClick = () => {
        setTorrentResumeQueue((prev) => {
            if (!prev) return [data.info_hash];
            return [...prev, data.info_hash];
        });
    };

    const handleRemoveButtonClick = ({
        setOpen,
        remove_data,
    }: {
        setOpen: (open: boolean) => void;
        remove_data: boolean;
    }) => {
        setTorrentRemoveQueue((prev) => {
            const object = {
                info_hash: data.info_hash,
                remove_data: remove_data,
            };
            if (!prev) return [object];
            return [...prev, object];
        });
        setOpen(false);
    };

    return (
        <>
            {/* Dialogues */}
            <RemoveTorrentDialog
                open={removedDialogOpen}
                setOpen={setRemovedDialogOpen}
                name={data.name}
                handleButtonClick={handleRemoveButtonClick}
            ></RemoveTorrentDialog>

            {/* Context menu  */}
            <ContextMenu>
                <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
                <ContextMenuContent className="w-68">
                    <ContextMenuItem
                        disabled={!data.paused}
                        onClick={handleResumeButtonClick}
                    >
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Resume
                    </ContextMenuItem>
                    <ContextMenuItem
                        onClick={handlePauseButtonClick}
                        disabled={data.paused}
                    >
                        <StopCircle className="mr-2 h-4 w-4" />
                        Pause
                    </ContextMenuItem>
                    <ContextMenuItem>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Force Start
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setRemovedDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                    </ContextMenuItem>
                    <ContextMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    <ContextMenuItem>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Set Location
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <Tag className="mr-4 h-4 w-4" />
                            Tags
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-44">
                            <ContextMenuItem>
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                            </ContextMenuItem>
                            <ContextMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </ContextMenuItem>
                            <ContextMenuItem>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove All
                            </ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>

                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <Folder className="mr-4 h-4 w-4" />
                            Category
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-44">
                            <ContextMenuItem>
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                            </ContextMenuItem>
                            <ContextMenuItem>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </ContextMenuItem>
                            <ContextMenuItem>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove All
                            </ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>

                    <ContextMenuSeparator />

                    <ContextMenuCheckboxItem>
                        Automatic Torrent Management
                    </ContextMenuCheckboxItem>
                    <ContextMenuCheckboxItem>
                        Super Seeding Mode
                    </ContextMenuCheckboxItem>

                    <ContextMenuSeparator />

                    <ContextMenuItem>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Force Recheck
                    </ContextMenuItem>
                    <ContextMenuItem>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Force Reannounce
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>
    );
}
