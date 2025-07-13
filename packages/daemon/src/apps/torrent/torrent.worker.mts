import WebTorrent from 'webtorrent';
import { parentPort, workerData } from 'worker_threads';

const client = new WebTorrent();

let source;

if (workerData.type === 'magnet') {
  source = workerData.payload;
} else if (workerData.type === 'torrent') {
  source = Buffer.from(workerData.payload, 'base64');
} else {
  parentPort.postMessage({ error: 'Invalid torrent input type' });
  process.exit(1);
}

console.log('🌀 Adding torrent to client');

client.add(source, { destroyStoreOnDestroy: true }, (torrent) => {
  // Send metadata once ready
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

  // Periodic download progress updates
  torrent.on('download', () => {
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

  // When download is done
  torrent.on('done', () => {
    parentPort.postMessage({ type: 'done', status: 'download complete' });
    client.destroy();
  });
});

client.on('error', (err: Error) => {
  parentPort.postMessage({ error: err.message });
  client.destroy();
});
