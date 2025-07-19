from dataclasses import dataclass

import libtorrent as lt

from seaderr.enums import SyntheticEvent


@dataclass
class EventDataclass:
    torrent: lt.torrent_handle
    event: SyntheticEvent
