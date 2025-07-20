"use client";
import { TableHeaderSortButton } from "@/components/table-header-sort-button";
import { Button } from "@/components/ui/button";
import { formatDurationClean } from "@/lib/formatDurationClean";
import { TrackerInfo } from "@/types/socket/torrent_info";
import { ColumnDef } from "@tanstack/react-table";

function getTrackerStatus(tracker: TrackerInfo): string {
    if (tracker.updating) {
        return "Updating"; // fixed typo here
    }
    if (tracker.verified) {
        return "Working";
    }
    if (
        !tracker.start_sent &&
        !tracker.complete_sent &&
        tracker.fails === 0 &&
        !tracker.updating
    ) {
        return "Not Contacted Yet";
    }
    return "Not Working";
}

// Type-safe header renderer for sortable columns

export const columns: ColumnDef<TrackerInfo>[] = [
    {
        accessorKey: "tier",
        header: TableHeaderSortButton("Tier"),
        enableSorting: true,
    },
    {
        accessorKey: "url",
        header: TableHeaderSortButton("URL/Announce Endpoint"),
        enableSorting: true,
    },
    {
        id: "status",
        header: TableHeaderSortButton("Status"),
        accessorFn: getTrackerStatus,
        cell: ({ row }) => getTrackerStatus(row.original),
        enableSorting: true,
    },
    {
        accessorKey: "scrape_complete",
        header: TableHeaderSortButton("Seeds"),
        cell: (info) => {
            const value = info.getValue() as number;
            return typeof value === "number" && value >= 0 ? value : "N/A";
        },
        enableSorting: true,
    },
    {
        accessorKey: "scrape_incomplete",
        header: TableHeaderSortButton("Leeches"),
        cell: (info) => {
            const value = info.getValue() as number;
            return typeof value === "number" && value >= 0 ? value : "N/A";
        },
        enableSorting: true,
    },
    {
        accessorKey: "scrape_downloaded",
        header: TableHeaderSortButton("Times Downloaded"),
        cell: (info) => {
            const value = info.getValue() as number;
            return typeof value === "number" && value >= 0 ? value : "N/A";
        },
        enableSorting: true,
    },
    {
        accessorKey: "message",
        header: "Message",
        cell: (info) => info.getValue() || "N/A",
        enableSorting: false,
    },
    {
        accessorKey: "next_announce",
        header: TableHeaderSortButton("Next Announce"),
        cell: (info) => {
            const ts = info.getValue();
            if (typeof ts !== "number" || ts <= 0) return "N/A";
            const secondsLeft = Math.floor(ts - Date.now() / 1000);
            return secondsLeft <= 0
                ? "announcing"
                : formatDurationClean(secondsLeft);
        },
        enableSorting: true,
    },
    {
        id: "min_announce",
        header: "Min Announce",
        cell: ({ row }) => {
            const { next_announce, min_announce } = row.original;
            return typeof next_announce === "number" &&
                typeof min_announce === "number"
                ? formatDurationClean(next_announce - min_announce)
                : "N/A";
        },
        enableSorting: false,
    },
];
