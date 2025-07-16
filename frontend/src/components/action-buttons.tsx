"use client";

import { Folder, Link2, Loader2Icon, Plus, Settings } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "./ui/button";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useSetAtom } from "jotai";
import {
    torrentUploadFileQueueAtom,
    torrentUploadMagnetQueueAtom,
} from "@/atoms/torrent";
import { Label } from "./ui/label";
import { useSocketConnection } from "@/hooks/use-socket";
import { Checkbox } from "./ui/checkbox";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { formatBytes } from "@/lib/formatBytes";

export default function ActionButtons() {
    const [openDialogIndex, setOpenDialogIndex] = useState<number | null>(null);

    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [textareaValue, setTextareaValue] = useState<string>("");

    const setTorrentUploadFileQueue = useSetAtom(torrentUploadFileQueueAtom);
    const setTorrentUploadMagnetQueue = useSetAtom(
        torrentUploadMagnetQueueAtom,
    );

    const handleDownloadButtonClick = (closeDialog: () => void) => {
        const magnets = textareaValue.split("\n");
        setTorrentUploadMagnetQueue([...magnets]);

        closeDialog();
    };

    const handleTorrentAddButtonClick = (closeDialog: () => void) => {
        setTorrentUploadFileQueue([...uploadedFiles]);
        closeDialog();
    };

    // Cleanup
    useEffect(() => {
        if (openDialogIndex === null) {
            setTimeout(() => {
                setUploadedFiles([]);
                setTextareaValue("");
            }, 1000);
        }
    }, [openDialogIndex]);

    const mapping = [
        {
            icon: <Link2 strokeWidth={4} className="text-teal-500" />,
            tooltip: "Add Torrent Link",
            getDialog: (closeDialog: () => void) => ({
                title: "Add torrent links",
                content: (
                    <div className="flex flex-col gap-4 py-3">
                        <Textarea
                            onChange={(e) => setTextareaValue(e.target.value)}
                            value={textareaValue}
                            className="h-32"
                            placeholder="Type your message here."
                        />
                        <p className="text-sm italic">
                            One link per line (Magnet links are supported)
                        </p>
                    </div>
                ),
                footer: (
                    <>
                        <Button
                            onClick={() =>
                                handleDownloadButtonClick(closeDialog)
                            }
                            variant="outline"
                        >
                            Download
                        </Button>
                        <DialogTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogTrigger>
                    </>
                ),
            }),
        },
        {
            icon: <Plus strokeWidth={4.7} className="text-teal-500" />,
            tooltip: "Add Torrent File",
            getDialog: (closeDialog: () => void) => ({
                title: "Add torrent file",
                content: (
                    <div className="flex flex-col gap-4 py-3">
                        <Input
                            onInput={(e) => {
                                const files = (e.target as HTMLInputElement)
                                    .files;
                                if (files) {
                                    setUploadedFiles(Array.from(files));
                                } else {
                                    setUploadedFiles([]);
                                }
                            }}
                            type="file"
                            accept=".torrent"
                            multiple
                        />
                        <p className="text-sm italic">
                            You can select multiple torrent files.
                        </p>
                    </div>
                ),
                footer: (
                    <>
                        <Button
                            onClick={() =>
                                handleTorrentAddButtonClick(closeDialog)
                            }
                            variant="outline"
                        >
                            Add
                        </Button>
                        <DialogTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogTrigger>
                    </>
                ),
            }),
        },
        {
            icon: <Settings strokeWidth={3} className="text-indigo-300" />,
            tooltip: "Settings",
            getDialog: () => ({
                title: "Settings",
                content: <div>Settings go here</div>,
                footer: <></>,
            }),
        },
    ];

    return (
        <div className="mb-4 flex rounded-md border p-4">
            <div className="flex gap-5">
                <FileDialog magnetLink="magnet:?xt=urn:btih:C37C904C8BC99EF12A674B105748CDB3F6609E04&dn=Ballerina.2025.1080p.WEB-DL.DDP5.1.x265-NeoNoir&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=http%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.ololosh.space%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dump.cl%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.bittor.pw%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker-udp.gbitt.info%3A80%2Fannounce&tr=udp%3A%2F%2Fretracker01-msk-virt.corbina.net%3A80%2Fannounce&tr=udp%3A%2F%2Fopen.free-tracker.ga%3A6969%2Fannounce&tr=udp%3A%2F%2Fns-1.x-fins.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce" />
                {mapping.map((item, index) => {
                    const isOpen = openDialogIndex === index;

                    const handleTriggerButtonClick = () => {
                        setOpenDialogIndex(index);
                    };

                    const closeDialog = () => setOpenDialogIndex(null);
                    const { title, content, footer } =
                        item.getDialog(closeDialog);

                    return (
                        <Dialog
                            key={index}
                            open={isOpen}
                            onOpenChange={(open) =>
                                setOpenDialogIndex(open ? index : null)
                            }
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="cursor-pointer"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleTriggerButtonClick}
                                    >
                                        {item.icon}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{title}</DialogTitle>
                                    <DialogDescription asChild>
                                        {content}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>{footer}</DialogFooter>
                            </DialogContent>
                        </Dialog>
                    );
                })}
            </div>
        </div>
    );
}
interface FileInfo {
    path: string;
    size: number;
}

interface Metadata {
    name?: string;
    size?: string;
    info_hash?: string;
}

const FileDialog = ({ magnetLink }: { magnetLink: string }) => {
    const socket = useSocketConnection();

    const [folderValue, setFolderValue] = useState("");
    const [folderLoading, setFolderLoading] = useState(false);

    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [torrentId, setTorrentId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const [incompletePathEnabled, setIncompletePathEnabled] = useState(false);
    const [rememberPath, setRememberPath] = useState(false);
    const [neverShowAgain, setNeverShowAgain] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);

    // Fetch metadata when dialog opens or magnetLink changes
    useEffect(() => {
        if (!dialogOpen) return;
        if (!magnetLink) return;

        setLoading(true);
        socket.current?.emit(
            "libtorrent:add_magnet",
            {
                action: "fetch_metadata",
                magnet: magnetLink,
                save_path: folderValue || ".",
            },
            (response: {
                status: string;
                message?: string;
                metadata?: Metadata;
                torrent_id?: number;
                files?: FileInfo[];
            }) => {
                setLoading(false);
                if (response.status === "success") {
                    setMetadata(response.metadata || null);
                    setTorrentId(response.torrent_id || null);
                    setFiles(response.files || []);
                } else {
                    alert(`Error fetching metadata: ${response.message}`);
                    setMetadata(null);
                    setFiles([]);
                }
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialogOpen, magnetLink]);

    // Folder picker
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
        if (!torrentId) return;
        setLoading(true);
        socket.current?.emit(
            "libtorrent:add_magnet",
            { action: "add", torrent_id: torrentId },
            (response: any) => {
                setLoading(false);
                if (response.status === "success") {
                    alert("Torrent added successfully!");
                    resetForm();
                    setDialogOpen(false);
                } else {
                    alert(`Error adding torrent: ${response.message}`);
                }
            },
        );
    };

    const cancelTorrent = () => {
        if (!torrentId) return;
        setLoading(true);
        socket.current?.emit(
            "libtorrent:add_magnet",
            { action: "cancel", torrent_id: torrentId },
            (response: any) => {
                setLoading(false);
                if (response.status === "success") {
                    alert("Torrent cancelled.");
                    resetForm();
                    setDialogOpen(false);
                } else {
                    alert(`Error cancelling torrent: ${response.message}`);
                }
            },
        );
    };

    const resetForm = () => {
        setMetadata(null);
        setFiles([]);
        setTorrentId(null);
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Add Torrent</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[480px] overflow-auto sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Save Torrent</DialogTitle>
                </DialogHeader>

                <div className="flex gap-6">
                    <div className="flex w-[350px] flex-col gap-6">
                        {/* Save at input */}
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

                        {/* Torrent Metadata and Information */}
                        <fieldset className="space-y-1 rounded border p-3 text-sm text-gray-400">
                            <legend className="font-medium text-gray-300">
                                Torrent Information
                            </legend>
                            <div>
                                <strong>Name:</strong>{" "}
                                {metadata?.name || "Not Available"}
                            </div>
                            <div>
                                <strong>Size:</strong>{" "}
                                {metadata?.size ||
                                    "Not available (Free space on disk: 736.55 GiB)"}
                            </div>
                            <div>
                                <strong>Date:</strong> Not Available
                            </div>
                            <div>
                                <strong>Info hash v1:</strong>{" "}
                                {metadata?.info_hash ||
                                    "c37c904c8bc99ef12a674b105748cdb3f6609e04"}
                            </div>
                            <div>
                                <strong>Info hash v2:</strong> N/A
                            </div>
                            <div>
                                <strong>Comment:</strong> Not Available
                            </div>
                        </fieldset>

                        {/* Confirm / Cancel buttons */}
                        {metadata && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={confirmAddTorrent}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2Icon className="animate-spin" />
                                    ) : (
                                        "Add Torrent"
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={cancelTorrent}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {/* Incomplete torrent path checkbox and input */}
                        <div className="grid gap-1">
                            <Label
                                className="inline-flex cursor-pointer items-center gap-2"
                                htmlFor="incomplete-path-checkbox"
                            >
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

                        {/* Remember last path */}
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

                        {/* Torrent options */}
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
                            <div className="flex flex-wrap gap-2">
                                <Label className="inline-flex cursor-pointer items-center gap-1">
                                    <Checkbox />
                                    Start torrent
                                </Label>
                                <Label className="inline-flex cursor-pointer items-center gap-1">
                                    <Checkbox />
                                    Add to top of queue
                                </Label>
                                <Label className="inline-flex cursor-pointer items-center gap-1">
                                    <Checkbox />
                                    Download in sequential order
                                </Label>
                                <Label className="inline-flex cursor-pointer items-center gap-1">
                                    <Checkbox />
                                    Skip hash check
                                </Label>
                                <Label className="inline-flex cursor-pointer items-center gap-1">
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

                        {/* Never show again checkbox */}
                        <div className="flex items-center gap-2 text-sm">
                            <Checkbox
                                id="never-show"
                                checked={neverShowAgain}
                                onCheckedChange={(checked) =>
                                    setNeverShowAgain(!!checked)
                                }
                            />
                            <Label
                                htmlFor="never-show"
                                className="cursor-pointer"
                            >
                                Never show again
                            </Label>
                        </div>
                    </div>

                    {/* Right side file list preview */}
                    <div className="max-h-[480px] flex-1 overflow-auto rounded border bg-black/10 p-3 text-left text-gray-800">
                        <h3 className="mb-2 font-semibold text-gray-700">
                            File List Preview
                        </h3>
                        {loading ? (
                            <div className="flex items-center justify-center py-10 text-gray-500">
                                Loading files...
                            </div>
                        ) : files.length === 0 ? (
                            <div className="py-10 text-center text-gray-500">
                                No files available
                            </div>
                        ) : (
                            <ul className="max-h-[400px] overflow-auto text-sm">
                                {files.map(({ path, size }, i) => (
                                    <li
                                        key={i}
                                        className="border-b border-gray-300 py-1 last:border-b-0"
                                    >
                                        <div className="truncate font-mono text-xs text-gray-600">
                                            {path}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatBytes({ bytes: size })}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-6 flex justify-end gap-3">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            disabled={loading || folderLoading}
                        >
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
