from typing import Literal

from pydantic import BaseModel

from seaderr.decorators import validate_payload
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


class BroadcastRequestPayload(BaseModel):
    event: Literal["start", "stop"]


@sio.on("libtorrent:broadcast")  # type: ignore
@validate_payload(BroadcastRequestPayload)
async def handle_broadcast_request(sid: str, data: BroadcastRequestPayload):
    global poller_started

    if data.event == "start":
        broadcast_client_manager.add_client(sid)

        return {
            "status": "success",
            "message": f"Started alert stream for client {sid}",
        }

    elif data.event == "stop":
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
