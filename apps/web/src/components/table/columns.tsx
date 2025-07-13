'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Torrent } from '@/types/Torrent';
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.


const columnsMetadata: {
    key: string;
    cell?: (context: { getValue: () => any }) => React.ReactNode;
    keyName?: string;
}[] = [
    {
        key: 'name',
        cell: ({ getValue }) => (
            <div className="flex items-center gap-2">
                <span>{getValue()}</span>
            </div>
        ),
    },
    {
        key: 'total',
    },
    {
        key: 'progress',
        cell: ({ getValue }) => {
            const progress = getValue() * 100;
            return (
                <progress
                    max={100}
                    value={progress}
                    className="w-full h-3 rounded bg-muted"
                />
            );
        },
    },
    { key: 'status' },
    { key: 'seeds' },
    {
        key: 'peers',
        cell: ({ getValue }) => {
            const items = getValue().length;
            return <center>{items}</center>;
        },
    },
    { key: 'up speed' },
    { key: 'downloadSpeed', keyName: 'Download Speed' },
];

export const columns: ColumnDef<Torrent>[] = columnsMetadata.map(
    ({ key, cell, keyName }) => ({
        accessorKey: key,
        size: 300,
        header: ({ column }) => (
            <Button
                variant="ghost"
                className={cn('capitalize')}
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                {keyName ? keyName : key}
            </Button>
        ),
        enableResizing: true,
        ...(cell ? { cell } : {}),
    })
);
