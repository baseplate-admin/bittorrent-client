import { Torrent } from '@/types/Torrent';
import { atom } from 'jotai';

export const torrentAtom = atom<Torrent | null>(null);
