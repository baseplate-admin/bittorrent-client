import socketio
from typing import Optional, Type


class SIO:
    _instance: Optional["SIO"] = None
    _sio: socketio.AsyncServer

    def __init__(self) -> None:
        self._sio = socketio.AsyncServer(async_mode="asgi")

    @classmethod
    def init(cls: Type["SIO"]) -> None:
        if cls._instance is None:
            cls._instance = SIO()

    @classmethod
    def get_instance(cls: Type["SIO"]) -> socketio.AsyncServer:
        if cls._instance is None:
            raise RuntimeError("SIO not initialized. Call init() first.")
        return cls._instance._sio
