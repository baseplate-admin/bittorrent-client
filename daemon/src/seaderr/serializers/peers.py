import anyio
import libtorrent as lt

from seaderr.singletons import Logger

logger = Logger.get_logger()


def infer_connection_type(flags: int) -> str:
    WEB_SEED = 1 << 31
    HTTP_SEED = 1 << 30
    UTP_SOCKET = 0x2000

    if flags & WEB_SEED:
        return "WEB"
    if flags & HTTP_SEED:
        return "HTTP"
    if flags & UTP_SOCKET:
        return "μTP"
    return "BT"


async def serialize_peer_info(handle: lt.torrent_handle) -> list[dict]:
    try:
        peers = handle.get_peer_info()
    except Exception as e:
        logger.error(f"Failed to get peer info: {e}")
        return []

    results = []
    lock = anyio.Lock()

    async def run_and_store(p: lt.peer_info):
        try:
            seed = bool(p.flags & lt.peer_info.seed)
            result = {
                "ip": str(p.ip[0]),
                "port": int(p.ip[1]),
                "client": p.client.decode("utf-8", "ignore"),
                "connection_type": infer_connection_type(p.flags),
                "progress": float(p.progress),
                "flags": int(p.flags),
                "download_queue_length": int(p.download_queue_length),
                "upload_queue_length": int(p.upload_queue_length),
                "up_speed": int(p.up_speed),
                "down_speed": int(p.down_speed),
                "total_download": int(p.total_download),
                "total_upload": int(p.total_upload),
                "seed": seed,
            }
            async with lock:
                results.append(result)
        except Exception as ex:
            logger.warning(f"Error serializing peer info: {ex}")

    async with anyio.create_task_group() as tg:
        for p in peers:
            tg.start_soon(run_and_store, p)

    return results
