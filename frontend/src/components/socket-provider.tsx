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
import type { Torrent } from '@/types/Torrent';
import { fileToBuffer } from '@/lib/fileToBuffer';
import { safeJsonParse } from '@/lib/safeJsonParse';
import { dequeue, peekQueue } from '@/lib/queue';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
const socket = io(socketUrl);

export default function SocketProvider() {
    const setTorrent = useSetAtom(torrentAtom);

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

    const latestTorrentsRef = useRef<Torrent[] | null>(null);

    // Basic socket connect/disconnect logging
    useEffect(() => {
        function onConnect() {
            console.log('Socket connected:', socket.id);
        }
        function onDisconnect() {
            console.log('Socket disconnected');
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    // Handle get_all and progress events
    useEffect(() => {
        function onGetAll(data: Torrent[]) {
            latestTorrentsRef.current = data;
            setTorrent(latestTorrentsRef.current);
        }

        function onProgress(data: {
            infoHash: string;
            prop: string;
            value: string;
        }) {
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
            const index = prev.findIndex((t) => t.infoHash === data.infoHash);
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

        socket.emit('get_all');

        socket.on('get_all', onGetAll);
        socket.on('progress', onProgress);

        const interval = setInterval(() => {
            setTorrent(latestTorrentsRef.current);
        }, 1000);

        return () => {
            socket.off('get_all', onGetAll);
            socket.off('progress', onProgress);
            clearInterval(interval);
        };
    }, [setTorrent]);

    // Handle uploading files and magnets queues
    useEffect(() => {
        (async () => {
            if (
                torrentUploadFileQueue.length === 0 &&
                torrentUploadMagnetQueue.length === 0
            )
                return;

            const file = peekQueue(torrentUploadFileQueue);
            if (file) {
                try {
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
                } catch (err) {
                    console.error('Error converting file to buffer:', err);
                }
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
    }, [
        torrentUploadFileQueue,
        torrentUploadMagnetQueue,
        setTorrentUploadFileQueue,
        setTorrentUploadMagnetQueue,
    ]);

    // Handle pause queue
    useEffect(() => {
        if (torrentPauseQueue.length === 0) return;

        const infoHash = peekQueue(torrentPauseQueue);

        function onPause(response: any) {
            if (response) {
                dequeue(torrentPauseQueue, setTorrentPauseQueue);
                console.log(
                    `Paused torrent: ${infoHash}`,
                    'Response:',
                    response
                );
            } else {
                console.error(
                    'Failed to pause torrent:',
                    infoHash,
                    'Response:',
                    response
                );
            }
        }

        socket.emit('pause', { infoHash });
        socket.on('pause', onPause);

        return () => {
            socket.off('pause', onPause);
        };
    }, [torrentPauseQueue, setTorrentPauseQueue]);

    // Handle resume queue
    useEffect(() => {
        if (torrentResumeQueue.length === 0) return;

        const infoHash = peekQueue(torrentResumeQueue);

        function onResume(response: any) {
            if (response) {
                dequeue(torrentResumeQueue, setTorrentResumeQueue);
                console.log(
                    `Resumed torrent: ${infoHash}`,
                    'Response:',
                    response
                );
            } else {
                console.error(
                    'Failed to resume torrent:',
                    infoHash,
                    'Response:',
                    response
                );
            }
        }

        socket.emit('resume', { infoHash });
        socket.on('resume', onResume);

        return () => {
            socket.off('resume', onResume);
        };
    }, [torrentResumeQueue, setTorrentResumeQueue]);

    // Handle remove queue
    useEffect(() => {
        if (torrentRemoveQueue.length === 0) return;

        const infoHash = peekQueue(torrentRemoveQueue);

        function onRemove(response: any) {
            if (response) {
                if (latestTorrentsRef.current) {
                    latestTorrentsRef.current =
                        latestTorrentsRef.current.filter(
                            (torrent) => torrent.infoHash !== infoHash
                        );
                    setTorrent(latestTorrentsRef.current);
                }

                dequeue(torrentRemoveQueue, setTorrentRemoveQueue);
                console.log(
                    `Removed torrent: ${infoHash}`,
                    'Response:',
                    response
                );
            } else {
                console.error(
                    'Failed to remove torrent:',
                    infoHash,
                    'Response:',
                    response
                );
            }
        }

        socket.emit('remove', { infoHash });
        socket.on('remove', onRemove);

        return () => {
            socket.off('remove', onRemove);
        };
    }, [torrentRemoveQueue, setTorrentRemoveQueue, setTorrent]);

    useEffect(() => {
        return () => {
            socket.disconnect();
            console.log('Socket disconnected');
        };
    }, []);

    return null;
}
