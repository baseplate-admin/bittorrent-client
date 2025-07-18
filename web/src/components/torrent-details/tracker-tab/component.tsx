"use client";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { TrackerTabDataTable } from "./data-table";
import { columns } from "./columns";
import { useEffect } from "react";

export default function TrackersTab({
    torrentData,
}: {
    torrentData: TorrentInfo;
}) {
    useEffect(() => {
        console.log(torrentData.trackers);
    }, [torrentData]);
    return (
        <TrackerTabDataTable columns={columns} data={torrentData.trackers} />
    );
}
