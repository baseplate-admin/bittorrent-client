from pydantic import BaseModel, Field

from seaderr.decorators import validate_payload
from seaderr.serializers import serialize_magnet_torrent_info
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


class SpecificTorrentData(BaseModel):
    info_hash: str = Field(...)


@sio.on("libtorrent:get_specific")  # type: ignore
@validate_payload(SpecificTorrentData)
async def get_specific(sid: str, data: SpecificTorrentData):
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue

        if str(handle.info_hash()) == data.info_hash:
            metadata = await serialize_magnet_torrent_info(handle)
            return {
                "status": "success",
                "torrent": metadata,
            }

    return {"status": "error", "message": "torrent not found"}
