import libtorrent as lt
from seaderr.datastructures import EventDataclass
from seaderr.enums import SyntheticEvent
from seaderr.singletons import SIO, EventBus, LibtorrentSession

sio = SIO.get_instance()
event_bus = EventBus.get_bus()


async def publish_resume_event(handle: lt.torrent_handle):
    """Publish a synthetic event when a torrent is resumed."""
    event = EventDataclass(
        event=SyntheticEvent.RESUMED,
        torrent=handle,
    )
    await event_bus.publish(event)


@sio.on("libtorrent:resume")  # type: ignore
async def resume(sid: str, data: dict):
    """
    Handle the 'resume' event from the client.

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

    if handle.is_paused():
        handle.set_upload_mode(False)  # Re-enable uploading
        handle.auto_managed(True)  # Re-enable auto management
        handle.resume()
        sio.start_background_task(publish_resume_event, handle)
        return {"status": "success", "message": "Torrent resumed and upload enabled"}

    return {"status": "info", "message": "Torrent is already active"}
