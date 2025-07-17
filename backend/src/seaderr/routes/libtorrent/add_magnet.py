import asyncio
from datetime import timedelta

import libtorrent as lt
from seaderr.datastructures import TorrentDataclass
from seaderr.singletons import SIO, LibtorrentSession, Logger
from seaderr.stores import ExpiringStore
from seaderr.utilities import serialize_magnet_torrent_info

sio = SIO.get_instance()
logger = Logger.get_logger()


async def on_cleanup(key: str, value: TorrentDataclass):
    ses = await LibtorrentSession.get_session()
    handle = value.torrent

    if handle.is_valid():
        try:
            ses.remove_torrent(handle, lt.options_t.delete_files)
        except Exception as e:
            logger.error(f"Error removing torrent {key}: {e}")
    else:
        logger.error(f"Invalid torrent handle for {key}, skipping removal.")


torrent_store = ExpiringStore(
    TorrentDataclass,
    default_expiry=int(timedelta(hours=1).total_seconds()),
    on_cleanup=on_cleanup,
)


@sio.on("libtorrent:add_magnet")  # type: ignore
async def add_magnet(sid: str, data: dict):
    ses = await LibtorrentSession.get_session()
    action = data.get("action")

    if action == "fetch_metadata":
        magnet_uri = data.get("magnet_uri")
        save_path = data.get("save_path", ".")

        if not magnet_uri:
            return {"status": "error", "message": "Magnet URI is required"}

        # Add magnet to session
        params = lt.parse_magnet_uri(magnet_uri)
        params.save_path = save_path
        handle = ses.add_torrent(params)

        # Wait for metadata (up to 20s)
        timeout = 20
        interval = 0.5
        waited = 0
        while not handle.has_metadata() and waited < timeout:
            await asyncio.sleep(interval)
            waited += interval

        if not handle.has_metadata():
            return {
                "status": "error",
                "message": "Metadata not available after waiting",
                "metadata": None,
            }

        # Pause after fetching metadata
        handle.auto_managed(False)  # Disable auto-resume
        handle.set_upload_mode(True)  # Prevent seeding
        handle.pause()

        # Store handle
        await torrent_store.set(
            str(handle.info_hash()), TorrentDataclass(torrent=handle)
        )

        torrent_info = handle.get_torrent_info()
        serialized_info = await serialize_magnet_torrent_info(torrent_info)

        return {
            "status": "success",
            "message": "Metadata fetched and torrent paused",
            "metadata": serialized_info,
        }

    elif action == "add":
        info_hash = data.get("info_hash")
        if not info_hash:
            return {"status": "error", "message": "Info hash is required"}

        torrent_entry = await torrent_store.get(info_hash)
        if not torrent_entry:
            return {"status": "error", "message": "Torrent not found in store"}

        handle = torrent_entry.torrent
        if not handle.is_valid():
            return {
                "status": "error",
                "message": "Stored torrent handle is invalid",
            }

        handle.set_upload_mode(False)
        handle.auto_managed(True)
        handle.resume()
        return {"status": "success", "message": "Torrent resumed/started"}

    elif action == "remove":
        info_hash = data.get("info_hash")
        if not info_hash:
            return {"status": "error", "message": "Info hash is required"}

        torrent_entry = await torrent_store.get(info_hash)
        if not torrent_entry:
            return {"status": "error", "message": "Torrent not found in store"}

        handle = torrent_entry.torrent
        if handle.is_valid():
            ses.remove_torrent(handle, lt.options_t.delete_files)

        await torrent_store.delete(info_hash)
        return {"status": "success", "message": "Torrent removed successfully"}

    return {"status": "error", "message": "Unknown action"}
