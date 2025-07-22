"use client";
import { broadcastTorrentAtom } from "@/atoms/torrent";
import { torrentTableColumns } from "@/components/torrent-table/columns";
import { TorrentDataTable } from "@/components/torrent-table/data-table";
import TorrentTableLoading from "@/components/torrent-table/loading";
import { useAtomValue } from "jotai";

export default function AllPage() {
    const data = useAtomValue(broadcastTorrentAtom);

    if (data === null) {
        return <TorrentTableLoading />;
    }

    const allowedStates = [
        "finished",
        //TODO: Check for error state
    ];

    const filteredData = data.filter((torrent) =>
        allowedStates.includes(torrent.state?.toLowerCase() ?? ""),
    );

    return (
        <TorrentDataTable columns={torrentTableColumns} data={filteredData} />
    );
}
