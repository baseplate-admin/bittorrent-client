from dataclasses import dataclass
import libtorrent as lt


@dataclass
class TorrentDataclass:
    torrent: lt.torrent_handle
