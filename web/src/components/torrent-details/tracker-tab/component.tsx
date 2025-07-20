import { TorrentInfo } from "@/types/socket/torrent_info";
import { TrackerTabDataTable } from "./data-table";
import { columns } from "./columns";
import { ScrollArea } from "@/components/ui/scroll-area"; // import scrollarea from your UI

export default function TrackersTab({
    torrentData,
}: {
    torrentData: TorrentInfo;
}) {
    return (
        <ScrollArea className="h-96">
            <TrackerTabDataTable
                columns={columns}
                data={torrentData.trackers}
            />
        </ScrollArea>
    );
}
