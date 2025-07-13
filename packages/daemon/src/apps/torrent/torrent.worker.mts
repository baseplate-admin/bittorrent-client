import WebTorrent, { Torrent, Options } from 'webtorrent';
import { parentPort, workerData } from 'worker_threads';

const client = new WebTorrent({
    maxConns: 5000,
    ...(process.platform === 'win32' ? { utp: false } : {}),
} satisfies Options);

const source: string | Buffer =
    workerData.type === 'magnet'
        ? workerData.payload
        : workerData.type === 'torrent'
          ? Buffer.from(workerData.payload, 'base64')
          : (() => {
                parentPort.postMessage({ error: 'Invalid worker data type' });
                process.exit(1);
            })();

let torrent: Torrent;

function emitTorrentData(type: string) {
    const totalPieces = torrent.pieces.length;
    const data = {
        type,
        infoHash: torrent.infoHash,
        name: torrent.name,
        totalSize: torrent.length,
        numFiles: torrent.files.length,
        progress: +(torrent.progress * 100).toFixed(2),
        downloaded: torrent.downloaded,
        total: torrent.length,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        numPeers: torrent.numPeers,
        files: torrent.files.map((f) => ({
            name: f.name,
            length: f.length,
            downloaded: f.downloaded,
            progress: f.progress,
            path: f.path,
        })),
        peers: (torrent as any).wires.map((wire) => {
            const piecesCount = wire.peerPieces
                ? Array.from({ length: totalPieces }, (_, i) =>
                      wire.peerPieces.get(i) ? 1 : 0,
                  ).reduce((a, b) => a + b, 0)
                : 0;
            const client = wire.peerExtendedHandshake?.v
                ? Buffer.from(wire.peerExtendedHandshake.v).toString('utf-8')
                : 'unknown';

            return {
                ipAddress: wire.remoteAddress || 'unknown',
                port: wire.remotePort || 0,
                connectionType: wire.type || 'tcp',
                flags: wire.peerExtendedHandshake?.m || '',
                client,
                progress: +((piecesCount / totalPieces) * 100).toFixed(2),
                downloaded: wire.downloaded,
                uploaded: wire.uploaded,
                relevance:
                    typeof wire.relevance === 'number' ? wire.relevance : 0,
            };
        }),
    };
    parentPort.postMessage(data);
}

torrent = client.add(source, {});

torrent.on('download', () => emitTorrentData('progress'));
torrent.on('done', () =>
    parentPort.postMessage({ type: 'done', status: 'download complete' }),
);
torrent.on('error', (err: Error) =>
    parentPort.postMessage({ error: err.message }),
);

parentPort.on('message', (msg) => {
    if (!torrent) return;
    if (msg === 'pause') {
        torrent.pause();
        parentPort.postMessage({ type: 'paused' });
    } else if (msg === 'resume') {
        torrent.resume();
        parentPort.postMessage({ type: 'resumed' });
    } else if (msg === 'remove') {
        torrent.destroy(undefined, () => {
            parentPort.postMessage({ type: 'removed' });
        });
    }
});

client.on('error', (err: Error) => {
    parentPort.postMessage({ error: err.message });
    client.destroy();
});
