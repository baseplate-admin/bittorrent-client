import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

@Injectable()
export class TorrentService {
  private readonly logger = new Logger(TorrentService.name);

  async startTorrent(input: string | Buffer) {
    const workerPath = resolve(__dirname, 'torrent.worker.mts');

    let type: 'magnet' | 'torrent' = 'magnet';
    let payload: string | Buffer = input;

    if (typeof input === 'string') {
      if (input.startsWith('magnet:?')) {
        type = 'magnet';
      } else if (input.endsWith('.torrent')) {
        type = 'torrent';
        payload = await readFile(input); // read as buffer
      } else {
        throw new Error(
          'Invalid input: must be a magnet link or .torrent file path',
        );
      }
    } else if (Buffer.isBuffer(input)) {
      type = 'torrent';
    } else {
      throw new Error('Invalid input type');
    }

    const worker = new Worker(workerPath, {
      workerData: {
        type,
        payload: type === 'torrent' ? payload.toString('base64') : payload, // send buffer as base64
      },
    });

    worker.on('message', (msg) => {
      this.logger.log(`Worker message: ${JSON.stringify(msg)}`);
    });

    worker.on('error', (err) => {
      this.logger.error(`Worker error: ${err.message}`);
    });

    worker.on('exit', (code) => {
      this.logger.log(`Worker exited with code ${code}`);
    });
  }
}
