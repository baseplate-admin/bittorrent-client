'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Torrent } from '@/types/Torrent';
import { formatBytes } from '@/lib/formatBytes';

const countPeers = (peers: Torrent['peers'], types: string[]) =>
    peers.filter(
        (p) =>
            p.connectionType?.includes &&
            types.some((type) => p.connectionType.includes(type))
    ).length;

const columnsMetadata: {
    key: string;
    cell?: (context: { getValue: () => any; row: any }) => React.ReactNode;
    keyName?: string;
}[] = [
    {
        key: 'name',
        cell: ({ getValue }) => (
            <div className="flex items-center gap-2">
                <p className="pl-2">{getValue()}</p>
            </div>
        ),
    },
    {
        key: 'totalSize',
        keyName: 'Total Size',

        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>{formatBytes({ bytes: getValue() })}</span>
            </div>
        ),
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
    {
        key: 'seeds',
        cell: ({ row }) => {
            return (
                <center>
                    {countPeers(row.original.peers, [
                        'tcpOutgoing',
                        // 'UDPIncoming',
                    ])}
                </center>
            );
        },
    },
    {
        key: 'leeches',
        cell: ({ row }) => {
            return (
                <center>
                    {countPeers(row.original.peers, [
                        'tcpIncoming',
                        // 'UDPIncoming',
                    ])}
                </center>
            );
        },
    },
    {
        key: 'peers',
        cell: ({ getValue }) => {
            const items = getValue().length;
            return <center>{items}</center>;
        },
    },
    {
        key: 'uploadSpeed',
        keyName: 'Upload Speed',

        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>
                    {formatBytes({ bytes: getValue(), perSecond: true })}
                </span>
            </div>
        ),
    },
    {
        key: 'downloadSpeed',
        keyName: 'Download Speed',
        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>
                    {formatBytes({ bytes: getValue(), perSecond: true })}
                </span>
            </div>
        ),
    },
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
