import { TorrentInfo } from "@/types/socket/torrent_info";
import { TrackerTabDataTable } from "./data-table";
import { columns } from "./columns";

export default function TrackersTab({
    torrentData,
}: {
    torrentData: TorrentInfo;
}) {
    return (
        <TrackerTabDataTable columns={columns} data={torrentData.trackers} />
    );
}
