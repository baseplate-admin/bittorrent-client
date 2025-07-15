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
import { BroadcastResponse,SerializedAlert } from '@/types/socket/broadcast';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "ws://localhost:8080";
const socket = io(socketUrl);

function findTorrentByInfoHash(
  torrents: TorrentInfo[] | null,
  info_hash: string
): TorrentInfo | null {
  if (!torrents) return null;
  const found = torrents.find(torrent => torrent.info_hash === info_hash);
  if (!found) throw new Error(`Torrent with info_hash ${info_hash} not found`);
  return found;
}

function getSpecificTorrentFromSocket(info_hash:string){
    return new Promise<TorrentInfo>((resolve, reject) => {
        socket.emit('get_specific', { info_hash }, (response:any) => {
            if (response) {
                resolve(response.torrent);
            } else {
                reject(new Error(`Torrent with info_hash ${info_hash} not found`));
            }
        });
    });

}

export default function SocketProvider() {
    const [torrent,setTorrent] = useAtom(torrentAtom);
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
        return () => {
            socket.disconnect();
        };
    
    },[])

    useEffect(()=>{
            socket.emit("broadcast",{"event":"start"},(response:BroadcastResponse)=>{
                if (response.status === 'success') {
                    console.log('Broadcast started successfully');
                } else {
                    console.error('Failed to start broadcast:', response.message);
                }
            })

        socket.on('broadcast',async (response :SerializedAlert)=>{
            switch (response.type) {
                case "add_torrent":
                    console.log("add_torrent event received:", response);
                    const newTorrentInfoHash = response.info_hash;
                    const torrentInformation = await getSpecificTorrentFromSocket(newTorrentInfoHash);
                    setTorrent((prevTorrents) => {
                        if (!prevTorrents) return [torrentInformation];
                        const exists = prevTorrents.some(t => t.info_hash === torrentInformation.info_hash);
                        if (exists) {
                            console.log('Torrent already exists, skipping add:', torrentInformation.info_hash);
                            return prevTorrents;
                        }
                        return [...prevTorrents, torrentInformation];
                    });
                    console.log('New torrent added:', torrentInformation);
                    break;

                case 'metadata_received':
                    console.log('Metadata received for torrent:', response);
                    break;
         
                case "state_update":
                    // const message = response.statuses;
                    // for(const status of message){
                    //     const torrent = findTorrentByInfoHash(latestTorrentsRef.current, status.info_hash);
                    //     if (torrent) {
                    //         torrent.progress = status.progress;
                    //         torrent.download_rate = status.download_rate;
                    //         torrent.upload_rate = status.upload_rate;
                    //         torrent.num_peers = status.num_peers;
                    //         // @ts-expect-error : FIXME: state is a number, but it should be a string
                    //         torrent.state = status.state;
                    //     }
                    // }

                    break;
                default:
                    // console.error("Unknown broadcast type:", response.type);    
                    break;

            }
        })
    },[])

  useEffect(() => {
    if (torrentUploadMagnetQueue.length > 0) {
        const magnet = peekQueue(torrentUploadMagnetQueue);
        if (!magnet) {
            return
        }
        
        socket.emit('add_magnet', { magnet }, (response: MagnetResponse) => {
                if (response.status === 'success') {
                    dequeue(torrentUploadMagnetQueue, setTorrentUploadMagnetQueue);
                } else if (response.status === 'error') {
                    console.error('Failed to upload magnet:', response.message);
                }else{
                    console.error('Unknown response status:', response.status);
                }
            });
    }

}, [torrentUploadMagnetQueue]);
useEffect(() => {
  console.log('Torrent atom updated:', torrent);
}, [torrent]);
    return <></>
}
