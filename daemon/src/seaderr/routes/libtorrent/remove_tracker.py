from pydantic import BaseModel, Field

from seaderr.decorators import validate_payload
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


class AddTrackerPayload(BaseModel):
    info_hash: str = Field(...)
    trackers: list[str] = Field(...)


@sio.on("libtorrent:add_tracker")  # type: ignore
@validate_payload(AddTrackerPayload)
async def add_tracker(sid: str, data: AddTrackerPayload):
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue

        if str(handle.info_hash()) == data.info_hash:
            try:
                existing_trackers = handle.trackers()
                existing_urls = {tr["url"] for tr in existing_trackers}

                # Get max existing tier to place new trackers after them
                max_tier = max((tr["tier"] for tr in existing_trackers), default=0)

                # New trackers to be added (skip duplicates)
                new_trackers = [
                    {"url": url, "tier": max_tier + 1}
                    for url in data.trackers
                    if url not in existing_urls
                ]

                # Convert existing announce_entry to dict
                existing_as_dicts = [
                    {"url": tr["url"], "tier": tr["tier"]} for tr in existing_trackers
                ]

                # Final list: existing first, then new ones
                combined_trackers = existing_as_dicts + new_trackers

                # Replace the entire tracker list
                handle.replace_trackers(combined_trackers)

                return {
                    "status": "success",
                    "message": f"Added {len(new_trackers)} tracker(s)",
                    "all_trackers": [tr["url"] for tr in combined_trackers],
                }

            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Failed to add trackers: {str(e)}",
                }

    return {
        "status": "error",
        "message": "Torrent not found",
    }
