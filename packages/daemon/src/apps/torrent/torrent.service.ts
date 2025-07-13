import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import { readFile } from 'fs/promises';
import { getInfoHash } from './utils/get_info_hash';
import { TorrentDataObject } from './dto/Torrent';
import { TorrentGateway } from './torrent.gateway';

@Injectable()
export class TorrentService {
    private readonly logger = new Logger(TorrentService.name);
    private managedProcesses: { [key: string]: TorrentDataObject } = {};

    constructor(
        @Inject(forwardRef(() => TorrentGateway))
        private readonly torrentGateway: TorrentGateway,
    ) {}

    private getTorrentProcess(infoHash: string): TorrentDataObject {
        const torrentData = this.managedProcesses[infoHash];
        if (!torrentData) {
            throw new Error(`No torrent found with infoHash: ${infoHash}`);
        }
        return torrentData;
    }
    private getWorker(infoHash: string): Worker {
        const torrentData = this.getTorrentProcess(infoHash);
        return torrentData.worker;
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
                payload:
                    type === 'torrent' ? payload.toString('base64') : payload, // send buffer as base64
            },
        });
        let torrentData = new TorrentDataObject({ infoHash, worker });

        worker.on('message', (msg) => {
            if (msg.type === 'metadata') {
                this.logger.log(`Torrent metadata received: ${infoHash}`);
                torrentData;
                this.logger.log(
                    `Torrent started: ${torrentData.name} (${torrentData.infoHash})`,
                );
            } else if (msg.type === 'progress') {
                torrentData.progress = msg.progress;
                torrentData.downloaded = msg.downloaded;
                torrentData.total = msg.total;
                torrentData.downloadSpeed = msg.downloadSpeed;
                torrentData.numPeers = msg.numPeers;
            } else {
                this.logger.warn(`Unhandled message type: ${msg.type}`);
            }
        });

        worker.on('error', (err) => {
            this.logger.error(`Worker error: ${err.message}`);
        });

        worker.on('exit', (code) => {
            this.logger.log(`Worker exited with code ${code}`);
        });

        torrentData = new Proxy(torrentData as any, {
            set: (target: any, prop: string | symbol, value: any) => {
                target[prop] = value;
                this.logger.debug(
                    `Updated value for ${torrentData.infoHash}: ${String(prop)} = ${value}`,
                );
                this.managedProcesses[infoHash] = target;
                this.torrentGateway.broadcastUpdate(
                    torrentData.infoHash,
                    prop,
                    value,
                );
                return true;
            },
        });
        this.managedProcesses[infoHash] = torrentData;

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
                    reject(
                        new Error(
                            `Failed to pause torrent: ${JSON.stringify(msg)}`,
                        ),
                    );
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

    async removeTorrent(infoHash: string) {
        const worker = this.getWorker(infoHash);
        return new Promise<void>((resolve, reject) => {
            worker.postMessage('remove');
            worker.once('message', (msg) => {
                if (msg.type === 'removed') {
                    delete this.managedProcesses[infoHash];
                    resolve();
                } else {
                    reject(
                        new Error(
                            `Failed to remove torrent: ${JSON.stringify(msg)}`,
                        ),
                    );
                }
            });
        });
    }

    async getProcesses(): Promise<Omit<TorrentDataObject, 'worker'>[]> {
        return Object.values(this.managedProcesses).map(
            ({ worker, ...rest }) => rest,
        );
    }
}
