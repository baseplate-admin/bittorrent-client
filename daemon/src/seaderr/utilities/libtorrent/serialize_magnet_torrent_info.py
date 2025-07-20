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


def serialize_peer(p: lt.peer_info):
    try:
        client = p.client.decode("utf-8", errors="ignore")
    except Exception:
        client = ""

    ip_str = str(p.ip[0]) if p.ip else None
    port = p.ip[1] if p.ip else None

    return {
        "ip": ip_str,
        "port": port,
        "connection_type": infer_connection_type(p.flags),
        "flags": p.flags,
        "client": client,
        "progress": round(p.progress * 100, 2),
        "down_speed": p.down_speed,
        "up_speed": p.up_speed,
        "downloaded": p.total_download,
        "uploaded": p.total_upload,
    }


def unique_trackers(trackers_list):
    seen = set()
    unique = []
    for tracker in trackers_list:
        # Use 'url' or 'announce' as unique keys; fallback to string form if missing
        key = tracker.get("url") or tracker.get("announce") or str(tracker)
        if key not in seen:
            seen.add(key)
            unique.append(tracker)
    return unique


def serialize_magnet_torrent_info(handle: lt.torrent_handle) -> dict:
    ti = handle.get_torrent_info()
    status = handle.status()

    peers_info = []
    total_leeches = 0
    try:
        peers = handle.get_peer_info()
        peers_info = [serialize_peer(p) for p in peers]
        total_leeches = sum(1 for p in peers if not (p.flags & lt.peer_info.seed))
    except Exception:
        peers_info = []
        total_leeches = 0

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

    combined_trackers = list(ti.trackers()) + handle.trackers()
    trackers = unique_trackers(combined_trackers)

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
        }
    )

    return info
