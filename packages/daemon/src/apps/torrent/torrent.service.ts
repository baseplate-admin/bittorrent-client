import { Injectable, Logger } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { getInfoHash } from './utils/get_info_hash';
import WebTorrent from 'webtorrent';

@Injectable()
export class TorrentService {
  private readonly logger = new Logger(TorrentService.name);
  private managedProcesses: { [key: string]: Worker } = {};
  private getWorker(infoHash: string): Worker {
    const worker = this.managedProcesses[infoHash];
    if (!worker) {
      throw new Error(`No torrent found with infoHash: ${infoHash}`);
    }
    return worker;
  }

  async startTorrent(input: string | Buffer) {
    const infoHash = await getInfoHash(input);

    const workerPath = resolve(__dirname, 'torrent.worker.mjs');

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
    this.managedProcesses[infoHash] = worker;

    worker.on('message', (msg) => {
      //this.logger.log(`Worker message: ${JSON.stringify(msg)}`);
      if (msg.type === 'metadata') {
        this.logger.log(`Torrent metadata received: ${msg.name}`);
      }
    });

    worker.on('error', (err) => {
      this.logger.error(`Worker error: ${err.message}`);
    });

    worker.on('exit', (code) => {
      this.logger.log(`Worker exited with code ${code}`);
    });

    return infoHash;
  }
  async pauseTorrent(infoHash: string) {
    const worker = this.getWorker(infoHash);

    return new Promise<void>((resolve, reject) => {
      worker.postMessage('pause');
      worker.once('message', (msg) => {
        if (msg.type === 'paused') {
          resolve();
        } else {
          reject(new Error(`Failed to pause torrent: ${JSON.stringify(msg)}`));
        }
      });
    });
  }

  async resumeTorrent(infoHash: string) {
    const worker = this.getWorker(infoHash);

    return new Promise<void>((resolve, reject) => {
      worker.postMessage('resume');
      worker.once('message', (msg) => {
        if (msg.type === 'resumed') {
          resolve();
        } else {
          reject(new Error(`Failed to resume torrent: ${msg}`));
        }
      });
    });
  }

  async getProgress(infoHash: string) {
    const worker = this.getWorker(infoHash);
    

  }

  async getProcesses() {
    return this.managedProcesses;
  }
}
