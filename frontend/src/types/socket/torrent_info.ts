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

export interface Peer {
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
    // Identifiers
    name: string;
    comment: string | null;
    creator: string | null;
    info_hash: string;
    info_hash_v2: string | null;

    // Sizes
    total_size: number | null;
    piece_length: number | null;
    num_pieces: number | null;
    metadata_size: number | null;

    // Metadata flags
    is_private: boolean | null;
    creation_date: number | null;
    num_files: number | null;

    // Storage
    save_path: string;

    // Time
    added_time: number;
    completion_time: number | null;
    active_time: number;
    seeding_time: number;
    next_announce: number; // in seconds

    // Progress
    progress: number; // 0–100 %
    finished: boolean;

    // Bandwidth & Data
    downloaded: number;
    uploaded: number;
    download_rate: number;
    upload_rate: number;
    wasted: number;

    // Connections
    connections: number;
    seeds: number;

    // Peers & Leeches
    peers: Peer[];
    connected_peers: number;
    connected_seeds: number;
    connected_leeches: number;
    total_known_peers: number;

    // Additional leeches count (total leeches from peer info)
    leechs?: number;

    // File info
    files: FileInfo[];
    trackers: TrackerInfo[];
    nodes: DHTNode[];
    url_seeds: string[];
    http_seeds: string[];

    // State
    state:
        | "metadata_present"
        | "metadata_missing"
        | "seeding"
        | "downloading"
        | "paused"
        | "checking"
        | "queued"
        | "error"
        | "unknown";
    paused?: boolean;

    // Derived
    eta?: number;
    peers_info?: TorrentPeer[];
}
