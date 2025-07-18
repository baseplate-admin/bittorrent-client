import asyncio
import contextlib
from typing import (
    Awaitable,
    Callable,
    Dict,
    Generic,
    Optional,
    Type,
    TypeVar,
)

from seaderr.singletons import Logger

logger = Logger.get_logger()

T = TypeVar("T")
AsyncCleanupFn = Callable[[str, T], Awaitable[None]]


class ExpiringStore(Generic[T]):
    def __init__(
        self,
        value_type: Type[T],
        default_expiry: int = 60,
        on_cleanup: Optional[AsyncCleanupFn[T]] = None,
    ):
        self._value_type = value_type
        self._default_expiry = default_expiry
        self._on_cleanup = on_cleanup
        self._data: Dict[str, T] = {}
        self._timers: Dict[str, asyncio.Task] = {}
        self._expiries: Dict[str, int] = {}
        self._lock = asyncio.Lock()

    async def set(self, key: str, value: T, expiry: Optional[int] = None):
        if not isinstance(value, self._value_type):
            raise TypeError(f"Value must be of type {self._value_type.__name__}")
        async with self._lock:
            self._data[key] = value
            self._expiries[key] = expiry or self._default_expiry
            await self._reset_timer(key)

    async def get(self, key: str) -> Optional[T]:
        async with self._lock:
            return self._data.get(key)

    async def delete(self, key: str):
        async with self._lock:
            await self._cancel_timer(key)
            self._data.pop(key, None)
            self._expiries.pop(key, None)

    async def keys(self) -> list[str]:
        async with self._lock:
            return list(self._data.keys())

    async def _reset_timer(self, key: str):
        await self._cancel_timer(key)
        delay = self._expiries.get(key, self._default_expiry)
        self._timers[key] = asyncio.create_task(self._expire_later(key, delay))

    async def _cancel_timer(self, key: str):
        task = self._timers.pop(key, None)
        if task:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task

    async def _expire_later(self, key: str, delay: int):
        await asyncio.sleep(delay)
        async with self._lock:
            await self._expire_key(key)

    async def _expire_key(self, key: str):
        value = self._data.pop(key, None)
        self._expiries.pop(key, None)
        await self._cancel_timer(key)
        if value is not None and self._on_cleanup is not None:
            try:
                await self._on_cleanup(key, value)
            except Exception as exc:
                # Replace with your logging
                logger.exception(f"Exception in cleanup for key '{key}': {exc}")
