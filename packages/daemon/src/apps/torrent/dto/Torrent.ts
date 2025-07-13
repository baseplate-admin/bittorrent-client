import { Worker } from 'worker_threads';

type File = {
    name: string;
    length: number;
    downloaded?: number;
    progress?: number;
    path?: string;
};

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
        });
    }
}
