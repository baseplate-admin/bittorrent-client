import socketio

from seaderr.singletons import SIO, LibtorrentSession
from seaderr.utilities import import_submodules


async def on_startup():
    # Initialize the database connection

    # Initialize the libtorrent session
    await LibtorrentSession.init()

    # Lazy import submodules to avoid circular imports
    import_submodules("seaderr.events")
    import_submodules("seaderr.routes")


async def on_shutdown():
    await LibtorrentSession.close()
    await SIO.close()


async def create_app():
    await SIO.init()
    sio = SIO.get_instance()
    app = socketio.ASGIApp(sio)

    app.on_startup = on_startup
    app.on_shutdown = on_shutdown
    return app
