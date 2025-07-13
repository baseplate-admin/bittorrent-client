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
    uploadSpeed: number | null;
    downloadSpeed: number | null;
    numPeers: number | null;
    status: 'downloading' | 'paused' | 'seeding' | 'error' | null;
    peers: Peer[];

    constructor({
        infoHash,
        worker,
        name = null,
        files = null,
        totalSize = null,
        numFiles = null,
        progress = null,
        downloaded = null,
        downloadSpeed = null,
        uploadSpeed = null,
        numPeers = null,
        peers = [],
        status = null,
    }: {
        infoHash: string;
        worker: Worker;
        name?: string | null;
        files?: File[] | null;
        totalSize?: number | null;
        numFiles?: number | null;
        progress?: number | null;
        downloaded?: number | null;
        downloadSpeed?: number | null;
        uploadSpeed?: number | null;
        numPeers?: number | null;
        peers?: Peer[];
        status?: 'downloading' | 'paused' | 'seeding' | 'error' | null;
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
        this.uploadSpeed = uploadSpeed;
        this.downloadSpeed = downloadSpeed;
        this.numPeers = numPeers;

        this.status = status;
        this.peers = peers;
    }
}
