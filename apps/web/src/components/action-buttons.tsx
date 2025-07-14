'use client';

import { Link2, Plus, Settings } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from './ui/button';
const mapping: Array<{
    icon: React.ReactElement;
    tooltip: string;
}> = [
    {
        icon: <Link2 strokeWidth={4} className="text-teal-500" />,
        tooltip: 'Add Torrent Link',
    },
    {
        icon: <Plus strokeWidth={4.7} className="text-teal-500" />,
        tooltip: 'Add Torrent File',
    },
    {
        icon: <Settings strokeWidth={3} className="text-indigo-300" />,
        tooltip: 'Settings',
    },
];

export default function ActionButtons() {
    return (
        <div className="flex mb-4 border p-4 rounded-md">
            <div className="flex gap-5">
                {mapping.map((item, index) => {
                    return (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <Button
                                    className="cursor-pointer"
                                    variant="outline"
                                    size="icon"
                                >
                                    {item.icon}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{item.tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
}
