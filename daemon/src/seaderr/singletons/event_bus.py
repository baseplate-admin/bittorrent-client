import asyncio
from typing import Any, Awaitable, Callable, Optional

from .logger import Logger


class EventBus:
    _instance: Optional["EventBus"] = None

    _initialized: bool
    _running: bool
    queue: asyncio.Queue
    _consumer: Optional[Callable[[Any], Awaitable[None]]]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        pass

    @classmethod
    def get_bus(cls) -> "EventBus":
        return cls()

    @classmethod
    def init(cls):
        instance = cls.get_bus()
        if instance._initialized:
            return
        instance.queue = asyncio.Queue()
        instance._consumer = None
        instance._running = False
        instance._initialized = True

    def set_consumer(self, consumer: Callable[[Any], Awaitable[None]]):
        if not self._initialized:
            raise RuntimeError("Call EventBus.init() before setting consumer")
        if self._consumer is not None:
            raise RuntimeError("Consumer is already set and cannot be replaced")
        self._consumer = consumer

    def remove_consumer(self):
        if not self._initialized:
            raise RuntimeError("Call EventBus.init() before removing consumer")
        if self._consumer is None:
            raise RuntimeError("No consumer is set to remove")
        self._consumer = None

    async def publish(self, event: Any):
        if not self._initialized:
            raise RuntimeError("Call EventBus.init() before publishing events")
        await self.queue.put(event)

    async def start(self):
        if not self._initialized:
            raise RuntimeError("Call EventBus.init() before starting the bus")
        if not self._consumer:
            raise RuntimeError("Consumer not set")

        logger = Logger.get_logger()
        self._running = True

        logger.info("EventBus started.")

        while self._running:
            try:
                event = await self.queue.get()
                if event is None:
                    # Special signal to stop the loop
                    logger.info("EventBus received shutdown signal.")
                    break

                try:
                    await self._consumer(event)
                except asyncio.CancelledError:
                    logger.info("EventBus task cancelled.")
                    raise
                except Exception as e:
                    logger.exception(f"Error while handling event {event}: {e}")
            except Exception as outer:
                logger.exception(f"Unexpected error in EventBus loop: {outer}")

        logger.info("EventBus stopped.")

    def stop(self):
        if not self._initialized:
            raise RuntimeError("Call EventBus.init() before stopping the bus")
        if not self._running:
            return
        self._running = False
        # Wake up the queue if it's waiting
        self.queue.put_nowait(None)
