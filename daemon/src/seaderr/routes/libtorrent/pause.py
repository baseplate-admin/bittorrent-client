import libtorrent as lt
from seaderr.datastructures import EventDataclass
from seaderr.enums import SyntheticEvent
from seaderr.singletons import SIO, EventBus, LibtorrentSession

sio = SIO.get_instance()
event_bus = EventBus.get_bus()


async def publish_pause_event(handle: lt.torrent_handle):
    """Publish a synthetic event when a torrent is paused."""
    event = EventDataclass(
        event=SyntheticEvent.PAUSED,
        torrent=handle,
    )
    await event_bus.publish(event)


@sio.on("libtorrent:pause")  # type: ignore
async def pause(sid: str, data: dict):
    """
    Handle the 'pause' event from the client.

    Args:
        sid (str): The session ID of the client.
        data (dict): The data sent from the client.
            Expected keys:
            - info_hash (str): The hex string of the torrent's info hash.
    """
    ses = await LibtorrentSession.get_session()
    info_hash = data.get("info_hash")

    if not info_hash:
        return {"status": "error", "message": "Missing 'info_hash'"}

    try:
        ih = lt.sha1_hash(bytes.fromhex(info_hash))
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
