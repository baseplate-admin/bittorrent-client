import { BroadcastTorrentInfo } from "./torrent_info";
export interface GetAllResponse {
    status: string;
    torrents: BroadcastTorrentInfo[];
}
