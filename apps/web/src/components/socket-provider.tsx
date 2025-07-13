'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAtom } from 'jotai';
import { torrentAtom } from '@/atoms/torrentAtom';
import type { Torrent } from '@/types/Torrent';

export default function SocketProvider() {
    const [torrent, setTorrent] = useAtom(torrentAtom);
    const latestTorrentsRef = useRef<Torrent[] | null>(null);

    useEffect(() => {
        const socketUrl =
            process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        socket.emit('get_all');

        socket.on('get_all', (data: Torrent[]) => {
            latestTorrentsRef.current = data;
            setTorrent(latestTorrentsRef.current);
        });

        socket.on(
            'progress',
            (data: { infoHash: string; prop: string; value: any }) => {
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

                if (data.prop.startsWith('peers')) {
                    torrent.peers = JSON.parse(data.value);
                } else if (data.prop.startsWith('files')) {
                    torrent.files = JSON.parse(data.value);
                } else {
                    (torrent as any)[data.prop] = data.value;
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
    }, [setTorrent]);

    return null;
}
