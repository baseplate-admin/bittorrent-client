import tempfile
from typing import Literal

from pydantic import BaseModel

import libtorrent as lt
from seaderr.datastructures import TorrentDataclass
from seaderr.decorators import validate_payload
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


class AddMagnetPayload(BaseModel):
    action: Literal["fetch_metadata", "add", "remove"]
    magnet_uri: str | None = None
    save_path: str = tempfile.gettempdir()
    info_hash: str | None = None


@sio.on("libtorrent:add_magnet")  # type: ignore
@validate_payload(AddMagnetPayload)
async def add_magnet(sid: str, data: AddMagnetPayload):
    ses = await LibtorrentSession.get_session()

    if data.action == "fetch_metadata":
        if not data.magnet_uri:
            await sio.emit(
                "libtorrent:add_magnet",
                {"status": "error", "message": "Magnet URI is required"},
                to=sid,
            )
            return

        params = lt.parse_magnet_uri(data.magnet_uri)
        params.save_path = data.save_path or tempfile.gettempdir()

        handle = ses.add_torrent(params)

        async def is_ready():
            return handle.has_metadata()

        await wait_for(is_ready, timeout=20, backoff="exponential")

        if not handle.has_metadata():
            await sio.emit(
                "libtorrent:add_magnet",
                {
                    "status": "error",
                    "message": "Metadata not available after waiting",
                    "metadata": None,
                },
                to=sid,
            )
            return

        handle.auto_managed(False)
        handle.pause()

        await torrent_store.set(
            str(handle.info_hash()), TorrentDataclass(torrent=handle)
        )

        serialized_info = await serialize_magnet_torrent_info(handle)

        await sio.emit(
            "libtorrent:add_magnet",
            {
                "status": "success",
                "message": "Metadata fetched and torrent paused",
                "metadata": serialized_info,
            },
            to=sid,
        )
        return

    elif data.action in ("add", "remove"):
        if not data.info_hash:
            await sio.emit(
                "libtorrent:add_magnet",
                {"status": "error", "message": "Info hash is required"},
                to=sid,
            )
            return

        torrent_entry = await torrent_store.get(data.info_hash)
        if not torrent_entry:
            await sio.emit(
                "libtorrent:add_magnet",
                {"status": "error", "message": "Torrent not found in store"},
                to=sid,
            )
            return

        handle = torrent_entry.torrent
        if not handle.is_valid():
            await sio.emit(
                "libtorrent:add_magnet",
                {"status": "error", "message": "Stored torrent handle is invalid"},
                to=sid,
            )
            return

        if data.action == "add":
            handle.set_upload_mode(False)
            handle.resume()
            await torrent_store.delete(data.info_hash)

            await sio.emit(
                "libtorrent:add_magnet",
                {"status": "success", "message": "Torrent resumed/started"},
                to=sid,
            )
            return

        elif data.action == "remove":
            ses.remove_torrent(handle, lt.options_t.delete_files)

            await sio.emit(
                "libtorrent:add_magnet",
                {"status": "success", "message": "Torrent removed successfully"},
                to=sid,
            )
            return

    await sio.emit(
        "libtorrent:add_magnet",
        {"status": "error", "message": "Unknown action"},
        to=sid,
    )
