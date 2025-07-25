from pydantic import BaseModel, Field

from seedarr.decorators import validate_payload
from seedarr.serializers import serialize_file_info
from seedarr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


class SpecificTorrentFiles(BaseModel):
    info_hash: str = Field(...)


@sio.on("libtorrent:get_specific_files")  # type: ignore
@validate_payload(SpecificTorrentFiles)
async def get_specific_files(sid: str, data: SpecificTorrentFiles):
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue

        if str(handle.info_hash()) == data.info_hash:
            try:
                torrent_files = await serialize_file_info(handle)
            except Exception:
                torrent_files = []

            return {
                "status": "success",
                "files": torrent_files,
            }
