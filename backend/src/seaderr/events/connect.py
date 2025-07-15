from seaderr.singletons import SIO, Logger


sio = SIO.get_instance()
logger = Logger.get_logger()


@sio.event
async def connect(sid: str, environ) -> None:
    logger.info((f"Client connected: {sid}"))
