from seaderr.managers import BroadcastClientManager
from seaderr.singletons import (
    SIO,
    EventBus,
    Logger,
)

sio = SIO.get_instance()
logger = Logger.get_logger()
broadcast_client_manager = BroadcastClientManager()
event_bus = EventBus.get_bus()

poller_started = False


@sio.on("libtorrent:broadcast")  # type: ignore
async def handle_broadcast_request(sid: str, data: dict):
    global poller_started

    event = data.get("event")
    if not event:
        return {"status": "error", "message": "No event specified"}

    if event == "start":
        broadcast_client_manager.add_client(sid)

        return {
            "status": "success",
            "message": f"Started alert stream for client {sid}",
        }

    elif event == "stop":
        if sid in broadcast_client_manager.get_clients():
            broadcast_client_manager.remove_client(sid)
            return {
                "status": "success",
                "message": f"Stopped alert stream for client {sid}",
            }

        return {
            "status": "error",
            "message": f"No active alert stream for client {sid}",
        }
