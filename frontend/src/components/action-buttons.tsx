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
                <FileDialog />
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
export const FileDialog = () => {
    const socket = useSocketConnection();
    const [folderValue, setFolderValue] = useState("");
    const [incompletePathEnabled, setIncompletePathEnabled] = useState(false);
    const [rememberPath, setRememberPath] = useState(false);
    const [neverShowAgain, setNeverShowAgain] = useState(false);
    const [folderLoading, setFolderLoading] = useState(false);

    const handleFolderLocationClick = () => {
        socket.current?.emit("bridge:pick_folder", (response: any) => {
            if (response) {
                setFolderLoading(false);
            }

            if (response.status === "success") {
                setFolderValue(response.path);
            }
        });
    };

    return (
        <Dialog>
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
                                    onClick={() => {
                                        setFolderLoading(true);
                                        handleFolderLocationClick();
                                    }}
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

                        {/* Torrent information */}
                        <fieldset className="space-y-1 rounded border p-3 text-sm text-gray-400">
                            <legend className="font-medium text-gray-300">
                                Torrent information
                            </legend>
                            <div>
                                <strong>Size:</strong> Not available (Free space
                                on disk: 736.55 GiB)
                            </div>
                            <div>
                                <strong>Date:</strong> Not Available
                            </div>
                            <div>
                                <strong>Info hash v1:</strong>{" "}
                                c37c904c8bc99ef12a674b105748cdb3f6609e04
                            </div>
                            <div>
                                <strong>Info hash v2:</strong> N/A
                            </div>
                            <div>
                                <strong>Comment:</strong> Not Available
                            </div>
                        </fieldset>

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

                    {/* Right side placeholder */}
                    <div className="flex-1 rounded border bg-black/10 p-3 text-center text-gray-500">
                        File list preview (empty)
                    </div>
                </div>

                <DialogFooter className="mt-6 flex justify-end gap-3">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
