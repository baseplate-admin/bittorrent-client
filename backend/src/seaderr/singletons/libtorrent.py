import libtorrent as lt
import asyncio


class LibtorrentSession:
    _instance = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    async def init_session(self):
        async with self._lock:
            if not self._initialized:
                self.session = await asyncio.to_thread(self._create_session)
                self._initialized = True

    def _create_session(self):
        ses = lt.session()
        ses.listen_on(6881, 6891)
        return ses

    async def get_session(self):
        if not self._initialized:
            await self.init_session()
        return self.session

    async def close(self):
        async with self._lock:
            if not self._initialized:
                return
            # Pause all torrents (blocking, so run in thread)
            await asyncio.to_thread(self._pause_all_torrents)
            # Wait a bit for graceful shutdown
            await asyncio.sleep(1)
            self._initialized = False

    def _pause_all_torrents(self):
        for handle in self.session.get_torrents():
            handle.pause()
