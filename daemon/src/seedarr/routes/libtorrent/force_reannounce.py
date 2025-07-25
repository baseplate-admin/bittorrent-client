from anyio import to_thread
from pydantic import BaseModel, Field

from seedarr.decorators import validate_payload
from seedarr.singletons import SIO, LibtorrentSession, Logger

sio = SIO.get_instance()
logger = Logger.get_logger()


class ForceReannouncePayload(BaseModel):
    info_hash: str = Field(...)
    trackers: list[str] = Field(...)


def _force_reannounce_by_index(handle, index: int):
    try:
        handle.force_reannounce(index)
    except Exception as e:
        logger.error(f"Failed to force reannounce tracker at index {index}: {e}")


@sio.on("libtorrent:force_reannounce")  # type: ignore
@validate_payload(ForceReannouncePayload)
async def force_reannounce(sid: str, data: ForceReannouncePayload):
    if not data.trackers:
        return {"status": "error", "message": "Trackers list is empty"}

    ses = await LibtorrentSession.get_session()
    target_hash = data.info_hash.lower()

    for handle in ses.get_torrents():
        if not handle.is_valid():
            continue

        # Convert torrent info hash to string before comparison
        if str(handle.info_hash()) == target_hash:
            if not handle.has_metadata():
                return {"status": "error", "message": "Torrent metadata not yet available"}

            current_trackers = handle.trackers()
            if not current_trackers:
                return {
                    "status": "error",
                    "message": "No trackers currently associated with torrent",
                }

            logger.info(f"[force_reannounce] Found {len(current_trackers)} trackers on torrent")

            for tr in current_trackers:
                logger.info(f"[force_reannounce] Tracker: {tr['url']} (tier: {tr['tier']})")

            target_trackers = set(t.strip().rstrip("/") for t in data.trackers)
            matching_indices = [
                i
                for i, tr in enumerate(current_trackers)
                if tr["url"].strip().rstrip("/") in target_trackers
            ]

            if matching_indices:
                for i in matching_indices:
                    logger.info(f"[force_reannounce] Reannouncing to: {current_trackers[i]['url']}")
                    await to_thread.run_sync(_force_reannounce_by_index, handle, i)

                return {
                    "status": "success",
                    "message": f"Reannounce triggered for {len(matching_indices)} tracker(s)",
                }

            return {
                "status": "error",
                "message": "None of the provided trackers matched existing ones",
            }

    return {"status": "error", "message": "Torrent not found"}
