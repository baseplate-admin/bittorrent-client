from seaderr.singletons import SIO, LibtorrentSession
from seaderr.utilities import is_valid_magnet, serialize_magnet_torrent_info
import libtorrent as lt
import asyncio

sio = SIO.get_instance()
pending = {}


@sio.on("libtorrent:add_magnet")  # type: ignore
async def add_magnet(sid: str, data: dict):
    action = data.get("action", "fetch_metadata")
    ses = await LibtorrentSession.get_session()

    if action == "fetch_metadata":
        magnet = data.get("magnet")
        if not magnet or not await is_valid_magnet(magnet):
            return {"status": "error", "message": "Invalid or missing magnet link"}

        params = {
            "save_path": data.get("save_path", "."),
            "storage_mode": lt.storage_mode_t(lt.storage_mode_t.storage_mode_sparse),
        }
        handle = lt.add_magnet_uri(ses, magnet, params)
        while not handle.has_metadata():
            await asyncio.sleep(1)
        handle.pause()

        torrent_info = handle.get_torrent_info()
        metadata = await serialize_magnet_torrent_info(torrent_info)

        # Extract file info list
        files = []
        for f in torrent_info.files():
            files.append(
                {
                    "path": f.path,
                    "size": f.size,
                }
            )

        torrent_id = id(handle)
        pending.setdefault(sid, {})[torrent_id] = handle

        return {
            "status": "success",
            "message": "Metadata fetched. Confirm add or cancel.",
            "torrent_id": torrent_id,
            "metadata": metadata,
            "files": files,  # Added here
        }
    elif action in ("add", "cancel"):
        torrent_id = data.get("torrent_id")
        if not torrent_id or sid not in pending or torrent_id not in pending[sid]:
            return {"status": "error", "message": "Invalid torrent_id"}

        handle = pending[sid].pop(torrent_id)
        if action == "cancel":
            ses.remove_torrent(handle)
            return {"status": "success", "message": "Torrent cancelled"}

        return {"status": "success", "message": "Torrent added"}

    return {"status": "error", "message": "Unknown action"}
