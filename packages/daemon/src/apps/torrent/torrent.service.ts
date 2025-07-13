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
    private managedProcesses: { [infoHash: string]: TorrentDataObject } = {};

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
        return this.getTorrentProcess(infoHash).worker;
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
                payload = await readFile(input);
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
                    type === 'torrent' ? payload.toString('base64') : payload,
            },
        });

        let torrentData = new TorrentDataObject({ infoHash, worker });

        worker.on('message', (msg) => {
            if (msg.error) {
                this.logger.error(`Worker error: ${msg.error}`);
                return;
            }

            switch (msg.type) {
                case 'metadata':
                    this.logger.log(`Metadata received for ${infoHash}`);
                    torrentData.name = msg.name;
                    torrentData.files = msg.files;
                    torrentData.totalSize = msg.totalSize;
                    torrentData.numFiles = msg.numFiles;
                    break;

                case 'progress':
                    torrentData.progress = msg.progress;
                    torrentData.downloaded = msg.downloaded;
                    torrentData.total = msg.total;
                    torrentData.downloadSpeed = msg.downloadSpeed;
                    torrentData.numPeers = msg.numPeers;
                    torrentData.peers = msg.peers || [];
                    break;

                case 'done':
                    this.logger.log(`Download complete for ${infoHash}`);
                    break;

                case 'paused':
                    this.logger.log(`Torrent paused: ${infoHash}`);
                    break;

                case 'resumed':
                    this.logger.log(`Torrent resumed: ${infoHash}`);
                    break;

                case 'removed':
                    this.logger.log(`Torrent removed: ${infoHash}`);
                    delete this.managedProcesses[infoHash];
                    break;

                default:
                    this.logger.warn(
                        `Unhandled message type from worker: ${msg.type}`,
                    );
                    break;
            }
        });

        worker.on('error', (err) => {
            this.logger.error(`Worker error for ${infoHash}: ${err.message}`);
        });

        worker.on('exit', (code) => {
            this.logger.log(`Worker for ${infoHash} exited with code ${code}`);
        });

        // Wrap in proxy to auto-broadcast changes
        torrentData = new Proxy(torrentData as any, {
            set: (target: any, prop: string | symbol, value: any) => {
                target[prop] = value;
                // this.logger.debug(
                //     `Updated ${String(prop)} for ${torrentData.infoHash}: ${JSON.stringify(value)}`,
                // );
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

    async pauseTorrent(infoHash: string): Promise<void> {
        const worker = this.getWorker(infoHash);
        return new Promise((resolve, reject) => {
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

    async resumeTorrent(infoHash: string): Promise<void> {
        const worker = this.getWorker(infoHash);
        return new Promise((resolve, reject) => {
            worker.postMessage('resume');
            worker.once('message', (msg) => {
                if (msg.type === 'resumed') {
                    resolve();
                } else {
                    reject(
                        new Error(
                            `Failed to resume torrent: ${JSON.stringify(msg)}`,
                        ),
                    );
                }
            });
        });
    }

    async removeTorrent(infoHash: string): Promise<void> {
        const worker = this.getWorker(infoHash);
        return new Promise((resolve, reject) => {
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

    getTorrent(infoHash: string): Omit<TorrentDataObject, 'worker'> {
        const { worker, ...rest } = this.getTorrentProcess(infoHash);
        return rest;
    }
}
