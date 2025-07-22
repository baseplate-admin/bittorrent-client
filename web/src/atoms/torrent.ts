import { BroadcastTorrentInfo } from "@/types/socket/torrent_info";
import { atom } from "jotai";

export const torrentAtom = atom<BroadcastTorrentInfo[] | null>(null);

export const torrentUploadFileQueueAtom = atom<File[]>(new Array<File>());

export const torrentPauseQueueAtom = atom<string[]>(new Array<string>());
export const torrentResumeQueueAtom = atom<string[]>(new Array<string>());
export const torrentRemoveQueueAtom = atom<
    Array<{ info_hash: string; remove_data: boolean }>
>(new Array<{ info_hash: string; remove_data: boolean }>());
