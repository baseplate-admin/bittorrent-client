from seaderr.singletons import SIO


sio = SIO.get_instance()


@sio.event
async def connect(sid, environ) -> None:
    print(f"Client connected: {sid}")
