'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
    id: string;
    amount: number;
    status: 'pending' | 'processing' | 'success' | 'failed';
    email: string;
};

const columnsMetadata: {
    key: string;
    cell?: (context: { getValue: () => any }) => React.ReactNode;
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
        key: 'size',
        cell: ({ getValue }) => {
            return <></>;
        },
    },
    {
        key: 'progress',
        cell: ({ getValue }) => {
            const progress = getValue();
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
    { key: 'peers' },
    { key: 'up speed' },
    { key: 'down speed' },
];

export const columns: ColumnDef<Payment>[] = columnsMetadata.map(
    ({ key, cell }) => ({
        accessorKey: key,
        size: 300,
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="capitalize"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                {key}
            </Button>
        ),
        enableResizing: true,
        ...(cell ? { cell } : {}),
    })
);
