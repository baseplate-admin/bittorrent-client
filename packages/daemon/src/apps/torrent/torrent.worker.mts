import WebTorrent, { Torrent } from 'webtorrent';
import { parentPort, workerData } from 'worker_threads';

const client = new WebTorrent();

let source: string | Buffer;
let torrent: Torrent | null = null;

if (workerData.type === 'magnet') {
    source = workerData.payload;
} else if (workerData.type === 'torrent') {
    source = Buffer.from(workerData.payload, 'base64');
} else {
    parentPort.postMessage({ error: 'Invalid worker data type' });
    process.exit(1);
}

function addTorrent() {
    torrent = client.add(source, {}, () => {
        if (!torrent) return;
        parentPort.postMessage({
            type: 'metadata',
            name: torrent.name,
            infoHash: torrent.infoHash,
            files: torrent.files.map((f) => ({
                name: f.name,
                length: f.length,
            })),
            totalSize: torrent.length,
            numFiles: torrent.files.length,
        });
    });

    // Progress updates
    torrent.on('download', () => {
        if (!torrent) return;
        const progress = (torrent.progress * 100).toFixed(2);
        parentPort.postMessage({
            type: 'progress',
            progress: Number(progress),
            downloaded: torrent.downloaded,
            total: torrent.length,
            downloadSpeed: torrent.downloadSpeed,
            numPeers: torrent.numPeers,
        });
    });

    torrent.on('done', () => {
        parentPort.postMessage({ type: 'done', status: 'download complete' });
        client.destroy();
    });

    torrent.on('error', (err: Error) => {
        parentPort.postMessage({ error: err.message });
    });
}

addTorrent();

parentPort.on('message', async (msg) => {
    if (msg === 'pause') {
        if (torrent) {
            // Pause by destroying torrent, but keep data in store
            await new Promise<void>((resolve, reject) => {
                torrent!.destroy({ destroyStore: false }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            torrent = null;
            parentPort.postMessage({ type: 'paused' });
        }
    } else if (msg === 'resume') {
        if (!torrent) {
            addTorrent();
            parentPort.postMessage({ type: 'resumed' });
        }
    }
});

client.on('error', (err: Error) => {
    parentPort.postMessage({ error: err.message });
    client.destroy();
});
