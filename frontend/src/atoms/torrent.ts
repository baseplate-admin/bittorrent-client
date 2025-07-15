import { TorrentInfo } from '@/types/socket/torrent_info';
import { atom } from 'jotai';

export const torrentAtom = atom<TorrentInfo[] | null>(null);

export const torrentUploadFileQueueAtom = atom<File[]>(new Array<File>());
export const torrentUploadMagnetQueueAtom = atom<string[]>(new Array<string>());

export const torrentPauseQueueAtom = atom<string[]>(new Array<string>());
export const torrentResumeQueueAtom = atom<string[]>(new Array<string>());
export const torrentRemoveQueueAtom = atom<string[]>(new Array<string>());
