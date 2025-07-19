import tempfile

import libtorrent as lt
from seaderr.datastructures import TorrentDataclass
from seaderr.singletons import SIO, LibtorrentSession, Logger
from seaderr.stores import ExpiringStore
from seaderr.timers import wait_for
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
    default_expiry=15,
    on_cleanup=on_cleanup,
)


@sio.on("libtorrent:add_magnet")  # type: ignore
async def add_magnet(sid: str, data: dict):
    ses = await LibtorrentSession.get_session()
    action = data.get("action")

    if action == "fetch_metadata":
        magnet_uri = data.get("magnet_uri")
        save_path = data.get("save_path", tempfile.gettempdir())

        if not magnet_uri:
            return {"status": "error", "message": "Magnet URI is required"}

        # Add magnet to session
        params = lt.parse_magnet_uri(magnet_uri)
        params.save_path = save_path
        handle = ses.add_torrent(params)

        async def is_ready():
            return handle.has_metadata()

        await wait_for(is_ready, timeout=20, backoff="exponential")

        if not handle.has_metadata():
            return {
                "status": "error",
                "message": "Metadata not available after waiting",
                "metadata": None,
            }

        # Pause after fetching metadata
        handle.auto_managed(False)  # Disable auto-resume
        handle.pause()

        # Store handle
        await torrent_store.set(
            str(handle.info_hash()), TorrentDataclass(torrent=handle)
        )

        serialized_info = await serialize_magnet_torrent_info(handle)

        return {
            "status": "success",
            "message": "Metadata fetched and torrent paused",
            "metadata": serialized_info,
        }

    elif action in ("add", "remove"):
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
        if action == "add":
            handle.set_upload_mode(False)
            handle.resume()
            await torrent_store.delete(info_hash)
            return {"status": "success", "message": "Torrent resumed/started"}

        elif action == "remove":
            ses.remove_torrent(handle, lt.options_t.delete_files)
            return {"status": "success", "message": "Torrent removed successfully"}

    return {"status": "error", "message": "Unknown action"}
