import { TorrentPeer } from "./torrent_peer";
import { FileInfo } from "./files";

export interface ErrorInfo {
    value: number;
    category: string;
}

export interface InfoHash {
    message: string;
    last_error: ErrorInfo;
    next_announce: number;
    min_announce: number;
    scrape_incomplete: number;
    scrape_complete: number;
    scrape_downloaded: number;
    fails: number;
    updating: boolean;
    start_sent: boolean;
    complete_sent: boolean;
}

export interface Endpoint {
    local_address: [string, number]; // [IP, port]
    info_hashes: InfoHash[];
    message: string;
    last_error: ErrorInfo;
    next_announce: number;
    min_announce: number;
    scrape_incomplete: number;
    scrape_complete: number;
    scrape_downloaded: number;
    fails: number;
    updating: boolean;
    start_sent: boolean;
    complete_sent: boolean;
}

export interface TrackerInfo {
    url: string;
    trackerid: string;
    tier: number;
    fail_limit: number;
    source: number;
    verified: boolean;
    message: string;
    last_error: ErrorInfo;
    next_announce: number;
    min_announce: number;
    scrape_incomplete: number;
    scrape_complete: number;
    scrape_downloaded: number;
    fails: number;
    updating: boolean;
    start_sent: boolean;
    complete_sent: boolean;
    endpoints: Endpoint[];
    send_stats: boolean;
}
export interface DHTNode {
    host: string;
    port: number;
}

export interface Peer {
    ip: string;
    port: number;
    client: string;
    connection_type: string;
    flags: string;
    progress: string;
    down_speed: number;
    up_speed: number;
    downloaded: number;
    uploaded: number;
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
    connected_peers: number;
    connected_seeds: number;
    connected_leeches: number;

    // File info
    trackers: TrackerInfo[];
    nodes: DHTNode[];
    url_seeds: string[];
    http_seeds: string[];

    // State
    state: string;
    paused?: boolean;
    peers_info?: TorrentPeer[];

    // Derived
    eta?: number;
}

export interface BroadcastTorrentInfo {
    // Identifiers
    name: string;
    info_hash: string;
    progress: number; // 0–100 %
    finished: boolean;

    paused: boolean;
    average_download_speed: number;
    average_upload_speed: number;

    // Bandwidth & Data
    download_rate: number;
    upload_rate: number;
    num_peers: number;
    num_seeds: number;
    total_size: number | null;
    state: string;
    eta?: number;
}
