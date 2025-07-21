import anyio
from typing import Optional

import aiosqlite


class AioSQLite:
    _instance: Optional[aiosqlite.Connection] = None
    _lock = anyio.Lock()
    _db_path: Optional[str] = None

    @classmethod
    def configure(cls, db_path: str) -> None:
        cls._db_path = db_path

    @classmethod
    async def get_instance(cls) -> aiosqlite.Connection:
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    if cls._db_path is None:
                        raise ValueError(
                            "Database path is not configured. Call configure() first."
                        )
                    cls._instance = await aiosqlite.connect(cls._db_path)
                    await cls._instance.execute(
                        "PRAGMA journal_mode=WAL"
                    )  # optional: improve concurrency
        return cls._instance

    @classmethod
    async def close(cls) -> None:
        if cls._instance:
            await cls._instance.close()
            cls._instance = None
