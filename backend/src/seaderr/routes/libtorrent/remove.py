import libtorrent as lt
from seaderr.datastructures import EventDataclass
from seaderr.enums import SyntheticEvent
from seaderr.singletons import SIO, EventBus, LibtorrentSession

sio = SIO.get_instance()
event_bus = EventBus.get_bus()


async def publish_remove_event(handle: lt.torrent_handle):
    """Publish a synthetic event when a torrent is removed."""
    event = EventDataclass(
        event=SyntheticEvent.REMOVED,
        torrent=handle,
    )
    await event_bus.publish(event)


@sio.on("libtorrent:remove")  # type: ignore
async def remove(sid: str, data: dict):
    ses = await LibtorrentSession.get_session()
    info_hash = data.get("info_hash")
    remove_data = data.get("remove_data", False)

    if not info_hash:
        return {"status": "error", "message": "Missing 'info_hash'"}

    try:
        ih = lt.sha1_hash(bytes.fromhex(info_hash))
    except ValueError:
        return {"status": "error", "message": "Invalid info_hash format"}

    handle = ses.find_torrent(ih)
    if not handle.is_valid():
        return {"status": "error", "message": "Torrent not found"}

    flags = lt.options_t.delete_files if remove_data else 0
    ses.remove_torrent(handle, flags)
    sio.start_background_task(publish_remove_event, handle)
    return {"status": "success", "message": "Torrent removed"}
