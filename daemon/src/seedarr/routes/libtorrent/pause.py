from pydantic import BaseModel, Field

import libtorrent as lt
from seedarr.datastructures import EventDataclass
from seedarr.decorators import validate_payload
from seedarr.enums import SyntheticEvent
from seedarr.singletons import SIO, EventBus, LibtorrentSession

sio = SIO.get_instance()
event_bus = EventBus.get_bus()


async def publish_pause_event(handle: lt.torrent_handle):
    """Publish a synthetic event when a torrent is paused."""
    event = EventDataclass(
        event=SyntheticEvent.PAUSED,
        torrent=handle,
    )
    await event_bus.publish(event)


class PauseRequestPayload(BaseModel):
    info_hash: str = Field(...)


@sio.on("libtorrent:pause")  # type: ignore
@validate_payload(PauseRequestPayload)
async def pause(sid: str, data: PauseRequestPayload):
    """
    Handle the 'pause' event from the client.

    Args:
        sid (str): The session ID of the client.
        data (dict): The data sent from the client.
    """
    ses = await LibtorrentSession.get_session()

    try:
        ih = lt.sha1_hash(bytes.fromhex(data.info_hash))
    except ValueError:
        return {"status": "error", "message": "Invalid info_hash format"}

    handle = ses.find_torrent(ih)
    if not handle.is_valid():
        return {"status": "error", "message": "Torrent not found"}

    if not handle.is_paused():
        handle.auto_managed(False)  # Disable auto-resume
        handle.set_upload_mode(True)  # Prevent seeding
        handle.pause()
        sio.start_background_task(publish_pause_event, handle)
        return {"status": "success", "message": "Torrent paused and upload disabled"}

    return {"status": "info", "message": "Torrent is already paused"}
