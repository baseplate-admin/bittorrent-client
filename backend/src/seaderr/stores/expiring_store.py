import asyncio
import contextlib
from typing import Dict, Optional, Type, TypeVar, Generic, cast

T = TypeVar("T")


class ExpiringStore(Generic[T]):
    def __init__(self, value_type: Type[T], expiry: int = 60):
        self._value_type = value_type
        self._data: Dict[str, T] = {}
        self._timers: Dict[str, asyncio.Task] = {}
        self._expiry = expiry
        self._lock = asyncio.Lock()

    async def set(self, key: str, value: T):
        if not isinstance(value, self._value_type):
            raise TypeError(f"Value must be of type {self._value_type.__name__}")
        async with self._lock:
            self._data[key] = value
            await self._reset_timer(key)

    async def get(self, key: str) -> Optional[T]:
        async with self._lock:
            value = self._data.get(key)
            if value is not None:
                await self._reset_timer(key)
                return cast(T, value)
            return None

    async def delete(self, key: str):
        async with self._lock:
            self._data.pop(key, None)
            await self._cancel_timer(key)

    async def keys(self) -> list[str]:
        async with self._lock:
            return list(self._data.keys())

    async def _reset_timer(self, key: str):
        await self._cancel_timer(key)
        self._timers[key] = asyncio.create_task(self._expire_later(key))

    async def _cancel_timer(self, key: str):
        task = self._timers.pop(key, None)
        if task:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task

    async def _expire_later(self, key: str):
        await asyncio.sleep(self._expiry)
        async with self._lock:
            self._data.pop(key, None)
            self._timers.pop(key, None)
