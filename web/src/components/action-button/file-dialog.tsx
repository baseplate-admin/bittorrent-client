"use client";

import { Folder, Loader2Icon } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";
import { useSocketConnection } from "@/hooks/use-socket";
import { Checkbox } from "../ui/checkbox";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { formatBytes } from "@/lib/formatBytes";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { FileInfo } from "@/types/socket/files";
import { FileTreeTable } from "../file-table";

type Metadata = {
    name: string;
    info_hash: string;
    save_path: string;
    size: string;
};

export function FileDialog({
    magnetLink,
    onClose,
}: {
    magnetLink: string;
    onClose: () => void;
}) {
    const socket = useSocketConnection();

    const [folderValue, setFolderValue] = useState("");
    const [folderLoading, setFolderLoading] = useState(false);

    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [torrentInfoHash, setTorrentInfoHash] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [incompletePathEnabled, setIncompletePathEnabled] = useState(false);
    const [rememberPath, setRememberPath] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(true);

    useEffect(() => {
        if (!dialogOpen || !magnetLink) return;

        setLoading(true);
        socket.current?.emit(
            "libtorrent:add_magnet",
            {
                action: "fetch_metadata",
                magnet_uri: magnetLink,
                save_path: folderValue || ".",
            },
            (response: {
                status: string;
                message?: string;
                metadata?: Metadata;
            }) => {
                setLoading(false);
                if (response.status === "success") {
                    setMetadata(response.metadata || null);
                    const infoHash = response.metadata?.info_hash;
                    if (!infoHash) {
                        throw new Error("Info hash not found in metadata");
                    }
                    setTorrentInfoHash(infoHash);
                    socket.current?.emit(
                        "libtorrent:get_specific_files",
                        {
                            info_hash: infoHash,
                        },
                        (_response: {
                            status: "error" | "success";

                            files: FileInfo[];
                        }) => {
                            if (_response.status === "success") {
                                setFiles(_response.files);
                            }
                        },
                    );
                } else {
                    console.error("Error fetching metadata:", response.message);
                    setMetadata(null);
                    setFiles([]);
                }
            },
        );
    }, [dialogOpen, magnetLink]);

    const handleFolderLocationClick = () => {
        setFolderLoading(true);
        socket.current?.emit("bridge:pick_folder", (response: any) => {
            setFolderLoading(false);
            if (response?.status === "success") {
                setFolderValue(response.path);
            }
        });
    };

    const confirmAddTorrent = () => {
        if (!torrentInfoHash) return;
        setLoading(true);
        socket.current?.emit(
            "libtorrent:add_magnet",
            { action: "add", info_hash: torrentInfoHash },
            (response: any) => {
                setLoading(false);
                if (response.status === "success") {
                    resetForm();
                    closeDialog();
                } else {
                    console.error("Error adding torrent:", response.message);
                }
            },
        );
    };

    const cancelTorrent = () => {
        if (!torrentInfoHash) return;
        setLoading(true);
        socket.current?.emit(
            "libtorrent:add_magnet",
            { action: "remove", info_hash: torrentInfoHash },
            (response: any) => {
                setLoading(false);
                if (response.status === "success") {
                    resetForm();
                    closeDialog();
                } else {
                    console.error(
                        "Error cancelling torrent:",
                        response.message,
                    );
                }
            },
        );
    };

    const resetForm = () => {
        setMetadata(null);
        setFiles([]);
        setTorrentInfoHash(null);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        onClose();
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
            <DialogContent className="max-h-[90vh] w-full min-w-[70vw]">
                <DialogHeader>
                    <DialogTitle>Save Torrent</DialogTitle>
                </DialogHeader>

                <div className="flex w-full gap-6">
                    {/* Left Pane */}
                    <div className="flex w-[40%] flex-col gap-6 overflow-y-auto pr-2">
                        <div className="grid gap-1">
                            <Label htmlFor="save-location">Save at</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="save-location"
                                    value={folderValue}
                                    onChange={(e) =>
                                        setFolderValue(e.target.value)
                                    }
                                    placeholder="Select folder to save torrent"
                                    className="flex-grow"
                                />
                                <Button
                                    size="icon"
                                    disabled={folderLoading}
                                    onClick={handleFolderLocationClick}
                                    aria-label="Pick folder"
                                >
                                    {folderLoading ? (
                                        <Loader2Icon className="animate-spin" />
                                    ) : (
                                        <Folder className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-1">
                            <Label className="inline-flex cursor-pointer items-center gap-2">
                                <Checkbox
                                    id="incomplete-path-checkbox"
                                    checked={incompletePathEnabled}
                                    onCheckedChange={(checked) =>
                                        setIncompletePathEnabled(!!checked)
                                    }
                                />
                                Use another path for incomplete torrent
                            </Label>
                            <Input
                                placeholder="Folder for incomplete files"
                                disabled={!incompletePathEnabled}
                                className="mt-1"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="remember-path"
                                checked={rememberPath}
                                onCheckedChange={(checked) =>
                                    setRememberPath(!!checked)
                                }
                            />
                            <Label
                                htmlFor="remember-path"
                                className="cursor-pointer"
                            >
                                Remember last used save path
                            </Label>
                        </div>

                        <fieldset className="space-y-2 rounded border p-3">
                            <legend className="font-medium">
                                Torrent options
                            </legend>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    id="category"
                                    placeholder="Select category"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    placeholder="Add/remove tags"
                                />
                            </div>
                            <div className="flex flex-col flex-wrap gap-2">
                                <Label className="inline-flex items-center gap-2">
                                    <Checkbox />
                                    Start torrent
                                </Label>
                                <Label className="inline-flex items-center gap-2">
                                    <Checkbox />
                                    Add to top of queue
                                </Label>
                                <Label className="inline-flex items-center gap-2">
                                    <Checkbox />
                                    Download in sequential order
                                </Label>
                                <Label className="inline-flex items-center gap-2">
                                    <Checkbox />
                                    Skip hash check
                                </Label>
                                <Label className="inline-flex items-center gap-2">
                                    <Checkbox />
                                    Download first and last pieces first
                                </Label>
                            </div>
                            <div className="grid max-w-xs gap-2">
                                <Label htmlFor="content-layout">
                                    Content layout
                                </Label>
                                <Select defaultValue="Original">
                                    <SelectTrigger className="rounded border px-2 py-1">
                                        <SelectValue placeholder="Select content layout" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="Original">
                                                Original
                                            </SelectItem>
                                            <SelectItem value="Custom">
                                                Custom
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </fieldset>

                        <fieldset className="text-muted-foreground space-y-1 rounded border p-3 text-sm">
                            <legend className="text-muted-foreground font-medium">
                                Torrent Information
                            </legend>
                            <div>
                                <strong>Name: </strong>
                                {metadata?.name || "Not Available"}
                            </div>
                            <div>
                                <strong>Size: </strong>
                                {metadata?.size ? (
                                    <>
                                        {formatBytes({
                                            bytes: Number(metadata?.size) ?? 0,
                                        })}
                                    </>
                                ) : (
                                    "Not available (Free space on disk: 736.55 GiB)"
                                )}
                            </div>
                            <div>
                                <strong>Date:</strong> Not Available
                            </div>
                            <div>
                                <strong>Info hash v1:</strong>{" "}
                                {metadata?.info_hash || "N/A"}
                            </div>
                            <div>
                                <strong>Info hash v2:</strong> N/A
                            </div>
                            <div>
                                <strong>Comment:</strong> Not Available
                            </div>
                        </fieldset>
                    </div>

                    {/* Right Pane */}
                    <div className="w-[60%] overflow-hidden">
                        <div className="bg-surface text-primary h-full rounded border p-3">
                            <h3 className="text-primary border-b p-3 font-semibold">
                                File List Preview
                            </h3>
                            {loading ? (
                                <div className="flex h-full items-center justify-center">
                                    <p>Loading files...</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="flex h-full items-center justify-center">
                                    <p>No files available</p>
                                </div>
                            ) : (
                                <div className="w-full overflow-auto">
                                    <FileTreeTable files={files} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 flex justify-end gap-3">
                    <DialogClose asChild>
                        <div className="flex gap-2">
                            <Button
                                onClick={confirmAddTorrent}
                                disabled={loading}
                            >
                                Add Torrent
                            </Button>
                            <Button
                                variant="outline"
                                onClick={cancelTorrent}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
