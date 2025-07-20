# TODO: Massively parallelize this function to speed up the serialization of magnet torrent info. #noqa: E501

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


async def serialize_magnet_torrent_info(handle: lt.torrent_handle) -> dict:
    ti = handle.get_torrent_info()
    status = handle.status()

    try:
        peers = handle.get_peer_info()
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
    except Exception:
        peers_info = []
        total_leeches = 0

    downloaded = (
        status.all_time_download or status.total_done or status.total_wanted_done or 0
    )
    uploaded = status.all_time_upload or 0

    # --- Basic info ---
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

    # --- If metadata is missing ---
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

    # --- Metadata present ---
    fs = ti.files()
    files = [
        {
            "index": idx,
            "path": fs.file_path(idx),
            "size": fs.file_size(idx),
            "offset": fs.file_offset(idx),
        }
        for idx in range(fs.num_files())
    ]

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
