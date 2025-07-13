import WebTorrent, { Torrent } from 'webtorrent';
import { parentPort, workerData } from 'worker_threads';

const client = new WebTorrent({
    maxConns: 5000,
});
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

function emitTorrentData(type: string) {
    if (!torrent) return;

    const totalPieces = torrent.pieces.length;

    const data = {
        type,
        infoHash: torrent.infoHash,
        name: torrent.name,
        files: torrent.files.map((f) => ({
            name: f.name,
            length: f.length,
            downloaded: f.downloaded,
            progress: f.progress,
            path: f.path,
        })),
        totalSize: torrent.length,
        numFiles: torrent.files.length,
        progress: Number((torrent.progress * 100).toFixed(2)),
        downloaded: torrent.downloaded,
        total: torrent.length,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        numPeers: torrent.numPeers,
        peers: (torrent as any).wires.map((wire) => {
            let piecesCount = 0;
            if (wire.peerPieces && totalPieces > 0) {
                for (let i = 0; i < totalPieces; i++) {
                    if (wire.peerPieces.get(i)) piecesCount++;
                }
            }
            const peerProgressPercent =
                totalPieces > 0 ? (piecesCount / totalPieces) * 100 : 0;

            return {
                ipAddress: wire.remoteAddress || 'unknown',
                port: wire.remotePort || 0,
                connectionType: wire.type || 'tcp',
                flags: wire.peerExtendedHandshake?.m || '',
                client: wire.peerExtendedHandshake?.v || 'unknown',
                progress: Number(peerProgressPercent.toFixed(2)),
                downloaded: wire.downloaded,
                uploaded: wire.uploaded,
                relevance:
                    typeof wire.relevance === 'number' ? wire.relevance : 0,
            };
        }),
    };

    parentPort.postMessage(data);
}

function addTorrent() {
    torrent = client.add(source, {}, () => {
        emitTorrentData('metadata');
    });

    torrent.on('download', () => emitTorrentData('progress'));
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
    if (msg === 'pause' && torrent) {
        await new Promise<void>((resolve, reject) => {
            torrent!.destroy({ destroyStore: false }, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        torrent = null;
        parentPort.postMessage({ type: 'paused' });
    } else if (msg === 'resume' && !torrent) {
        addTorrent();
        parentPort.postMessage({ type: 'resumed' });
    } else if (msg === 'remove') {
        if (torrent) torrent.destroy(undefined, () => {});
        parentPort.postMessage({ type: 'removed' });
    }
});

client.on('error', (err: Error) => {
    parentPort.postMessage({ error: err.message });
    client.destroy();
});
