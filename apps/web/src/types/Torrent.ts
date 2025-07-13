export type File = {
    name: string;
    length: number;
    downloaded?: number;
    progress?: number;
    path?: string;
};

export type Peer = {
    ipAddress: string;
    port: number;
    connectionType: string;
    flags: string;
    client: string;
    progress: number; // decimal e.g. 0.126 for 12.6%
    downloadSpeed: number; // bytes/sec
    uploadSpeed: number; // bytes/sec
    downloaded: number; // bytes
    uploaded: number; // bytes
    relevance: number; // decimal
};

export type Torrent = {
    name: string | null;
    files: File[] | null;
    infoHash: string;
    totalSize: number | null;
    numFiles: number | null;
    progress: number | null;
    downloaded: number | null;
    total: number | null;
    downloadSpeed: number | null;
    numPeers: number | null;
    peers: Peer[];
};
