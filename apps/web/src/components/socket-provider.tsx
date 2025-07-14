'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAtom, useSetAtom } from 'jotai';
import {
    torrentAtom,
    torrentUploadMagnetQueueAtom,
    torrentUploadFileQueueAtom,
} from '@/atoms/torrent';
import type { Torrent } from '@/types/Torrent';
import { fileToBuffer } from '@/lib/fileToBuffer';
import { safeJsonParse } from '@/lib/safeJsonParse';
import { dequeue, peekQueue } from '@/lib/queue';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
const socket = io(socketUrl);
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});
socket.on('disconnect', () => {
    console.log('Socket disconnected');
});

export default function SocketProvider() {
    const setTorrent = useSetAtom(torrentAtom);
    const [torrentUploadFileQueue, setTorrentUploadFileQueue] = useAtom(
        torrentUploadFileQueueAtom
    );
    const [torrentUploadMagnetQueue, setTorrentUploadMagnetQueue] = useAtom(
        torrentUploadMagnetQueueAtom
    );

    const latestTorrentsRef = useRef<Torrent[] | null>(null);

    useEffect(() => {
        socket.emit('get_all');

        socket.on('get_all', (data: Torrent[]) => {
            latestTorrentsRef.current = data;
            setTorrent(latestTorrentsRef.current);
        });

        socket.on(
            'progress',
            (data: { infoHash: string; prop: string; value: string }) => {
                if (!latestTorrentsRef.current) {
                    const newTorrent: Torrent = {
                        name: null,
                        files: null,
                        infoHash: data.infoHash ?? '',
                        totalSize: null,
                        numFiles: null,
                        progress: null,
                        downloaded: null,
                        total: null,
                        downloadSpeed: null,
                        numPeers: null,
                        peers: [],
                        status: null,
                    };
                    if (data.prop && data.value !== undefined) {
                        (newTorrent as any)[data.prop] = data.value;
                    }
                    latestTorrentsRef.current = [newTorrent];
                    setTorrent(latestTorrentsRef.current);
                    return;
                }

                const prev = latestTorrentsRef.current;
                const index = prev.findIndex(
                    (t) => t.infoHash === data.infoHash
                );
                if (index === -1) {
                    const newTorrent: Torrent = {
                        name: null,
                        files: null,
                        infoHash: data.infoHash ?? '',
                        totalSize: null,
                        numFiles: null,
                        progress: null,
                        downloaded: null,
                        total: null,
                        downloadSpeed: null,
                        numPeers: null,
                        peers: [],
                        status: null,
                    };
                    if (data.prop && data.value !== undefined) {
                        (newTorrent as any)[data.prop] = data.value;
                    }
                    latestTorrentsRef.current = [...prev, newTorrent];
                    return;
                }

                const newTorrents = [...prev];
                const torrent: Torrent = { ...newTorrents[index]! };

                torrent.peers = torrent.peers ? [...torrent.peers] : [];
                torrent.files = torrent.files ? [...torrent.files] : [];

                if (!data.prop) return;

                const value = safeJsonParse(data.value);

                if (data.prop.startsWith('peers')) {
                    torrent.peers = value;
                } else if (data.prop.startsWith('files')) {
                    torrent.files = value;
                } else {
                    (torrent as any)[data.prop] = value;
                }

                newTorrents[index] = torrent;
                latestTorrentsRef.current = newTorrents;
            }
        );

        const interval = setInterval(() => {
            setTorrent(latestTorrentsRef.current);
        }, 1000);

        return () => {
            clearInterval(interval);
            socket.disconnect();
            console.log('Socket disconnected');
        };
    }, [setTorrent, socket]);

    useEffect(() => {
        (async () => {
            if (
                torrentUploadFileQueue.length === 0 &&
                torrentUploadMagnetQueue.length === 0
            )
                return;

            const file = peekQueue(torrentUploadFileQueue);
            if (file) {
                const buffer = await fileToBuffer(file);
                socket.emit('add', { data: buffer }, (response: any) => {
                    if (response && response.success) {
                        dequeue(
                            torrentUploadFileQueue,
                            setTorrentUploadFileQueue
                        );
                        console.log(
                            'Uploaded file:',
                            file.name,
                            'Response:',
                            response
                        );
                    } else {
                        console.error(
                            'Failed to upload file:',
                            file.name,
                            'Response:',
                            response
                        );
                    }
                });
            }

            const magnet = peekQueue(torrentUploadMagnetQueue);
            if (magnet) {
                socket.emit('add', { data: magnet }, (response: any) => {
                    if (response && response.success) {
                        dequeue(
                            torrentUploadMagnetQueue,
                            setTorrentUploadMagnetQueue
                        );
                        console.log(
                            `Added magnet link: ${magnet}`,
                            'Response:',
                            response
                        );
                    } else {
                        console.error(
                            'Failed to add magnet link:',
                            magnet,
                            'Response:',
                            response
                        );
                    }
                });
            }
        })();
    }, [torrentUploadFileQueue, torrentUploadMagnetQueue, socket]);

    return null;
}
