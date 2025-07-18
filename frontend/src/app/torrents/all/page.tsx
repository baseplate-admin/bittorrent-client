"use client";
import { torrentAtom } from "@/atoms/torrent";
import { columns } from "@/components/torrent-table/columns";
import { DataTable } from "@/components/torrent-table/data-table";
import TorrentTableLoading from "@/components/torrent-table/loading";
import { useAtomValue } from "jotai";

export default function AllPage() {
    const data = useAtomValue(torrentAtom);

    if (data === null) {
        return <TorrentTableLoading />;
    }

    return <DataTable columns={columns} data={data} />;
}
