import { TorrentInfo } from "./torrent_info";
export interface GetAllResponse {
    status: string;
    torrents: TorrentInfo[];
}
