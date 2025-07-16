"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAtom } from "jotai";
import {
    torrentAtom,
    torrentUploadMagnetQueueAtom,
    torrentUploadFileQueueAtom,
    torrentPauseQueueAtom,
    torrentResumeQueueAtom,
    torrentRemoveQueueAtom,
} from "@/atoms/torrent";
import { dequeue, peekQueue } from "@/lib/queue";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { GetAllResponse } from "@/types/socket/get_all";
import { MagnetResponse } from "@/types/socket/add_magnet";
import { BroadcastResponse, SerializedAlert } from "@/types/socket/broadcast";
import { useSocketConnection } from "@/hooks/use-socket";
import { PauseResponse } from "@/types/socket/pause";

export default function SocketProvider() {
    const [torrent, setTorrent] = useAtom(torrentAtom);
    const [torrentUploadMagnetQueue, setTorrentUploadMagnetQueue] = useAtom(
        torrentUploadMagnetQueueAtom,
    );
    const [torrentUploadFileQueue] = useAtom(torrentUploadFileQueueAtom);
    const [torrentPauseQueue, setTorrentPauseQueue] = useAtom(
        torrentPauseQueueAtom,
    );
    const [torrentResumeQueue, setTorrentResumeQueue] = useAtom(
        torrentResumeQueueAtom,
    );
    const [torrentRemoveQueue, setTorrentRemoveQueue] = useAtom(
        torrentRemoveQueueAtom,
    );

    const latestTorrentsRef = useRef<TorrentInfo[]>([]);
    const socketRef = useSocketConnection();

    const updateTorrentsAtom = useCallback(() => {
        setTorrent([...latestTorrentsRef.current]);
    }, [setTorrent]);
    const findTorrentByInfoHash = (
        infoHash: string,
    ): TorrentInfo | undefined => {
        return latestTorrentsRef.current.find((t) => t.info_hash === infoHash);
    };
    const getSpecificTorrentFromSocket = useCallback(
        (info_hash: string): Promise<TorrentInfo> => {
            return new Promise((resolve, reject) => {
                socketRef.current?.emit(
                    "get_specific",
                    { info_hash },
                    (response: any) => {
                        if (response?.torrent) {
                            resolve(response.torrent);
                        } else {
                            reject(
                                new Error(
                                    `Torrent with info_hash ${info_hash} not found`,
                                ),
                            );
                        }
                    },
                );
            });
        },
        [],
    );

    useEffect(() => {
        const interval = setInterval(updateTorrentsAtom, 1000);
        return () => clearInterval(interval);
    }, [updateTorrentsAtom]);

    useEffect(() => {
        if (!socketRef.current) return;

        const socket = socketRef.current;

        socket.emit("get_all", (response: GetAllResponse) => {
            if (response?.torrents) {
                latestTorrentsRef.current = response.torrents.map(
                    (torrent) => ({
                        ...torrent,
                        seeders: torrent.seeders ?? 0,
                        leechers:
                            (torrent.num_peers ?? 0) - (torrent.seeders ?? 0),
                    }),
                );
                setTorrent([...latestTorrentsRef.current]);
            }
        });

        const handleBroadcast = async (response: SerializedAlert) => {
            switch (response.type) {
                case "add_torrent": {
                    const newTorrent = await getSpecificTorrentFromSocket(
                        response.info_hash,
                    );
                    const exists = latestTorrentsRef.current.some(
                        (t) => t.info_hash === newTorrent.info_hash,
                    );
                    if (!exists) {
                        latestTorrentsRef.current.push(newTorrent);
                    }
                    console.log("Received Torrent Event");
                    break;
                }
                case "state_update": {
                    for (const status of response.statuses ?? []) {
                        const index = latestTorrentsRef.current.findIndex(
                            (t) => t.info_hash === status.info_hash,
                        );

                        if (index !== -1) {
                            const t = latestTorrentsRef.current[index];

                            latestTorrentsRef.current[index] = {
                                ...t,
                                progress: Number(status.progress * 100),
                                download_rate: status.download_rate,
                                upload_rate: status.upload_rate,
                                num_peers: status.num_peers,
                                seeders: status.seeders,

                                leechers: status.num_peers - status.seeders,
                                total_size: status.total_size,
                                state: status.state,
                            };
                        }
                    }

                    break;
                }
            }
        };

        socket.on("broadcast", handleBroadcast);

        return () => {
            socket.off("broadcast", handleBroadcast);
        };
    }, [getSpecificTorrentFromSocket, setTorrent]);

    useEffect(() => {
        if (!socketRef.current || torrent === null) return;

        socketRef.current.emit(
            "broadcast",
            { event: "start" },
            (response: BroadcastResponse) => {
                if (response.status !== "success") {
                    console.error(
                        "Failed to start broadcast:",
                        response.message,
                    );
                }
            },
        );
    }, [torrent]);

    // Remove torrent queue
    useEffect(() => {
        if (!socketRef.current || torrentRemoveQueue.length === 0) return;

        const removeItem = peekQueue(torrentRemoveQueue);
        if (!removeItem) return;
        const { info_hash, remove_content } = removeItem;

        socketRef.current.emit(
            "remove",
            { info_hash, remove_content },
            (response: PauseResponse) => {
                if (response.status === "success") {
                    dequeue(torrentRemoveQueue, setTorrentRemoveQueue);
                    latestTorrentsRef.current =
                        latestTorrentsRef.current.filter(
                            (t) => t.info_hash !== info_hash,
                        );
                } else {
                    console.error(
                        "Failed to remove torrent:",
                        response.message,
                    );
                }
            },
        );
    }, [torrentRemoveQueue, setTorrentRemoveQueue]);

    // Resume torrent queue
    useEffect(() => {
        if (!socketRef.current || torrentResumeQueue.length === 0) return;

        const infoHash = peekQueue(torrentResumeQueue);
        if (!infoHash) return;

        socketRef.current.emit(
            "resume",
            { info_hash: infoHash },
            (response: PauseResponse) => {
                if (response.status === "success") {
                    dequeue(torrentResumeQueue, setTorrentResumeQueue);
                    const torrent = findTorrentByInfoHash(infoHash);
                    if (torrent) {
                        torrent.paused = false;
                    }
                } else {
                    console.error("Failed to upload magnet:", response.message);
                }
            },
        );
    }, [torrentResumeQueue]);

    // Pause torrent queue
    useEffect(() => {
        if (!socketRef.current || torrentPauseQueue.length === 0) return;

        const infoHash = peekQueue(torrentPauseQueue);
        if (!infoHash) return;

        socketRef.current.emit(
            "pause",
            { info_hash: infoHash },
            (response: PauseResponse) => {
                if (response.status === "success") {
                    dequeue(torrentPauseQueue, setTorrentPauseQueue);
                    const torrent = findTorrentByInfoHash(infoHash);
                    if (torrent) {
                        torrent.paused = true;
                    }
                } else {
                    console.error("Failed to upload magnet:", response.message);
                }
            },
        );
    }, [torrentPauseQueue]);

    // Magnet upload queue
    useEffect(() => {
        if (!socketRef.current || torrentUploadMagnetQueue.length === 0) return;

        const magnet = peekQueue(torrentUploadMagnetQueue);
        if (!magnet) return;

        socketRef.current.emit(
            "add_magnet",
            { magnet },
            (response: MagnetResponse) => {
                if (response.status === "success") {
                    dequeue(
                        torrentUploadMagnetQueue,
                        setTorrentUploadMagnetQueue,
                    );
                } else {
                    console.error("Failed to upload magnet:", response.message);
                }
            },
        );
    }, [torrentUploadMagnetQueue, setTorrentUploadMagnetQueue]);

    return null;
}
