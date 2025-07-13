'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAtom } from 'jotai';
import { torrentAtom } from '@/atoms/torrentAtom';
import type { Torrent } from '@/types/Torrent';

export default function SocketProvider() {
    const [, setTorrent] = useAtom(torrentAtom);
    const latestTorrentsRef = useRef<Torrent[] | null>(null);

    useEffect(() => {
        const socketUrl =
            process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        // Request initial full data
        socket.emit('get_all');

        socket.on('get_all', (data: Torrent[]) => {
            latestTorrentsRef.current = data;
            setTorrent(latestTorrentsRef.current);
        });

        socket.on(
            'progress',
            (data: { infoHash: string; prop: string; value: any }) => {
                if (!latestTorrentsRef.current) {
                    // No torrents yet — create new one
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
                    return;
                }

                // Update existing torrents immutably in the ref
                const prev = latestTorrentsRef.current;
                const index = prev.findIndex(
                    (t) => t.infoHash === data.infoHash
                );
                if (index === -1) {
                    // Add new torrent if not found
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

                if (data.prop.startsWith('peers[')) {
                    const match = data.prop.match(/peers\[(\d+)\]\.(.+)/);
                    if (!match) return;

                    const idxStr = match[1];
                    const key = match[2];
                    if (!idxStr || !key) return;

                    const idx = parseInt(idxStr, 10);
                    if (isNaN(idx)) return;

                    if (!torrent.peers[idx]) {
                        torrent.peers[idx] = {
                            ipAddress: '',
                            port: 0,
                            connectionType: '',
                            flags: '',
                            client: '',
                            progress: 0,
                            downloadSpeed: 0,
                            uploadSpeed: 0,
                            downloaded: 0,
                            uploaded: 0,
                            relevance: 0,
                        };
                    }

                    (torrent.peers[idx] as any)[key] = data.value;
                } else if (data.prop.startsWith('files[')) {
                    const match = data.prop.match(/files\[(\d+)\]\.(.+)/);
                    if (!match) return;

                    const idxStr = match[1];
                    const key = match[2];
                    if (!idxStr || !key) return;

                    const idx = parseInt(idxStr, 10);
                    if (isNaN(idx)) return;

                    if (!torrent.files[idx]) {
                        torrent.files[idx] = {
                            name: '',
                            length: 0,
                            downloaded: 0,
                            progress: 0,
                            path: '',
                        };
                    }

                    (torrent.files[idx] as any)[key] = data.value;
                } else {
                    (torrent as any)[data.prop] = data.value;
                }

                newTorrents[index] = torrent;
                latestTorrentsRef.current = newTorrents;
            }
        );

        // Flush latest data to atom every 1 second to update UI
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
