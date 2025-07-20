import asyncio

import libtorrent as lt


def infer_connection_type(flags: int) -> str:
    WEB_SEED = 1 << 31
    HTTP_SEED = 1 << 30
    UTP_SOCKET = 0x2000
    if flags & WEB_SEED:
        return "web_seed"
    if flags & HTTP_SEED:
        return "http_seed"
    if flags & UTP_SOCKET:
        return "utp"
    return "tcp"


async def serialize_magnet_torrent_info(handle: lt.torrent_handle) -> dict:
    ti = handle.get_torrent_info()
    status = handle.status()

    # 1. Pull raw peer data synchronously
    raw_peers = []
    try:
        for p in handle.get_peer_info():
            raw_peers.append(
                (
                    f"{p.ip[0]}",
                    p.ip[1],
                    p.flags,
                    p.client,
                    p.progress,
                    p.down_speed,
                    p.up_speed,
                    p.total_download,
                    p.total_upload,
                )
            )
    except Exception:
        raw_peers = []

    # 2. Define pure‑Python serialization coroutines
    async def _ser_peer(ip, port, flags, client_bytes, progress, down, up, dl, ul):
        try:
            return {
                "ip": ip,
                "port": port,
                "connection_type": infer_connection_type(flags),
                "flags": flags,
                "client": client_bytes.decode("utf-8", errors="ignore"),
                "progress": round(progress * 100, 2),
                "down_speed": down,
                "up_speed": up,
                "downloaded": dl,
                "uploaded": ul,
            }
        except Exception:
            return {
                "ip": None,
                "connection_type": "unknown",
                "flags": None,
                "client": None,
                "progress": 0,
                "down_speed": 0,
                "up_speed": 0,
                "downloaded": 0,
                "uploaded": 0,
            }

    # 3. Fan‑out peer serialization in TaskGroup
    async with asyncio.TaskGroup() as tg:
        peer_tasks = [tg.create_task(_ser_peer(*rp)) for rp in raw_peers]
    peers_info = [t.result() for t in peer_tasks]

    # 4. Pull raw file & node data synchronously
    files_list = []
    nodes_list = []
    if ti:
        fs = ti.files()
        for idx in range(fs.num_files()):
            files_list.append(
                (
                    idx,
                    fs.file_path(idx),
                    fs.file_size(idx),
                    fs.file_offset(idx),
                )
            )
        nodes_list = list(ti.nodes())

    # 5. Define file & node serializers
    async def _ser_file(idx, path, size, offset):
        return {"index": idx, "path": path, "size": size, "offset": offset}

    async def _ser_node(host, port):
        return {"host": host, "port": port}

    # 6. Fan‑out file & node serialization
    async with asyncio.TaskGroup() as tg2:
        file_tasks = [tg2.create_task(_ser_file(*f)) for f in files_list]
        node_tasks = [tg2.create_task(_ser_node(h, p)) for h, p in nodes_list]
    files_info = [t.result() for t in file_tasks]
    nodes_info = [t.result() for t in node_tasks]

    # --- Build the final dict ---
    downloaded = status.all_time_download or status.total_done or 0
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
            "files": files_info,
            "trackers": trackers,
            "nodes": nodes_info,
        }
    )

    return info
