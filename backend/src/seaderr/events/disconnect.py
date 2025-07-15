from seaderr.singletons import SIO, Logger

sio = SIO.get_instance()
logger = Logger.get_logger()


@sio.event
async def disconnect(sid: str) -> None:
    logger.info(f"Client disconnected: {sid}")
