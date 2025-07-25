import faulthandler
import functools
import sys

import socketio

from seedarr.singletons import (
    SIO,
    EventBus,
    FolderLock,
    LibtorrentSession,
    Logger,
)
from seedarr.utilities import import_submodules

faulthandler.enable(file=sys.stderr, all_threads=True)


async def on_startup(sio: socketio.AsyncServer):
    # Initialize the database connection

    # Initialize the logger singleton
    Logger.init()

    # Initialize the libtorrent session
    await LibtorrentSession.init()

    # Initialize the event bus
    from seedarr.consumers import alert_consumer, shared_poll_and_publish

    EventBus.init()
    event_bus = EventBus.get_bus()
    event_bus.set_consumer(alert_consumer)
    sio.start_background_task(shared_poll_and_publish, event_bus)
    sio.start_background_task(event_bus.start)
    # Lazy import submodules to avoid circular imports
    import_submodules("seedarr.events")
    import_submodules("seedarr.routes.libtorrent")
    import_submodules("seedarr.routes.bridge")


async def on_shutdown():
    await LibtorrentSession.close()
    await SIO.close()
    await FolderLock.clear_all()


async def create_app():
    await SIO.init()
    sio = SIO.get_instance()
    sio_app = socketio.ASGIApp(sio)
    sio_app.on_startup = functools.partial(on_startup, sio)
    sio_app.on_shutdown = on_shutdown
    return sio_app
