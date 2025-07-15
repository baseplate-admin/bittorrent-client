from seaderr.singletons import SIO, LibtorrentSession
from seaderr.utilities import is_valid_magnet
import libtorrent as lt
import asyncio

sio = SIO.get_instance()


@sio.on("add_magnet")  # type: ignore
async def add(sid: str, data: dict):
    """
    Handle the 'add_magnet' event from the client.

    Args:
        sid (str): The session ID of the client.
        data (dict): The data sent from the client.
    """

    magnet = data.get("magnet", None)
    if not magnet:
        return {"status": "error", "message": "No magnet link provided"}

    if not await is_valid_magnet(magnet):
        return {"status": "error", "message": "Invalid magnet link"}

    ses = await LibtorrentSession.get_session()
    try:
        params = {
            "save_path": data.get("save_path", "."),
            "storage_mode": lt.storage_mode_t(lt.storage_mode_t.storage_mode_sparse),
        }
        handle = lt.add_magnet_uri(ses, magnet, params)
        while not handle.has_metadata():
            await asyncio.sleep(1)

        return {
            "status": "success",
            "message": f"Processed {data}",
            "metadata": handle.get_torrent_info(),
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
