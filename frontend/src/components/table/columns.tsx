"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/formatBytes";
import { TorrentInfo } from "@/types/socket/torrent_info";

// const countPeersByType = (
//     peers: TorrentInfo['peers'],
//     types: ('seeder' | 'leecher' | 'unknown')[]
// ) => peers.filter((p) => types.includes(p.type)).length;

const columnsMetadata: {
    key: string;
    cell?: (context: { getValue: () => any; row: any }) => React.ReactNode;
    keyName?: string;
}[] = [
    {
        key: "name",
        cell: ({ getValue }) => (
            <div className="flex items-center gap-2">
                <p className="pl-2">{getValue()}</p>
            </div>
        ),
    },
    {
        key: "totalSize",
        keyName: "Total Size",

        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>{formatBytes({ bytes: getValue() })}</span>
            </div>
        ),
    },
    {
        key: "progress",
        cell: ({ getValue }) => {
            const progress = getValue();
            return (
                <progress
                    max={100}
                    value={progress}
                    className="bg-muted h-3 w-full rounded"
                />
            );
        },
    },
    {
        key: "status",
        cell: ({ getValue }) => {
            return <center className="capitalize">{getValue()}</center>;
        },
    },
    {
        key: "seeds",
        cell: ({ row }) => {
            return (
                <center>
                    {/* {countPeersByType(row.original.peers, ['seeder'])} */}
                </center>
            );
        },
    },
    {
        key: "leeches",
        cell: ({ row }) => (
            <center>
                {/* {countPeersByType(row.original.peers, ['leecher'])} */}
            </center>
        ),
    },
    {
        key: "peers",
        cell: ({ getValue }) => {
            const items = getValue().length;
            return <center>{items}</center>;
        },
    },
    {
        key: "uploadSpeed",
        keyName: "Upload Speed",

        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>
                    {formatBytes({ bytes: getValue(), perSecond: true })}
                </span>
            </div>
        ),
    },
    {
        key: "downloadSpeed",
        keyName: "Download Speed",
        cell: ({ getValue }) => (
            <div className="flex items-center justify-center gap-2">
                <span>
                    {formatBytes({ bytes: getValue(), perSecond: true })}
                </span>
            </div>
        ),
    },
];

export const columns: ColumnDef<TorrentInfo>[] = columnsMetadata.map(
    ({ key, cell, keyName }) => ({
        accessorKey: key,
        size: 300,
        header: ({ column }) => (
            <Button
                variant="ghost"
                className={cn("capitalize")}
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                }
            >
                {keyName ? keyName : key}
            </Button>
        ),
        enableResizing: true,
        ...(cell ? { cell } : {}),
    }),
);
