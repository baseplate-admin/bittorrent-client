import tempfile

import libtorrent as lt
from seaderr.singletons import SIO, LibtorrentSession, Logger

sio = SIO.get_instance()
logger = Logger.get_logger()


@sio.on("libtorrent:add_file")  # type: ignore
async def add_file(sid: str, data: dict):
    lt_session = await LibtorrentSession.get_session()

    file = data.get("file")
    save_path = data.get("save_path", tempfile.gettempdir())

    if not file:
        return {"status": "error", "message": "File not provided"}

    if not isinstance(file, bytes):
        return {"status": "error", "message": "File must be a byte string"}

    try:
        torrent_dict = lt.bdecode(file)
        torrent_info = lt.torrent_info(torrent_dict)  # type:ignore
    except Exception as e:
        return {"status": "error", "message": f"Failed to decode torrent file: {e}"}

    params = {
        "ti": torrent_info,
        "save_path": save_path,
        "storage_mode": lt.storage_mode_t.storage_mode_sparse,
    }

    try:
        handle = lt_session.add_torrent(params)
        logger.info(f"Added to libtorrent: {handle.name()}")
    except Exception as e:
        return {"status": "error", "message": f"Failed to add torrent: {e}"}

    return {
        "status": "success",
        "message": "Torrent added successfully",
        "torrent_info": {
            "name": handle.name(),
            "info_hash": str(handle.info_hash()),
            "save_path": handle.save_path(),
        },
    }
