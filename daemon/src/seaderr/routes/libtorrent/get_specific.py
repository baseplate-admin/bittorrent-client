from seaderr.serializers import serialize_magnet_torrent_info
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


@sio.on("libtorrent:get_specific")  # type: ignore
async def get_specific(sid: str, data: dict):
    info_hash = data.get("info_hash")
    if not info_hash:
        return {"status": "error", "message": "info_hash is required"}

    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue

        if str(handle.info_hash()) == info_hash:
            metadata = await serialize_magnet_torrent_info(handle)
            return {
                "status": "success",
                "torrent": metadata,
            }

    return {"status": "error", "message": "torrent not found"}
