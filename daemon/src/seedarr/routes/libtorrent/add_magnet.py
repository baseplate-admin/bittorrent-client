import tempfile

from pydantic import BaseModel, Field, field_validator

import libtorrent as lt
from seedarr.decorators import validate_payload
from seedarr.singletons import SIO, LibtorrentSession, Logger

sio = SIO.get_instance()
logger = Logger.get_logger()


class AddMagnetPayload(BaseModel):
    magnet_uri: str | None = Field(default=None)
    save_path: str = Field(default_factory=tempfile.gettempdir)

    @field_validator("save_path", mode="before")
    @classmethod
    def set_default_save_path_if_empty(cls, v):
        if not v or (isinstance(v, str) and v.strip() == ""):
            return tempfile.gettempdir()
        return v


@sio.on("libtorrent:add_magnet")  # type: ignore
@validate_payload(AddMagnetPayload)
async def add_magnet(sid: str, data: AddMagnetPayload):
    if not data.magnet_uri:
        return {"status": "error", "message": "Magnet URI is required"}

    ses = await LibtorrentSession.get_session()

    try:
        # Parse magnet URI
        params = lt.parse_magnet_uri(data.magnet_uri)
        params.save_path = data.save_path

        # Try to use resume data if available
        handle = ses.add_torrent(params)

        # Get torrent info
        ti = handle.get_torrent_info()

        return {
            "status": "success",
            "info_hash": str(ti.info_hash()),
        }

    except Exception as e:
        logger.exception("Failed to add magnet")
        return {"status": "error", "message": str(e)}
