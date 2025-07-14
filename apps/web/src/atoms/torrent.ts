import { Torrent } from '@/types/Torrent';
import { atom } from 'jotai';

export const torrentAtom = atom<Torrent[] | null>(null);

export const torrentUploadFileQueueAtom = atom<File[]>(new Array<File>());
export const torrentUploadMagnetQueueAtom = atom<string[]>(new Array<string>());
