import { Torrent } from '@/types/Torrent';
import { atom } from 'jotai';

export const torrentAtom = atom<Torrent[] | null>(null);

export const uploadFileQueueAtom = atom<File[]>(new Array<File>());
export const uploadMagnetQueueAtom = atom<File[]>(new Array<File>());
