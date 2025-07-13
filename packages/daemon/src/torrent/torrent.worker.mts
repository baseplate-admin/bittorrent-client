import WebTorrent from 'webtorrent';
import { parentPort, workerData } from 'worker_threads';

const client = new WebTorrent();

let source ;

if (workerData.type === 'magnet') {
  source = workerData.payload;
} else if (workerData.type === 'torrent') {
  source = Buffer.from(workerData.payload, 'base64'); // decode torrent file
} else {
  parentPort.postMessage({ error: 'Invalid torrent input type' });
  process.exit(1);
}

console.log('🌀 Adding torrent to client');

client.add(source, (torrent) => {
  parentPort.postMessage({
    name: torrent.name,
    files: torrent.files.map((f) => f.name),
  });

  torrent.on('download', () => {
    const progress = ((torrent.downloaded / torrent.length) * 100).toFixed(2);
    parentPort.postMessage({ progress });
  });

  torrent.on('done', () => {
    parentPort.postMessage({ status: 'done' });
    client.destroy();
  });
});

client.on('error', (err: Error) => {
  parentPort.postMessage({ error: err.message });
});
