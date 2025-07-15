export interface TorrentPeer {
  ip: string;
  client: string;
  flags: string;
  progress: number; // 0-100
  download_speed: number; // bytes/sec
  upload_speed: number;   // bytes/sec
}

export interface TorrentInfo {
  name: string;
  info_hash: string;
  progress: number; // 0-100
  state: string;
  paused: boolean;
  total_download: number;
  total_size: number;
  download_rate: number;
  upload_rate: number;
  num_peers: number;
  peers: TorrentPeer[]; // New field
}

export interface GetAllResponse {
  status: string;
  torrents: TorrentInfo[];
}
