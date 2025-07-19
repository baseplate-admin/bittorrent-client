export interface TorrentPeer {
    ip: string;
    client: string;
    flags: string;
    progress: number; // 0-100
    download_speed: number; // bytes/sec
    upload_speed: number; // bytes/sec
}
