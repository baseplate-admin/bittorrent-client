"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAtom } from "jotai";
import {
    torrentAtom,
    torrentUploadFileQueueAtom,
    torrentPauseQueueAtom,
    torrentResumeQueueAtom,
    torrentRemoveQueueAtom,
} from "@/atoms/torrent";
import { dequeue, peekQueue } from "@/lib/queue";
import { TorrentInfo } from "@/types/socket/torrent_info";
import { GetAllResponse } from "@/types/socket/get_all";
import { BroadcastResponse, SerializedAlert } from "@/types/socket/broadcast";
import { useSocketConnection } from "@/hooks/use-socket";
import { PauseResponse } from "@/types/socket/pause";
import { calculateETA } from "@/lib/calculateEta";
import { deepMerge } from "@/lib/deepMerge";
import { calculateAvg } from "@/lib/calculateAvg";

export default function SocketProvider() {
    const [torrent, setTorrent] = useAtom(torrentAtom);

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

    const [firstLoad, setFirstLoad] = useState<boolean>(true);
    const [broadcastStarted, setBroadcastStarted] = useState<boolean>(false);
    const latestTorrentsRef = useRef<TorrentInfo[]>([]);
    const socketRef = useSocketConnection();

    const updateTorrentsAtom = useCallback(() => {
        // Create a deep clone so Jotai recognizes it as a new value
        setTorrent(structuredClone(latestTorrentsRef.current));
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
                    "libtorrent:get_specific",
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
        [socketRef],
    );

    useEffect(() => {
        if (!socketRef.current) return;

        const socket = socketRef.current;

        socket.emit("libtorrent:get_all", (response: GetAllResponse) => {
            if (response.torrents) {
                latestTorrentsRef.current = response.torrents.map((torrent) => {
                    const eta = calculateETA({
                        downloaded: Number(
                            (torrent.total_size ?? 0) *
                                (torrent.progress / 100),
                        ),
                        total: torrent.total_size ?? 0,
                        downloadSpeed: torrent.download_rate ?? 0,
                    });

                    setFirstLoad(true);
                    return {
                        ...torrent,
                        eta: eta,
                        average_download_speed: 0,
                        average_upload_speed: 0,
                    };
                });
                updateTorrentsAtom();
            }
        });

        const handleBroadcast = async (response: SerializedAlert) => {
            switch (response.type) {
                case "synthetic:paused": {
                    const torrent = findTorrentByInfoHash(response.info_hash);
                    if (torrent) {
                        torrent.paused = true;
                        updateTorrentsAtom();
                    }
                    break;
                }
                case "synthetic:resumed": {
                    const torrent = findTorrentByInfoHash(response.info_hash);
                    if (torrent) {
                        torrent.paused = false;
                        updateTorrentsAtom();
                    }
                    break;
                }
                case "synthetic:removed": {
                    const torrent = findTorrentByInfoHash(response.info_hash);
                    if (torrent) {
                        latestTorrentsRef.current =
                            latestTorrentsRef.current.filter(
                                (t) => t.info_hash !== torrent.info_hash,
                            );
                        updateTorrentsAtom();
                    }
                    break;
                }
                case "libtorrent:add_torrent": {
                    const newTorrent = await getSpecificTorrentFromSocket(
                        response.info_hash,
                    );
                    newTorrent.eta = calculateETA({
                        downloaded: Number(
                            (newTorrent.total_size ?? 0) *
                                (newTorrent.progress / 100),
                        ),
                        total: newTorrent.total_size ?? 0,
                        downloadSpeed: newTorrent.download_rate,
                    });
                    newTorrent.average_download_speed = 0;
                    newTorrent.average_upload_speed = 0;
                    const exists = latestTorrentsRef.current.some(
                        (t) => t.info_hash === newTorrent.info_hash,
                    );
                    if (!exists) {
                        latestTorrentsRef.current.push(newTorrent);
                    }
                    break;
                }
                case "libtorrent:state_update": {
                    for (const status of response.statuses ?? []) {
                        const index = latestTorrentsRef.current.findIndex(
                            (t) => t.info_hash === status.info_hash,
                        );

                        if (index !== -1) {
                            const t = latestTorrentsRef.current[index];
                            const newObj = {
                                eta: calculateETA({
                                    downloaded: Number(
                                        (status.total_size ?? 0) *
                                            (status.progress / 100),
                                    ),
                                    total: status.total_size ?? 0,
                                    downloadSpeed: status.download_rate ?? 0,
                                }),
                                state: status.state,
                                download_rate: status.download_rate,
                                upload_rate: status.upload_rate,
                                total_size: status.total_size,
                                name: status.name,
                                average_download_speed: calculateAvg(
                                    t.average_download_speed ?? 0,
                                    status.download_rate ?? 0,
                                ),
                                average_upload_speed: calculateAvg(
                                    t.average_upload_speed ?? 0,
                                    status.upload_rate ?? 0,
                                ),
                                progress: status.progress,
                                seeds: status.num_seeds,
                                peers: status.num_peers,
                            };

                            const newTorrentObject = deepMerge(t, newObj);
                            latestTorrentsRef.current[index] = newTorrentObject;
                            // console.log(newTorrentObject);
                        }
                    }
                    break;
                }
            }
        };

        socket.on("libtorrent:broadcast", handleBroadcast);

        return () => {
            socket.off("libtorrent:broadcast", handleBroadcast);
        };
    }, [getSpecificTorrentFromSocket, socketRef]);

    useEffect(() => {
        if (broadcastStarted) return;

        if (!socketRef.current || torrent === null) return;

        socketRef.current.emit(
            "libtorrent:broadcast",
            { event: "start" },
            (response: BroadcastResponse) => {
                if (response.status === "success") {
                    setBroadcastStarted(true);
                } else {
                    console.error(
                        "Failed to start broadcast:",
                        response.message,
                    );
                }
            },
        );
    }, [torrent, broadcastStarted, socketRef]);

    // Remove torrent queue
    useEffect(() => {
        if (!socketRef.current || torrentRemoveQueue.length === 0) return;

        const removeItem = peekQueue(torrentRemoveQueue);
        if (!removeItem) return;
        const { info_hash, remove_data } = removeItem;

        socketRef.current.emit(
            "libtorrent:remove",
            { info_hash, remove_data },
            (response: PauseResponse) => {
                if (response.status === "success") {
                    dequeue(torrentRemoveQueue, setTorrentRemoveQueue);
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
            "libtorrent:resume",
            { info_hash: infoHash },
            (response: PauseResponse) => {
                if (response.status === "success") {
                    dequeue(torrentResumeQueue, setTorrentResumeQueue);
                } else {
                    console.error("Failed to upload magnet:", response.message);
                }
            },
        );
    }, [torrentResumeQueue, setTorrentResumeQueue]);

    // Pause torrent queue
    useEffect(() => {
        if (!socketRef.current || torrentPauseQueue.length === 0) return;

        const infoHash = peekQueue(torrentPauseQueue);
        if (!infoHash) return;

        socketRef.current.emit(
            "libtorrent:pause",
            { info_hash: infoHash },
            (response: PauseResponse) => {
                if (response.status === "success") {
                    dequeue(torrentPauseQueue, setTorrentPauseQueue);
                } else {
                    console.error("Failed to upload magnet:", response.message);
                }
            },
        );
    }, [torrentPauseQueue, setTorrentPauseQueue]);

    // Sync ref to atom every 1 second using updateTorrentsAtom
    useEffect(() => {
        const interval = setInterval(() => {
            if (firstLoad) {
                updateTorrentsAtom();
            }
        }, 750);

        return () => clearInterval(interval);
    }, [updateTorrentsAtom, firstLoad]);
    return null;
}
