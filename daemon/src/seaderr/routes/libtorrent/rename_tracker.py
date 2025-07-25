from pydantic import BaseModel, Field

import libtorrent as lt
from seaderr.decorators import validate_payload
from seaderr.serializers import serialize_file_info
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


class RenameTrackerPayload(BaseModel):
    old_tracker: str = Field(...)
    new_tracker: str = Field(...)
    info_hash: str = Field(...)


@sio.on("libtorrent:rename_trackers")  # type: ignore
@validate_payload(RenameTrackerPayload)
async def rename_trackers(sid: str, data: RenameTrackerPayload):
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue

        if str(handle.info_hash()) == data.info_hash:
            # Get current trackers
            tracker_entries = handle.trackers()
            updated_trackers = []

            for entry in tracker_entries:
                if entry["url"] == data.old_tracker:
                    # Replace with new tracker
                    new_entry = lt.announce_entry(data.new_tracker)
                    updated_trackers.append(new_entry)
                else:
                    updated_trackers.append(entry)

            # Apply the updated tracker list
            handle.replace_trackers(updated_trackers)

            # Optional: Re-announce to the new tracker immediately
            handle.force_reannounce()

            try:
                torrent_files = await serialize_file_info(handle)
            except Exception:
                torrent_files = []

            return {
                "status": "success",
                "message": (
                    f"Tracker {data.old_tracker} renamed to "
                    f"{data.new_tracker}"
                ),
                "files": torrent_files,
            }

    return {"status": "error", "message": "Torrent with given info_hash not found"}
