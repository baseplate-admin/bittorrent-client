import asyncio
import threading
from typing import Optional, Type

import libtorrent as lt


class LibtorrentSession:
    _instance: Optional["LibtorrentSession"] = None
    _lock = asyncio.Lock()

    def __init__(self) -> None:
        self._initialized = False
        self.session: Optional[lt.session] = None
        self._thread_lock = threading.Lock()

    @classmethod
    async def init(cls: Type["LibtorrentSession"]) -> None:
        async with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            if not cls._instance._initialized:
                # Run session creation in a separate thread
                cls._instance.session = await asyncio.to_thread(
                    cls._instance._create_session
                )
                cls._instance._initialized = True

    @classmethod
    async def get_session(cls) -> lt.session:
        if cls._instance is None or not cls._instance._initialized:
            await cls.init()
        if cls._instance is None or cls._instance.session is None:
            raise RuntimeError("Libtorrent session is not initialized.")
        return cls._instance.session

    def _create_session(self) -> lt.session:
        ses = lt.session()
        ses.apply_settings(
            {
                "listen_interfaces": "0.0.0.0:6881",
                "enable_dht": True,
                "announce_to_all_trackers": True,
                "announce_to_all_tiers": True,
            }
        )
        ses.add_dht_router("router.bittorrent.com", 6881)
        ses.add_dht_router("router.utorrent.com", 6881)
        ses.add_dht_router("router.openbittorrent.org", 2710)
        ses.set_alert_mask(
            lt.alert.category_t.status_notification
            | lt.alert.category_t.error_notification
            | lt.alert.category_t.dht_notification
        )
        return ses

    @classmethod
    async def close(cls) -> None:
        async with cls._lock:
            if cls._instance is None or not cls._instance._initialized:
                return
            # Run pause_all_torrents in a separate thread
            await asyncio.to_thread(cls._instance._pause_all_torrents)
            await asyncio.sleep(1)
            cls._instance._initialized = False

    def _pause_all_torrents(self) -> None:
        # Protect this method from concurrent access with a threading lock
        with self._thread_lock:
            if self.session is not None:
                for handle in self.session.get_torrents():
                    handle.pause()
