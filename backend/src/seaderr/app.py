import asyncio
import functools

import socketio

from seaderr.singletons import (
    SIO,
    EventBus,
    LibtorrentSession,
    Logger,
)
from seaderr.utilities import import_submodules


async def print_task_queue(interval=1):
    while True:
        print("\n--- Current asyncio tasks ---")
        for task in asyncio.all_tasks():
            print(f"- {task.get_name()}: {task}")
        await asyncio.sleep(interval)


async def on_startup(sio: socketio.AsyncServer):
    # Initialize the database connection

    # Initialize the logger singleton
    Logger.init()

    # Initialize the libtorrent session
    await LibtorrentSession.init()

    # Initialize the event bus
    from seaderr.consumers import alert_consumer, shared_poll_and_publish

    EventBus.init()
    event_bus = EventBus.get_bus()
    event_bus.set_consumer(alert_consumer)
    sio.start_background_task(shared_poll_and_publish, event_bus)
    sio.start_background_task(event_bus.start)
    # sio.start_background_task(print_task_queue)
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
    sio_app.on_startup = functools.partial(on_startup, sio)
    sio_app.on_shutdown = on_shutdown
    return sio_app
