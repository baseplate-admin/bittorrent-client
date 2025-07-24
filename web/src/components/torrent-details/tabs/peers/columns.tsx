"use client";
import { CountryFlag } from "@/components/country-flag";
import { TableHeaderSortButton } from "@/components/table-header-sort-button";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatBytes } from "@/lib/formatBytes";
import { Peer } from "@/types/socket/torrent_info";
import { ColumnDef } from "@tanstack/react-table";

type SyntheticPeer = Peer & {
    isoCode?: string;
};

export const columns: ColumnDef<SyntheticPeer>[] = [
    {
        accessorKey: "isoCode",
        header: TableHeaderSortButton("Country/Region"),
        cell: (info) => {
            const isoValue = info.getValue() as string | undefined;
            // Get the entire row's data to access `country`
            const rowData = info.row.original as {
                isoCode?: string;
                country?: string;
            };

            if (!isoValue) {
                return <span>N/A</span>;
            }

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="ghost"
                            aria-label={rowData.country ?? isoValue}
                        >
                            <CountryFlag iso={isoValue} title={isoValue} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {rowData.country ?? isoValue}
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: "ip",
        header: TableHeaderSortButton("IP"),
        cell: (info) => {
            const ip = (info.getValue() as string) ?? "N/A";

            return <span>{ip}</span>;
        },
    },
    {
        accessorKey: "port",
        header: TableHeaderSortButton("Port"),
        cell: (info) => {
            const port = (info.getValue() as number) ?? "N/A";

            return <span>{port}</span>;
        },
    },
    {
        accessorKey: "client",
        header: TableHeaderSortButton("Client"),
        cell: (info) => {
            const client = (info.getValue() as string) ?? "N/A";

            return <span>{client}</span>;
        },
    },
    {
        accessorKey: "connection_type",
        header: TableHeaderSortButton("Connection Type"),
        cell: (info) => {
            const client = info.getValue() as string;
            return <span>{client}</span>;
        },
    },
    {
        accessorKey: "down_speed",
        header: TableHeaderSortButton("Download Speed"),
        cell: (info) => {
            const speed = info.getValue() as number;
            return (
                <span>{formatBytes({ bytes: speed, perSecond: true })}</span>
            );
        },
    },
    {
        accessorKey: "up_speed",
        header: TableHeaderSortButton("Upload Speed"),
        cell: (info) => {
            const speed = info.getValue() as number;
            return (
                <span>{formatBytes({ bytes: speed, perSecond: true })}</span>
            );
        },
    },
    {
        accessorKey: "total_download",
        header: TableHeaderSortButton("Downloaded"),
        cell: (info) => {
            const speed = info.getValue() as number;
            return <span>{formatBytes({ bytes: speed })}</span>;
        },
    },
    {
        accessorKey: "total_upload",
        header: TableHeaderSortButton("Uploaded"),
        cell: (info) => {
            const speed = info.getValue() as number;
            return <span>{formatBytes({ bytes: speed })}</span>;
        },
    },
];
