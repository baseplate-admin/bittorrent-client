from pydantic import BaseModel, Field

from seaderr.decorators import validate_payload
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


class RemoveTrackerPayload(BaseModel):
    info_hash: str = Field(...)
    trackers: list[str] = Field(...)


@sio.on("libtorrent:remove_tracker")  # type: ignore
@validate_payload(RemoveTrackerPayload)
async def remove_tracker(sid: str, data: RemoveTrackerPayload):
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue

        if str(handle.info_hash()) == data.info_hash:
            try:
                original_trackers = handle.trackers()

                updated_trackers = [
                    tr for tr in original_trackers if tr["url"] not in data.trackers
                ]

                handle.replace_trackers([dict(tr) for tr in updated_trackers])

                return {
                    "status": "success",
                    "message": "Trackers removed",
                    "remaining_trackers": [tr["url"] for tr in updated_trackers],
                }

            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Failed to remove trackers: {str(e)}",
                }

    return {
        "status": "error",
        "message": "Torrent not found",
    }
