"use client";
import { TrackerInfo } from "@/types/socket/torrent_info";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<TrackerInfo>[] = [
    {
        accessorKey: "url",
        header: "URL",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "tier",
        header: "Tier",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "fail_limit",
        header: "Fail Limit",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "source",
        header: "Source",
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: "verified",
        header: "Verified",
        cell: (info) => (info.getValue() ? "Yes" : "No"),
    },
];
