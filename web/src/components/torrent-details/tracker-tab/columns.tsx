"use client";
import { formatDurationClean } from "@/lib/formatDurationClean";
import { TrackerInfo } from "@/types/socket/torrent_info";
import { ColumnDef } from "@tanstack/react-table";

function getTrackerStatus(tracker: TrackerInfo): string {
    if (tracker.updating) {
        return "Updaing";
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

export const columns: ColumnDef<TrackerInfo>[] = [
    {
        accessorKey: "url",
        header: "URL/Announce Endpoint",
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

    // Derived column for working status
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const tracker = row.original;
            return getTrackerStatus(tracker);
        },
    },
    {
        accessorKey: "scrape_complete",
        header: "Seeds",
        cell: (info) => {
            const seeds = info.getValue();
            return typeof seeds === "number" && seeds >= 0 ? seeds : "N/A";
        },
    },
    {
        accessorKey: "scrape_incomplete",
        header: "Leecches",
        cell: (info) => {
            const leeches = info.getValue();
            return typeof leeches === "number" && leeches >= 0
                ? leeches
                : "N/A";
        },
    },
    {
        accessorKey: "scrape_downloaded",
        header: "Times Downloaded",
        cell: (info) => {
            const downloaded = info.getValue();
            return typeof downloaded === "number" && downloaded >= 0
                ? downloaded
                : "N/A";
        },
    },
    {
        accessorKey: "message",
        header: "Message",
        cell: (info) => {
            return info.getValue() || "N/A";
        },
    },
    {
        accessorKey: "next_announce",
        header: "Next Announce",
        cell: (info) => {
            const nextAnnounce = info.getValue();
            return typeof nextAnnounce === "number"
                ? formatDurationClean(
                      Math.floor(nextAnnounce - Date.now() / 1000),
                  )
                : "N/A";
        },
    },
    // Derived
    {
        id: "min_announce",
        header: "Min Announce",
        cell: ({ row }) => {
            const nextAnnounce = row.original.next_announce;
            const minAnnounce = row.original.min_announce;
            return typeof nextAnnounce === "number" &&
                typeof minAnnounce === "number"
                ? formatDurationClean(minAnnounce - nextAnnounce)
                : "N/A";
        },
    },
];
