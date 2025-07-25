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
    ses = await LibtorrentSession.get_session()
    try:
        target_hash = data.info_hash
        target_trackers = set(data.trackers)

        for handle in ses.get_torrents():
            if str(handle.info_hash()) == target_hash:
                ti = handle.get_torrent_info()
                all_trackers = list(ti.trackers())
                print(all_trackers)

                logger.info(f"[force_reannounce] Found torrent with {len(all_trackers)} tracker")
                for t in all_trackers:
                    logger.info(f"[force_reannounce] Existing tracker: {t.url}")

                matching_indices = [
                    i
                    for i, tr in enumerate(all_trackers)
                    if tr.url.strip().rstrip("/") in target_trackers
                ]

                if matching_indices:
                    for i in matching_indices:
                        logger.info(f"[force_reannounce] Reannouncing to: {all_trackers[i].url}")
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

    except Exception as e:
        logger.exception("Failed to force reannounce")
        return {"status": "error", "message": str(e)}
