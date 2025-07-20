import asyncio

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


async def serialize_peers(peers: list[lt.peer_info]) -> tuple[list[dict], int]:
    peers_info = []
    total_leeches = 0

    for p in peers:
        seed = bool(p.flags & lt.peer_info.seed)
        if not seed:
            total_leeches += 1

        peers_info.append(
            {
                "ip": p.ip[0],
                "port": p.ip[1],
                "client": p.client.decode("utf-8", "ignore"),
                "connection_type": infer_connection_type(p.flags),
                "progress": p.progress,
                "flags": p.flags,
                "download_queue_length": p.download_queue_length,
                "upload_queue_length": p.upload_queue_length,
                "up_speed": p.up_speed,
                "down_speed": p.down_speed,
                "total_download": p.total_download,
                "total_upload": p.total_upload,
                "seed": seed,
            }
        )
    return peers_info, total_leeches


async def serialize_file(fs, idx) -> dict:
    return {
        "index": idx,
        "path": fs.file_path(idx),
        "size": fs.file_size(idx),
        "offset": fs.file_offset(idx),
    }


async def serialize_node(node) -> dict:
    host, port = node
    return {"host": host, "port": port}


async def serialize_magnet_torrent_info(handle: lt.torrent_handle) -> dict:
    ti = handle.get_torrent_info()
    status = handle.status()

    try:
        peers = handle.get_peer_info()
    except Exception:
        peers = []

    peers_info, total_leeches = [], 0
    files, nodes = [], []

    async with asyncio.TaskGroup() as tg:
        # Peers serialization task
        peer_task = tg.create_task(serialize_peers(peers)) if peers else None

        # Files serialization tasks: one task per file
        file_tasks = []
        if ti:
            fs = ti.files()
            for i in range(fs.num_files()):
                file_tasks.append(tg.create_task(serialize_file(fs, i)))

        # Nodes serialization tasks: one task per node
        node_tasks = []
        if ti:
            for node in ti.nodes():
                node_tasks.append(tg.create_task(serialize_node(node)))

    # Retrieve peers info
    if peer_task:
        peers_info, total_leeches = peer_task.result()

    # Retrieve files info in order
    if file_tasks:
        files = [t.result() for t in file_tasks]

    # Retrieve nodes info in order
    if node_tasks:
        nodes = [t.result() for t in node_tasks]

    downloaded = (
        status.all_time_download or status.total_done or status.total_wanted_done or 0
    )
    uploaded = status.all_time_upload or 0

    info = {
        "info_hash": str(handle.info_hash()),
        "progress": round(status.progress * 100, 2),
        "download_rate": status.download_rate,
        "upload_rate": status.upload_rate,
        "num_peers": status.num_peers,
        "seeds": status.num_seeds,
        "state": "metadata_present" if ti else "metadata_missing",
        "save_path": handle.save_path(),
        "added_time": status.added_time,
        "completion_time": status.completed_time if status.is_finished else None,
        "downloaded": downloaded,
        "uploaded": uploaded,
        "connections": status.num_connections,
        "wasted": status.total_failed_bytes,
        "active_time": status.active_time,
        "seeding_time": status.seeding_time,
        "finished": status.is_finished,
        "next_announce": int(status.next_announce.total_seconds()),
        "connected_seeds": status.num_seeds,
        "connected_leeches": status.num_peers - status.num_seeds,
        "total_known_peers": len(peers_info),
        "leeches": total_leeches,
        "peers": peers_info,
    }

    if not ti:
        info.update(
            {
                k: None
                for k in [
                    "name",
                    "comment",
                    "creator",
                    "info_hash_v2",
                    "total_size",
                    "piece_length",
                    "num_pieces",
                    "is_private",
                    "creation_date",
                    "num_files",
                    "metadata_size",
                ]
            }
        )
        info.update(
            {
                "files": [],
                "trackers": [],
                "nodes": [],
                "url_seeds": [],
                "http_seeds": [],
            }
        )
        return info

    trackers = list(ti.trackers()) + handle.trackers()
    info.update(
        {
            "name": ti.name(),
            "comment": ti.comment(),
            "creator": ti.creator(),
            "info_hash_v2": str(ti.info_hashes().v2)
            if ti.info_hashes().has_v2()
            else None,
            "total_size": ti.total_size(),
            "piece_length": ti.piece_length(),
            "num_pieces": ti.num_pieces(),
            "is_private": ti.priv(),
            "creation_date": ti.creation_date(),
            "num_files": ti.num_files(),
            "metadata_size": ti.metadata_size(),
            "files": files,
            "trackers": trackers,
            "nodes": nodes,
            "url_seeds": getattr(ti, "url_seeds", lambda: [])(),
            "http_seeds": getattr(ti, "http_seeds", lambda: [])(),
        }
    )

    return info
