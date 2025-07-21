import tempfile
from typing import Literal

from pydantic import BaseModel, Field

import libtorrent as lt
from seaderr.datastructures import TorrentDataclass
from seaderr.decorators import validate_payload
from seaderr.singletons import SIO, LibtorrentSession, Logger
from seaderr.stores import ExpiringStore
from seaderr.timers import wait_for

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


class AddMagnetPayload(BaseModel):
    action: Literal["fetch_metadata", "add", "remove"] = Field(...)
    magnet_uri: str | None = Field(default=None)
    save_path: str = Field(default=tempfile.gettempdir())
    info_hash: str | None = Field(default=None)


@sio.on("libtorrent:add_magnet")  # type: ignore
@validate_payload(AddMagnetPayload)
async def add_magnet(sid: str, data: AddMagnetPayload):
    ses = await LibtorrentSession.get_session()

    match data.action:
        case "fetch_metadata":
            if not data.magnet_uri:
                return {"status": "error", "message": "Magnet URI is required"}

            # Add magnet to session
            params = lt.parse_magnet_uri(data.magnet_uri)
            params.save_path = data.save_path
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

            return {
                "status": "success",
                "message": "Metadata fetched and torrent paused",
                "metadata": {
                    "info_hash": str(handle.info_hash()),
                    "name": handle.name(),
                    "save_path": handle.save_path(),
                    "size": handle.get_torrent_info().total_size(),
                },
            }
        case "add" | "remove":
            if not data.info_hash:
                return {"status": "error", "message": "Info hash is required"}

            torrent_entry = await torrent_store.get(data.info_hash)
            if not torrent_entry:
                return {"status": "error", "message": "Torrent not found in store"}

            handle = torrent_entry.torrent
            if not handle.is_valid():
                return {
                    "status": "error",
                    "message": "Stored torrent handle is invalid",
                }
            match data.action:
                case "add":
                    handle.set_upload_mode(False)
                    handle.resume()
                    await torrent_store.delete(data.info_hash)
                    return {"status": "success", "message": "Torrent resumed/started"}
                case "remove":
                    ses.remove_torrent(handle, lt.options_t.delete_files)
                    return {
                        "status": "success",
                        "message": "Torrent removed successfully",
                    }

        case _:
            return {"status": "error", "message": "Unknown action"}
