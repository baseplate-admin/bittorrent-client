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
                existing_trackers = handle.trackers()
                original_urls = {tr["url"] for tr in existing_trackers}

                # Trackers to remove
                to_remove = set(data.trackers)
                updated_trackers = [
                    {"url": tr["url"], "tier": tr["tier"]}
                    for tr in existing_trackers
                    if tr["url"] not in to_remove
                ]

                handle.replace_trackers(updated_trackers)

                return {
                    "status": "success",
                    "message": (
                        f"Removed "
                        f"{len(original_urls - set(t['url'] for t in updated_trackers))}"
                        " tracker(s)"
                    ),
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
