'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAtom, useSetAtom } from 'jotai';
import {
    torrentAtom,
    torrentUploadMagnetQueueAtom,
    torrentUploadFileQueueAtom,
    torrentPauseQueueAtom,
    torrentResumeQueueAtom,
    torrentRemoveQueueAtom,
} from '@/atoms/torrent';
import { fileToBuffer } from '@/lib/fileToBuffer';
import { safeJsonParse } from '@/lib/safeJsonParse';
import { dequeue, peekQueue } from '@/lib/queue';
import { TorrentInfo } from '@/types/socket/torrent_info';
import { GetAllResponse } from '@/types/socket/get_all';
import { MagnetResponse } from '@/types/socket/add_magnet';
import { BroadcastResponse, SerializedAlert } from '@/types/socket/broadcast';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'ws://localhost:8080';
const socket = io(socketUrl);

function getSpecificTorrentFromSocket(info_hash: string) {
    return new Promise<TorrentInfo>((resolve, reject) => {
        socket.emit('get_specific', { info_hash }, (response: any) => {
            if (response) {
                resolve(response.torrent);
            } else {
                reject(
                    new Error(`Torrent with info_hash ${info_hash} not found`)
                );
            }
        });
    });
}

export default function SocketProvider() {
    const [torrent, setTorrent] = useAtom(torrentAtom);
    const [torrentUploadFileQueue, setTorrentUploadFileQueue] = useAtom(
        torrentUploadFileQueueAtom
    );
    const [torrentUploadMagnetQueue, setTorrentUploadMagnetQueue] = useAtom(
        torrentUploadMagnetQueueAtom
    );
    const [torrentPauseQueue, setTorrentPauseQueue] = useAtom(
        torrentPauseQueueAtom
    );
    const [torrentResumeQueue, setTorrentResumeQueue] = useAtom(
        torrentResumeQueueAtom
    );
    const [torrentRemoveQueue, setTorrentRemoveQueue] = useAtom(
        torrentRemoveQueueAtom
    );

    const writeBackToAtom = () => {
        if (latestTorrentsRef.current) {
            setTorrent([...latestTorrentsRef.current]);
        }
    };
    const latestTorrentsRef = useRef<TorrentInfo[] | null>(null);
    useEffect(() => {
        const interval = setInterval(() => {
            writeBackToAtom();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // OnMount
    useEffect(() => {
        socket.emit('get_all', (response: GetAllResponse) => {
            if (response) {
                latestTorrentsRef?.current?.push(...response.torrents);
                setTorrent([...response.torrents]);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (torrent !== null) {
            socket.emit(
                'broadcast',
                { event: 'start' },
                (response: BroadcastResponse) => {
                    if (response.status !== 'success') {
                        console.error(
                            'Failed to start broadcast:',
                            response.message
                        );
                    }
                }
            );
        }

        socket.on('broadcast', async (response: SerializedAlert) => {
            switch (response.type) {
                case 'add_torrent': {
                    const newTorrentInfoHash = response.info_hash;
                    const torrentInformation =
                        await getSpecificTorrentFromSocket(newTorrentInfoHash);
                    if (!latestTorrentsRef.current) {
                        latestTorrentsRef.current = [torrentInformation];
                    } else {
                        const exists = latestTorrentsRef.current.some(
                            (t) => t.info_hash === torrentInformation.info_hash
                        );
                        if (!exists) {
                            latestTorrentsRef.current.push(torrentInformation);
                        }
                    }
                    break;
                }

                case 'metadata_received':
                    // optionally log or update metadata flag
                    break;

                case 'state_update': {
                    const message = response.statuses;
                    if (!latestTorrentsRef.current) return;

                    for (const status of message) {
                        const t = latestTorrentsRef.current.find(
                            (t) => t.info_hash === status.info_hash
                        );
                        if (t) {
                            t.progress = status.progress;
                            t.download_rate = status.download_rate;
                            t.upload_rate = status.upload_rate;
                            t.num_peers = status.num_peers;
                            // @ts-expect-error: assuming type mismatch
                            t.state = status.state;
                        }
                    }
                    break;
                }

                default:
                    break;
            }
        });
    }, [torrent]);

    // Magnet queue processing
    useEffect(() => {
        if (torrentUploadMagnetQueue.length > 0) {
            const magnet = peekQueue(torrentUploadMagnetQueue);
            if (!magnet) return;

            socket.emit(
                'add_magnet',
                { magnet },
                (response: MagnetResponse) => {
                    if (response.status === 'success') {
                        dequeue(
                            torrentUploadMagnetQueue,
                            setTorrentUploadMagnetQueue
                        );
                    } else {
                        console.error(
                            'Failed to upload magnet:',
                            response.message
                        );
                    }
                }
            );
        }
    }, [torrentUploadMagnetQueue]);

    return <></>;
}
