import asyncio
from typing import Any, Awaitable, Callable, Optional


class EventBus:
    _instance: Optional["EventBus"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        # Prevent multiple init calls
        if self._initialized:
            return
        self.queue = asyncio.Queue()
        self._consumer: Optional[Callable[[Any], Awaitable[None]]] = None
        self._initialized = True

    @classmethod
    def init_bus(cls) -> "EventBus":
        """
        Initialize the singleton EventBus instance.
        Returns the singleton instance.
        """
        return cls()

    def set_consumer(self, consumer: Callable[[Any], Awaitable[None]]):
        self._consumer = consumer

    async def publish(self, event: Any):
        await self.queue.put(event)

    async def start(self):
        if not self._consumer:
            raise RuntimeError("Consumer not set")
        while True:
            event = await self.queue.get()
            await self._consumer(event)
