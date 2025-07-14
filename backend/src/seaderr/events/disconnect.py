from seaderr.singletons import SIO

sio = SIO.get_instance()


@sio.event
async def disconnect(sid) -> None:
    print(f"Client disconnected: {sid}")
