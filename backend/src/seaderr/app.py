import socketio

from seaderr.singletons import SIO
from seaderr.utilities import import_submodules


def create_app():
    SIO.init()

    # Lazy register
    import_submodules("seaderr.events")
    import_submodules("seaderr.routes")

    sio = SIO.get_instance()
    app = socketio.ASGIApp(sio)
    return app
