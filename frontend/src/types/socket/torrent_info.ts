import { TorrentPeer } from "./torrent_peer";

export interface TorrentInfo {
    name: string;
    info_hash: string;
    progress: number; // 0-100
    state: string;
    paused: boolean;
    total_download: number;
    total_size: number;
    download_rate: number;
    upload_rate: number;
    num_peers: number;
    seeders: number;
    leechers: number;
    peers: TorrentPeer[]; // New field
}
