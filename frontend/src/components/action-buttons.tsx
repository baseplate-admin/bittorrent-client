"use client";

import { Link2, Plus, Settings } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "./ui/button";

import {
    Dialog,
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
