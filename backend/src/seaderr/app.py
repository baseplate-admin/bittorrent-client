import socketio

from seaderr.singletons import SIO, LibtorrentSession, Logger
from seaderr.utilities import import_submodules


async def on_startup():
    # Initialize the database connection

    # Initialize the logger singleton
    Logger.init()

    # Initialize the libtorrent session
    await LibtorrentSession.init()

    # Lazy import submodules to avoid circular imports
    import_submodules("seaderr.events")
    import_submodules("seaderr.routes.libtorrent")
    import_submodules("seaderr.routes.bridge")


async def on_shutdown():
    await LibtorrentSession.close()
    await SIO.close()


async def create_app():
    await SIO.init()
    sio = SIO.get_instance()
    sio_app = socketio.ASGIApp(sio)
    sio_app.on_startup = on_startup
    sio_app.on_shutdown = on_shutdown
    return sio_app
