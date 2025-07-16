"use client";
import { torrentAtom } from "@/atoms/torrent";
import { columns } from "@/components/table/columns";
import { DataTable } from "@/components/table/data-table";
import { useAtomValue } from "jotai";

export default function AllPage() {
    const data = useAtomValue(torrentAtom);

    if (data === null) {
        return <>Loading</>;
    }

    const allowedStates = ["finished", "seeding", "paused"];

    const filteredData = data.filter((torrent) =>
        allowedStates.includes(torrent.state?.toLowerCase() ?? ""),
    );

    return <DataTable columns={columns} data={filteredData} />;
}
