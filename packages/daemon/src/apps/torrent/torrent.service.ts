// src/torrent.service.ts
import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { getInfoHash } from './utils/get_info_hash';
import { TorrentDataObject, TrackerInfo, File } from './dto/Torrent';
import { TorrentGateway } from './torrent.gateway';

@Injectable()
export class TorrentService {
    private readonly logger = new Logger(TorrentService.name);
    private managedProcesses: Record<string, TorrentDataObject> = {};

    constructor(
        @Inject(forwardRef(() => TorrentGateway))
        private readonly torrentGateway: TorrentGateway,
    ) {}

    private getWorker(infoHash: string): Worker {
        const td = this.managedProcesses[infoHash];
        if (!td) throw new Error(`No torrent: ${infoHash}`);
        return td.worker;
    }

    async startTorrent(input: string | Buffer) {
        const infoHash = await getInfoHash(input);
        const workerPath = resolve(__dirname, 'torrent.worker.mjs');

        let type: 'magnet' | 'torrent' = 'magnet';
        let payload: string | Buffer = input;
        if (typeof input === 'string') {
            if (input.startsWith('magnet:?')) type = 'magnet';
            else if (input.endsWith('.torrent')) {
                type = 'torrent';
                payload = await readFile(input);
            } else throw new Error('Must be magnet link or .torrent');
        } else if (Buffer.isBuffer(input)) {
            type = 'torrent';
        }

        const worker = new Worker(workerPath, {
            workerData: {
                type,
                payload:
                    type === 'torrent' ? payload.toString('base64') : payload,
            },
        });

        let torrentData = new TorrentDataObject({ infoHash, worker });

        worker.on('message', (msg) => {
            if (msg.error) {
                this.logger.error(`Worker error: ${msg.error}`);
                return;
            }

            // spread all incoming properties onto torrentData
            Object.entries(msg).forEach(([k, v]) => {
                if (k === 'type') return; // skip
                (torrentData as any)[k] = v;
            });
        });

        worker.on('error', (err) => this.logger.error(err.message));
        worker.on('exit', (code) => this.logger.log(`Worker exit ${code}`));

        // proxy traps every set to broadcast via WebSocket
        torrentData = new Proxy(torrentData as any, {
            set: (tgt, prop, val) => {
                tgt[prop as string] = val;
                this.managedProcesses[infoHash] = tgt;
                this.logger.debug(
                    `Update ${infoHash}:${String(prop)} = ${val}`,
                );
                this.torrentGateway.broadcastUpdate(
                    infoHash,
                    prop as string,
                    val,
                );
                return true;
            },
        });

        this.managedProcesses[infoHash] = torrentData;
        return infoHash;
    }

    async pauseTorrent(infoHash: string) {
        const w = this.getWorker(infoHash);
        return new Promise<void>((res, rej) => {
            w.postMessage('pause');
            w.once('message', (m) => (m.type === 'paused' ? res() : rej(m)));
        });
    }

    async resumeTorrent(infoHash: string) {
        const w = this.getWorker(infoHash);
        return new Promise<void>((res, rej) => {
            w.postMessage('resume');
            w.once('message', (m) => (m.type === 'resumed' ? res() : rej(m)));
        });
    }
    async removeTorrent(infoHash: string) {}
    async getProcesses(): Promise<Omit<TorrentDataObject, 'worker'>[]> {
        return Object.values(this.managedProcesses).map(
            ({ worker, ...rest }) => rest,
        );
    }
}
