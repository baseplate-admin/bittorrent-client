import libtorrent as lt


async def serialize_magnet_torrent_info(handle: lt.torrent_handle) -> dict:
    ti = handle.get_torrent_info()
    status = handle.status()

    if ti is None:
        # Metadata not available yet, return minimal info
        return {
            "info_hash": str(handle.info_hash()),
            "progress": round(status.progress * 100, 2),
            "download_rate": status.download_rate,
            "upload_rate": status.upload_rate,
            "num_peers": status.num_peers,
            "seeds": status.num_seeds,
            "state": "metadata_missing",
            # Add fallback values if you want
            "name": None,
            "comment": None,
            "creator": None,
            "total_size": None,
            "piece_length": None,
            "num_pieces": None,
            "is_private": None,
            "creation_date": None,
            "num_files": None,
            "metadata_size": None,
            "save_path": handle.save_path(),
            "added_time": status.added_time,
            "completion_time": status.completed_time if status.is_finished else None,
            "downloaded": status.all_time_download,
            "uploaded": status.all_time_upload,
            "share_ratio": round(status.all_time_upload / status.all_time_download, 2)
            if status.all_time_download > 0
            else None,
            "connections": status.num_connections,
            "wasted": status.total_failed_bytes,
            "active_time": status.active_time,
            "seeding_time": status.seeding_time,
            "finished": status.is_finished,
            "files": [],
            "trackers": [],
            "nodes": [],
            "url_seeds": [],
            "http_seeds": [],
        }

    # Metadata is available, serialize full info
    info = {
        "name": ti.name(),
        "comment": ti.comment(),
        "creator": ti.creator(),
        "info_hash": str(ti.info_hash()),
        "info_hash_v2": str(ti.info_hashes().v2) if ti.info_hashes().has_v2() else None,
        "total_size": ti.total_size(),
        "piece_length": ti.piece_length(),
        "num_pieces": ti.num_pieces(),
        "is_private": ti.priv(),
        "creation_date": ti.creation_date(),
        "num_files": ti.num_files(),
        "metadata_size": ti.metadata_size(),
        "save_path": handle.save_path(),
        "added_time": status.added_time,
        "completion_time": status.completed_time if status.is_finished else None,
        "progress": round(status.progress * 100, 2),
        "downloaded": status.all_time_download,
        "uploaded": status.all_time_upload,
        "download_rate": status.download_rate,
        "upload_rate": status.upload_rate,
        "share_ratio": round(status.all_time_upload / status.all_time_download, 2)
        if status.all_time_download > 0
        else None,
        "connections": status.num_connections,
        "seeds": status.num_seeds,
        "num_peers": status.num_peers,
        "wasted": status.total_failed_bytes,
        "active_time": status.active_time,
        "seeding_time": status.seeding_time,
        "finished": status.is_finished,
    }

    # Files
    files = []
    fs = ti.files()
    for idx in range(fs.num_files()):
        f = {
            "index": idx,
            "path": fs.file_path(idx),
            "size": fs.file_size(idx),
            "offset": fs.file_offset(idx),
        }
        files.append(f)
    info["files"] = files

    # Trackers
    trackers = []
    for t in ti.trackers():
        trackers.append(
            {
                "url": t.url,
                "tier": t.tier,
                "fail_limit": t.fail_limit,
                "source": t.source,
                "verified": t.verified,
            }
        )
    info["trackers"] = trackers

    # DHT nodes
    nodes = []
    for host, port in ti.nodes():
        nodes.append({"host": host, "port": port})
    info["nodes"] = nodes

    # Web seeds
    info["url_seeds"] = getattr(ti, "url_seeds", lambda: [])()
    info["http_seeds"] = getattr(ti, "http_seeds", lambda: [])()

    return info
