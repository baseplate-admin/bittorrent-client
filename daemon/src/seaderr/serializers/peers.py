import anyio
import anyio.to_thread
import libtorrent as lt


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


async def serialize_peer_info(handle: lt.torrent_handle) -> tuple[list[dict], int]:
    try:
        peers = await anyio.to_thread.run_sync(handle.get_peer_info)
    except Exception:
        return [], 0

    results = []
    lock = anyio.Lock()

    async with anyio.create_task_group() as tg:

        async def run_and_store(p: lt.peer_info):
            def serialize():
                seed = bool(p.flags & lt.peer_info.seed)
                return {
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

            result = await anyio.to_thread.run_sync(serialize)
            async with lock:
                results.append(result)

        for p in peers:
            tg.start_soon(run_and_store, p)

    total_leeches = sum(1 for p in results if not p["seed"])
    return results, total_leeches
