"use client";
import { CountryFlag } from "@/components/country-flag";
import { TableHeaderSortButton } from "@/components/table-header-sort-button";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
            const isoValue = info.getValue() as string;
            return (
                <>
                    {isoValue === null && typeof isoValue !== "string" ? (
                        <span>N/A</span>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost">
                                    <CountryFlag
                                        iso={isoValue}  
                                        title={isoValue}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{isoValue}</TooltipContent>
                        </Tooltip>
                    )}
                </>
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
];
