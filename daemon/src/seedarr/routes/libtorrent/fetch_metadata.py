import tempfile

from pydantic import BaseModel, Field

import libtorrent as lt
from seedarr.decorators import validate_payload
from seedarr.serializers import serialize_file_info
from seedarr.singletons import SIO, LibtorrentSession, Logger
from seedarr.timers import wait_for

sio = SIO.get_instance()
logger = Logger.get_logger()


class FetchMetadataPayload(BaseModel):
    magnet_uri: str | None = Field(default=None)


@sio.on("libtorrent:fetch_metadata")  # type: ignore
@validate_payload(FetchMetadataPayload)
async def fetch_metadata(sid: str, data: FetchMetadataPayload):
    if not data.magnet_uri:
        return {"status": "error", "message": "Magnet URI is required"}

    ses = await LibtorrentSession.get_session()

    # Parse and add magnet URI to session
    params = lt.parse_magnet_uri(data.magnet_uri)
    params.save_path = tempfile.gettempdir()
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

    # Try to extract file info
    try:
        torrent_files = await serialize_file_info(handle)
    except Exception:
        torrent_files = []

    # Prepare metadata
    metadata = {
        "info_hash": str(handle.info_hash()),
        "name": handle.name(),
        "save_path": handle.save_path(),
        "size": handle.get_torrent_info().total_size(),
    }

    # Optionally clean up
    ses.remove_torrent(handle, lt.options_t.delete_files)

    return {
        "status": "success",
        "message": "Metadata and files fetched",
        "metadata": metadata,
        "files": torrent_files,
    }
