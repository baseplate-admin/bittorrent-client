from seaderr.singletons import SIO, LibtorrentSession
import libtorrent as lt

sio = SIO.get_instance()


@sio.on("pause")  # type: ignore
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

    # Convert hex string to sha1 hash
    try:
        ih = lt.sha1_hash(bytes.fromhex(info_hash))
    except ValueError:
        return {"status": "error", "message": "Invalid info_hash format"}

    handle = ses.find_torrent(ih)
    if not handle.is_valid():
        return {"status": "error", "message": "Torrent not found"}

    if not handle.is_paused():
        handle.pause()
        return {"status": "success", "message": "Torrent paused"}

    return {"status": "info", "message": "Torrent is already paused"}
