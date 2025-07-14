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

const mapping: Array<{
    icon: React.ReactElement;
    tooltip: string;
    dialog: {
        title: string;
        content: React.ReactElement;
    };
}> = [
    {
        icon: <Link2 strokeWidth={4} className="text-teal-500" />,
        tooltip: 'Add Torrent Link',
        dialog: {
            title: 'Add torrent links',
            content: <></>,
        },
    },
    {
        icon: <Plus strokeWidth={4.7} className="text-teal-500" />,
        tooltip: 'Add Torrent File',
        dialog: {
            title: '',
            content: <></>,
        },
    },
    {
        icon: <Settings strokeWidth={3} className="text-indigo-300" />,
        tooltip: 'Settings',
        dialog: {
            title: '',
            content: <></>,
        },
    },
];

export default function ActionButtons() {
    return (
        <div className="flex mb-4 border p-4 rounded-md">
            <div className="flex gap-5">
                {mapping.map((item, index) => {
                    const [dialogOpen, setDialogOpen] = useState(false);
                    return (
                        <div key={index}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="cursor-pointer"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            setDialogOpen(true);
                                        }}
                                    >
                                        {item.icon}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                            <Dialog
                                open={dialogOpen}
                                onOpenChange={setDialogOpen}
                            >
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {item.dialog.title}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {item.dialog.content}
                                        </DialogDescription>
                                    </DialogHeader>
                                </DialogContent>
                            </Dialog>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
