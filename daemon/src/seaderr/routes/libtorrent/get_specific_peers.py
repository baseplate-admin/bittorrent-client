from pydantic import BaseModel

from seaderr.decorators import validate_payload
from seaderr.serializers import serialize_peer_info
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


class SpecificTorrentPeer(BaseModel):
    info_hash: str


@sio.on("libtorrent:get_specific_peers")  # type: ignore
@validate_payload(SpecificTorrentPeer)
async def get_specific(sid: str, data: SpecificTorrentPeer):
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue

        if str(handle.info_hash()) == data.info_hash:
            try:
                peers_info = await serialize_peer_info(handle)
            except Exception:
                peers_info = []

            return {
                "status": "success",
                "peers": peers_info,
            }
