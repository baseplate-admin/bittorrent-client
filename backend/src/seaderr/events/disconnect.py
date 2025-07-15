from seaderr.singletons import SIO, Logger
from seaderr.managers import BroadcastClientManager

sio = SIO.get_instance()
logger = Logger.get_logger()
broadcast_client_manager = BroadcastClientManager()


@sio.event
async def disconnect(sid: str) -> None:
    logger.info(f"Client disconnected: {sid}")
    broadcast_client_manager.remove_client(sid)
