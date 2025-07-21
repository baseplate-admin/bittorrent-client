import os

import anyio
import anyio.to_thread
import libtorrent as lt


def infer_connection_type(flags: int) -> str:
    WEB_SEED = 1 << 31
    HTTP_SEED = 1 << 30
    UTP_SOCKET = 0x2000  # 8192 decimal

    if flags & WEB_SEED:
        return "WEB"
    if flags & HTTP_SEED:
        return "HTTP"
    if flags & UTP_SOCKET:
        return "μTP"
    return "BT"


def serialize_single_peer(p: dict) -> dict:
    seed = bool(p["flags"] & lt.peer_info.seed)
    return {
        "ip": p["ip"][0],
        "port": p["ip"][1],
        "client": p["client"].decode("utf-8", "ignore"),
        "connection_type": infer_connection_type(p["flags"]),
        "progress": p["progress"],
        "flags": p["flags"],
        "download_queue_length": p["download_queue_length"],
        "upload_queue_length": p["upload_queue_length"],
        "up_speed": p["up_speed"],
        "down_speed": p["down_speed"],
        "total_download": p["total_download"],
        "total_upload": p["total_upload"],
        "seed": seed,
    }


async def serialize_peer_list_concurrent(peer_data: list[dict]) -> list[dict]:
    results = []

    async with anyio.create_task_group() as tg:
        # We will append results thread-safely using a lock
        lock = anyio.Lock()

        async def run_and_store(p):
            res = await anyio.to_thread.run_sync(serialize_single_peer, p)
            async with lock:
                results.append(res)

        for p in peer_data:
            tg.start_soon(run_and_store, p)

    return results


async def serialize_peers_asyncio(
    handle: lt.torrent_handle, max_peers: int = 1000
) -> tuple[list[dict], int]:
    try:
        peers = await anyio.to_thread.run_sync(handle.get_peer_info)
        peers = peers[:max_peers]

        peer_data = [
            {
                "ip": (str(p.ip[0]), int(p.ip[1])),
                "client": bytes(p.client),
                "flags": int(p.flags),
                "progress": float(p.progress),
                "download_queue_length": int(p.download_queue_length),
                "upload_queue_length": int(p.upload_queue_length),
                "up_speed": int(p.up_speed),
                "down_speed": int(p.down_speed),
                "total_download": int(p.total_download),
                "total_upload": int(p.total_upload),
            }
            for p in peers
        ]

        peers_info = await serialize_peer_list_concurrent(peer_data)
        total_leeches = sum(1 for p in peers_info if not p["seed"])
        return peers_info, total_leeches
    except Exception:
        return [], 0


def extract_single_file_info(idx: int, fs, file_progress, file_priorities) -> dict:
    full_path = fs.file_path(idx)
    size = fs.file_size(idx)
    progress = file_progress[idx]
    remaining = size - progress

    return {
        "index": idx,
        "path": str(full_path),
        "name": os.path.basename(full_path),
        "size": int(size),
        "offset": int(fs.file_offset(idx)),
        "progress": int(progress),
        "remaining": int(remaining),
        "priority": int(file_priorities[idx]),
    }


async def extract_files_info(
    handle: lt.torrent_handle, ti: lt.torrent_info
) -> list[dict]:
    fs = ti.files()
    num_files = fs.num_files()

    try:
        file_progress = await anyio.to_thread.run_sync(handle.file_progress)
    except Exception:
        file_progress = [0] * num_files

    try:
        file_priorities = await anyio.to_thread.run_sync(handle.file_priorities)
    except Exception:
        file_priorities = [0] * num_files

    results = []
    async with anyio.create_task_group() as tg:
        lock = anyio.Lock()

        async def run_and_store(idx):
            res = await anyio.to_thread.run_sync(
                extract_single_file_info,
                idx,
                fs,
                file_progress,
                file_priorities,
            )
            async with lock:
                results.append(res)

        for idx in range(num_files):
            tg.start_soon(run_and_store, idx)

    return results


async def serialize_magnet_torrent_info(handle: lt.torrent_handle) -> dict:
    ti = await anyio.to_thread.run_sync(handle.get_torrent_info)
    status = await anyio.to_thread.run_sync(handle.status)

    peers_info, total_leeches = await serialize_peers_asyncio(handle)

    downloaded = (
        status.all_time_download or status.total_done or status.total_wanted_done or 0
    )
    uploaded = status.all_time_upload or 0

    info = {
        "info_hash": str(handle.info_hash()),
        "progress": round(status.progress * 100, 2),
        "download_rate": int(status.download_rate),
        "upload_rate": int(status.upload_rate),
        "num_peers": int(status.num_peers),
        "seeds": int(status.num_seeds),
        "state": "metadata_present" if ti else "metadata_missing",
        "save_path": handle.save_path(),
        "added_time": int(status.added_time),
        "completion_time": int(status.completed_time) if status.is_finished else None,
        "downloaded": int(downloaded),
        "uploaded": int(uploaded),
        "connections": int(status.num_connections),
        "wasted": int(status.total_failed_bytes),
        "active_time": int(status.active_time),
        "seeding_time": int(status.seeding_time),
        "finished": bool(status.is_finished),
        "next_announce": int(status.next_announce.total_seconds()),
        "connected_seeds": int(status.num_seeds),
        "connected_leeches": int(status.num_peers - status.num_seeds),
        "total_known_peers": len(peers_info),
        "leeches": int(total_leeches),
        "peers": peers_info,
    }

    if not ti:
        info.update(
            {
                "name": None,
                "comment": None,
                "creator": None,
                "info_hash_v2": None,
                "total_size": None,
                "piece_length": None,
                "num_pieces": None,
                "is_private": None,
                "creation_date": None,
                "num_files": None,
                "metadata_size": None,
                "files": [],
                "trackers": [],
                "nodes": [],
                "url_seeds": [],
                "http_seeds": [],
            }
        )
        return info

    files = await extract_files_info(handle, ti)
    nodes = [{"host": host, "port": port} for host, port in ti.nodes()]
    trackers = list(ti.trackers()) + handle.trackers()

    info.update(
        {
            "name": ti.name(),
            "comment": ti.comment(),
            "creator": ti.creator(),
            "info_hash_v2": str(ti.info_hashes().v2)
            if ti.info_hashes().has_v2()
            else None,
            "total_size": int(ti.total_size()),
            "piece_length": int(ti.piece_length()),
            "num_pieces": int(ti.num_pieces()),
            "is_private": bool(ti.priv()),
            "creation_date": int(ti.creation_date()),
            "num_files": int(ti.num_files()),
            "metadata_size": int(ti.metadata_size()),
            "files": files,
            "trackers": trackers,
            "nodes": nodes,
            "url_seeds": getattr(ti, "url_seeds", lambda: [])(),
            "http_seeds": getattr(ti, "http_seeds", lambda: [])(),
        }
    )

    return info
