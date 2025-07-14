'use client';

import { Link2, Plus, Settings } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from './ui/button';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function ActionButtons() {
    const [openDialogIndex, setOpenDialogIndex] = useState<number | null>(null);

    const handleDownloadButtonClick = (closeDialog: () => void) => {
        console.log('Downloading...');
        closeDialog();
    };

    const handleTorrentAddButtonClick = (closeDialog: () => void) => {
        console.log('Adding torrent file...');
        closeDialog();
    };

    const mapping = [
        {
            icon: <Link2 strokeWidth={4} className="text-teal-500" />,
            tooltip: 'Add Torrent Link',
            getDialog: (closeDialog: () => void) => ({
                title: 'Add torrent links',
                content: (
                    <div className="flex flex-col gap-4 py-3">
                        <Textarea
                            className="h-32"
                            placeholder="Type your message here."
                        />
                        <p className="italic text-sm">
                            One link per line (Magnet links are supported)
                        </p>
                        <div className="flex w-full items-center justify-center gap-4">
                            <Button
                                onClick={() =>
                                    handleDownloadButtonClick(closeDialog)
                                }
                                variant="outline"
                            >
                                Download
                            </Button>
                            <Button variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ),
            }),
        },
        {
            icon: <Plus strokeWidth={4.7} className="text-teal-500" />,
            tooltip: 'Add Torrent File',
            getDialog: (closeDialog: () => void) => ({
                title: 'Add torrent file',
                content: (
                    <div className="flex flex-col gap-4 py-3">
                        <Input type="file" accept=".torrent" />
                        <p className="italic text-sm">
                            One link per line (Magnet links are supported)
                        </p>
                        <div className="flex w-full items-center justify-center gap-4">
                            <Button
                                onClick={() =>
                                    handleTorrentAddButtonClick(closeDialog)
                                }
                                variant="outline"
                            >
                                Add
                            </Button>
                            <Button variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ),
            }),
        },
        {
            icon: <Settings strokeWidth={3} className="text-indigo-300" />,
            tooltip: 'Settings',
            getDialog: (_closeDialog: () => void) => ({
                title: 'Settings',
                content: <div>Settings go here</div>,
            }),
        },
    ];

    return (
        <div className="flex mb-4 border p-4 rounded-md">
            <div className="flex gap-5">
                {mapping.map((item, index) => {
                    const isOpen = openDialogIndex === index;

                    const handleTriggerButtonClick = () => {
                        setOpenDialogIndex(index);
                    };

                    const closeDialog = () => setOpenDialogIndex(null);
                    const { title, content } = item.getDialog(closeDialog);

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
                            </DialogContent>
                        </Dialog>
                    );
                })}
            </div>
        </div>
    );
}
