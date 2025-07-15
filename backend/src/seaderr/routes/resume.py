from seaderr.singletons import SIO, LibtorrentSession
from libtorrent import sha1_hash

sio = SIO.get_instance()


@sio.on("resume")  # type: ignore
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
        ih = sha1_hash(bytes.fromhex(info_hash))
    except ValueError:
        return {"status": "error", "message": "Invalid info_hash format"}

    handle = ses.find_torrent(ih)
    if not handle.is_valid():
        return {"status": "error", "message": "Torrent not found"}

    if handle.is_paused():
        handle.resume()
        return {"status": "success", "message": "Torrent resumed"}

    return {"status": "info", "message": "Torrent is already active"}
