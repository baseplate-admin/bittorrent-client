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
import {MagnetResponse} from '@/types/socket/add_magnet';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "ws://localhost:8080";
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

  useEffect(() => {
    if (torrentUploadMagnetQueue.length > 0) {
        const magnet = peekQueue(torrentUploadMagnetQueue);
        if (magnet) {
            socket.emit('upload_magnet', { magnet }, (response: MagnetResponse) => {
                if (response.status === 'success') {
                    dequeue(torrentUploadMagnetQueue, setTorrentUploadMagnetQueue);
                } else if (response.status === 'error') {
                    console.error('Failed to upload magnet:', response.message);
                }else{
                    console.error('Unknown response status:', response.status);
                }
            });
        }
    }
}, [torrentUploadMagnetQueue]);
    return <></>
}
