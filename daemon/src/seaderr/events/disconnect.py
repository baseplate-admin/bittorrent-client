from seaderr.managers import BroadcastClientManager
from seaderr.singletons import SIO, Logger

sio = SIO.get_instance()
logger = Logger.get_logger()
broadcast_client_manager = BroadcastClientManager()


@sio.event
async def disconnect(sid: str, reason: str) -> None:
    logger.info(f"Client disconnected: {sid}. Reason: {reason}")
    broadcast_client_manager.remove_client(sid)
