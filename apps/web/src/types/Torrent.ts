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
    progress: number;
    downloadSpeed: number;
    uploadSpeed: number;
    downloaded: number;
    uploaded: number;
    relevance: number;
    type: 'seeder' | 'leecher' | 'unknown';
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
