import socketio
from typing import Type

try:
    import orjson

    HAS_ORJSON = True
except ImportError:
    orjson = None

    HAS_ORJSON = False


class ORJSONWrapper:
    @staticmethod
    def dumps(obj):
        if not HAS_ORJSON or orjson is None:
            raise RuntimeError("orjson is not available")
        return orjson.dumps(obj).decode("utf-8")

    @staticmethod
    def loads(s):
        if not HAS_ORJSON or orjson is None:
            raise RuntimeError("orjson is not available")
        return orjson.loads(s)


class SIO:
    _instance: "SIO | None" = None
    _sio: socketio.AsyncServer

    def __init__(self) -> None:
        self._sio = socketio.AsyncServer(
            async_mode="asgi",
            json=ORJSONWrapper if HAS_ORJSON else None,
        )

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
