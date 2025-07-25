from pydantic import BaseModel, Field

import libtorrent as lt
from seedarr.datastructures import EventDataclass
from seedarr.decorators import validate_payload
from seedarr.enums import SyntheticEvent
from seedarr.singletons import SIO, EventBus, LibtorrentSession

sio = SIO.get_instance()
event_bus = EventBus.get_bus()


async def publish_remove_event(handle: lt.torrent_handle):
    """Publish a synthetic event when a torrent is removed."""
    event = EventDataclass(
        event=SyntheticEvent.REMOVED,
        torrent=handle,
    )
    await event_bus.publish(event)


class RemoveRequestPayload(BaseModel):
    info_hash: str = Field(...)
    remove_data: bool = Field(default=False)


@sio.on("libtorrent:remove")  # type: ignore
@validate_payload(RemoveRequestPayload)
async def remove(sid: str, data: RemoveRequestPayload):
    ses = await LibtorrentSession.get_session()

    if not data.info_hash:
        return {"status": "error", "message": "Missing 'info_hash'"}

    try:
        ih = lt.sha1_hash(bytes.fromhex(data.info_hash))
    except ValueError:
        return {"status": "error", "message": "Invalid info_hash format"}

    handle = ses.find_torrent(ih)
    if not handle.is_valid():
        return {"status": "error", "message": "Torrent not found"}

    flags = lt.options_t.delete_files if data.remove_data else 0
    ses.remove_torrent(handle, flags)
    sio.start_background_task(publish_remove_event, handle)
    return {"status": "success", "message": "Torrent removed"}
