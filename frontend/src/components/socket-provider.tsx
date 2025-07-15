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
import { GetAllResponse, TorrentInfo } from '@/types/socket/get_all';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8080";
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

    const latestTorrentsRef = useRef<TorrentInfo[] | null>(null);

    useEffect(()=>{
        socket.emit("get_all",(response:GetAllResponse)=>{
            if(response){
                setTorrent(response.torrents)
            }
        })

    },[setTorrent])

    return <></>
}
