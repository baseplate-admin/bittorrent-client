import socketio
from typing import Type


class SIO:
    _instance: "SIO | None" = None
    _sio: socketio.AsyncServer

    def __init__(self) -> None:
        self._sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

    @classmethod
    async def init(cls: Type["SIO"]) -> None:
        if cls._instance is None:
            cls._instance = SIO()

    @classmethod
    def get_instance(cls: Type["SIO"]) -> socketio.AsyncServer:
        if cls._instance is None:
            raise RuntimeError("SIO not initialized. Call await init() first.")
        return cls._instance._sio

    @classmethod
    async def close(cls: Type["SIO"]) -> None:
        if cls._instance is not None:
            # Disconnect all connected clients
            for sid in list(cls._instance._sio.manager.rooms.get(None, {})):
                await cls._instance._sio.disconnect(sid)
            cls._instance = None
