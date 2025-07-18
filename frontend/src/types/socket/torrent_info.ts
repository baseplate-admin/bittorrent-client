import { TorrentPeer } from "./torrent_peer";
import { FileInfo } from "./files";

export interface TrackerInfo {
    url: string;
    tier: number;
    fail_limit: number;
    source: number;
    verified: boolean;
}

export interface DHTNode {
    host: string;
    port: number;
}
interface Peer {
    ip: string;
    client: Record<string, any>;
    progress: number;
    flags: number;
    download_queue_length: number;
    upload_queue_length: number;
    up_speed: number;
    down_speed: number;
    total_download: number;
    total_upload: number;
    seed: boolean;
}

export interface TorrentInfo {
    name: string;
    comment: string;
    creator: string;
    info_hash: string;
    info_hash_v2?: string | null;
    total_size: number;
    piece_length: number;
    num_pieces: number;
    is_private: boolean;
    creation_date: number; // unix timestamp?
    num_files: number;
    metadata_size: number;
    save_path: string;
    added_time: number;
    eta?: number;
    completion_time?: number | null;
    progress: number; // percentage 0-100
    downloaded: number;
    uploaded: number;
    download_rate: number;
    upload_rate: number;
    share_ratio?: number | null;
    connections: number;
    seeds: number;
    peers: Peer[];
    wasted: number;
    active_time: number;
    seeding_time: number;
    finished: boolean;
    files: FileInfo[];
    trackers: TrackerInfo[];
    nodes: DHTNode[];
    url_seeds: string[];
    http_seeds: string[];
    state:
        | "seeding"
        | "downloading"
        | "paused"
        | "checking"
        | "queued"
        | "error"
        | "unknown";

    // Derived
    paused: boolean;
    leechs: number; // Number of peers minus seeds

    peers_info?: TorrentPeer[];
}
