import { Worker } from 'worker_threads';

type File = {
    name: string;
    length: number;
    downloaded?: number;
    progress?: number;
    path?: string;
};

// New Peer type to represent connected peers
type Peer = {
    country: string | null;
    ipAddress: string;
    port: number;
    connectionType: string;
    flags: string;
    client: string;
    progress: number; // As decimal (12.6% = 0.126)
    downloadSpeed: number; // In bytes/second
    uploadSpeed: number; // In bytes/second
    downloaded: number; // In bytes
    uploaded: number; // In bytes
    relevance: number; // As decimal (0.0% = 0.0)
};

export class TorrentDataObject {
    // Existing torrent properties
    name: string | null;
    files: File[] | null;
    infoHash: string;
    totalSize: number | null;
    numFiles: number | null;
    worker: Worker;
    progress: number | null;
    downloaded: number | null;
    total: number | null;
    downloadSpeed: number | null;
    numPeers: number | null;

    // New peer-related properties
    peers: Peer[]; // Array of connected peers

    constructor({
        infoHash,
        worker,
        name = null,
        files = null,
        totalSize = null,
        numFiles = null,
        progress = null,
        downloaded = null,
        total = null,
        downloadSpeed = null,
        numPeers = null,
        peers = [], // Initialize peers as empty array
    }: {
        infoHash: string;
        worker: Worker;
        name?: string | null;
        files?: File[] | null;
        totalSize?: number | null;
        numFiles?: number | null;
        progress?: number | null;
        downloaded?: number | null;
        total?: number | null;
        downloadSpeed?: number | null;
        numPeers?: number | null;
        peers?: Peer[]; // New optional peers parameter
    }) {
        // Assign existing properties
        this.infoHash = infoHash;
        this.worker = worker;
        this.name = name;
        this.files = files;
        this.totalSize = totalSize;
        this.numFiles = numFiles;
        this.progress = progress;
        this.downloaded = downloaded;
        this.total = total;
        this.downloadSpeed = downloadSpeed;
        this.numPeers = numPeers;

        // New peer connections array
        this.peers = peers;
    }
}
