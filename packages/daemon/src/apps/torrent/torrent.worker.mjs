import WebTorrent from 'webtorrent';
import { Client as TrackerClient } from 'bittorrent-tracker';
import { parentPort, workerData } from 'worker_threads';

const client = new WebTorrent();
let source,
    torrent = null;

if (workerData.type === 'magnet') {
    source = workerData.payload;
} else if (workerData.type === 'torrent') {
    source = Buffer.from(workerData.payload, 'base64');
} else {
    parentPort.postMessage({ error: 'Invalid worker data type' });
    process.exit(1);
}

function scrapeTracker(infoHash, url) {
    return new Promise((resolve) => {
        const tc = new TrackerClient({ infoHash, announce: [url] });
        tc.scrape((err, stats) => {
            if (err) {
                resolve({ url, error: err.message });
            } else {
                resolve({
                    url,
                    peers: (stats.complete || 0) + (stats.incomplete || 0),
                    seeds: stats.complete || 0,
                    leeches: stats.incomplete || 0,
                });
            }
            tc.stop();
        });
    });
}

async function scrapeAllTrackers(infoHash, announceList) {
    // flatten and dedupe
    const urls = Array.from(new Set(announceList.flat()));
    // run in parallel
    const results = await Promise.all(
        urls.map((url) => scrapeTracker(infoHash, url)),
    );
    return results;
}

async function emitTorrentData(type) {
    if (!torrent) return;

    // run scrapes
    const scrapes = await scrapeAllTrackers(
        torrent.infoHash,
        torrent.announceList || [],
    );
    // map to your TrackerInfo shape
    const trackers = scrapes.map((s) => ({
        url: s.url,
        tier: 0,
        status: s.error ? 'ERROR' : 'OK',
        peers: s.peers || 0,
        seeds: s.seeds || 0,
        leeches: s.leeches || 0,
        timeDownloaded: Math.floor(
            (Date.now() - (torrent._startTime || Date.now())) / 1000,
        ),
        message: s.error || '',
        nextAnnounce: 0,
        minAnnounce: 0,
    }));

    parentPort.postMessage({
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
        numPeers: torrent.numPeers,
        trackers,
    });
}

function addTorrent() {
    torrent = client.add(source, {}, async () => {
        torrent._startTime = Date.now();
        await emitTorrentData('metadata');
    });

    torrent.on('download', async () => {
        await emitTorrentData('progress');
    });

    torrent.on('done', () => {
        parentPort.postMessage({ type: 'done', status: 'download complete' });
        client.destroy();
    });

    torrent.on('error', (err) => {
        parentPort.postMessage({ error: err.message });
    });
}

addTorrent();

parentPort.on('message', async (msg) => {
    if (msg === 'pause' && torrent) {
        await new Promise((res, rej) =>
            torrent.destroy({ destroyStore: false }, (err) =>
                err ? rej(err) : res(),
            ),
        );
        torrent = null;
        parentPort.postMessage({ type: 'paused' });
    } else if (msg === 'resume' && !torrent) {
        addTorrent();
        parentPort.postMessage({ type: 'resumed' });
    }
});

client.on('error', (err) => {
    parentPort.postMessage({ error: err.message });
    client.destroy();
});
