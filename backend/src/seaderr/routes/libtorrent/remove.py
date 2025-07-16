from seaderr.singletons import SIO, LibtorrentSession
import libtorrent as lt

sio = SIO.get_instance()


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

    return {"status": "success", "message": "Torrent removed"}
