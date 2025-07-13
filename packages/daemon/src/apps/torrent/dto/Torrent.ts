// src/dto/Torrent.ts
import { Worker } from 'worker_threads';

export type File = {
    name: string;
    length: number;
    downloaded?: number;
    progress?: number;
    path?: string;
};

export interface TrackerInfo {
    url: string;
    tier: number;
    status: 'PENDING' | 'OK' | 'ERROR';
    peers: number;
    seeds: number;
    leeches: number;
    timeDownloaded: number;
    message: string;
    nextAnnounce: number;
    minAnnounce: number;
}

export class TorrentDataObject {
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
    trackers: TrackerInfo[] | null;

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
        trackers = null,
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
        trackers?: TrackerInfo[] | null;
    }) {
        Object.assign(this, {
            infoHash,
            worker,
            name,
            files,
            totalSize,
            numFiles,
            progress,
            downloaded,
            total,
            downloadSpeed,
            numPeers,
            trackers,
        });
    }
}
