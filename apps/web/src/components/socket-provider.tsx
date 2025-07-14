'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SetStateAction, useAtom, useSetAtom } from 'jotai';
import {
    torrentAtom,
    torrentUploadMagnetQueueAtom,
    torrentUploadFileQueueAtom,
} from '@/atoms/torrent';
import type { Torrent } from '@/types/Torrent';
import { fileToBuffer } from '@/lib/fileToBuffer';

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
                const value = JSON.parse(data.value);
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
            const handleDequeue = <T,>(
                queue: T[],
                setQueue: (update: SetStateAction<T[]>) => void
            ): T | null => {
                if (queue.length === 0) return null;

                const value = queue.shift();
                setQueue([...queue]);
                return value ?? null;
            };

            // Check if there are any items in the queues
            if (
                [torrentUploadFileQueue, torrentUploadMagnetQueue].every(
                    (q) => q.length === 0
                )
            )
                return;

            const file = handleDequeue(
                torrentUploadFileQueue,
                setTorrentUploadFileQueue
            );
            if (file) {
                const buffer = await fileToBuffer(file);
                const res = socket.emit('add', { data: buffer });
                console.log('Uploaded file:', file.name, 'Response:', res);
            }

            const magnet = handleDequeue(
                torrentUploadMagnetQueue,
                setTorrentUploadMagnetQueue
            );
            if (magnet) {
                socket.emit('add', { data: magnet });
                confirm(`Added magnet link: ${magnet}`);
            }
        })();
    }, [torrentUploadFileQueue, torrentUploadMagnetQueue, socket]);

    return null;
}
