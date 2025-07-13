'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSetAtom, useAtomValue, useAtom } from 'jotai';
import { torrentAtom } from '@/atoms/torrentAtom';
import type { Torrent } from '@/types/Torrent';

export default function SocketProvider() {
    const [torrent, setTorrent] = useAtom(torrentAtom);
    useEffect(() => {
        const socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
        });

        // Emit an request to get all the data
        socket.emit('get_all');
        socket.on('get_all', (data: Torrent) => {
            setTorrent(data);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        console.log('Torrent state updated:', torrent);
    }, [torrent]);

    return null;
}
