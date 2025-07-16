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
import { TorrentInfo } from "@/types/socket/torrent_info";

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
const FileDialog = ({ magnetLink }: { magnetLink: string }) => {
    return <></>;
};
