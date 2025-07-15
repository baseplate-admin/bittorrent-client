import libtorrent as lt


async def serialize_magnet_torrent_info(ti: lt.torrent_info) -> dict:
    info = {
        "name": ti.name(),
        "comment": ti.comment(),
        "creator": ti.creator(),
        "info_hash": str(ti.info_hash()),
        # "info_hash_v2": str(ti.info_hash_v2()),  # Possibly missing, comment out or use getattr
        "total_size": ti.total_size(),
        "piece_length": ti.piece_length(),
        "num_pieces": ti.num_pieces(),
        "is_private": ti.priv(),
        "creation_date": ti.creation_date(),
        "num_files": ti.num_files(),
        "metadata_size": ti.metadata_size(),
    }

    files = []
    fs = ti.files()
    for idx in range(fs.num_files()):
        f = {
            "index": idx,
            "path": fs.file_path(idx),
            "size": fs.file_size(idx),
            # "mtime": getattr(fs, "file_mtime", lambda i: None)(idx),  # fallback
            "offset": fs.file_offset(idx),
        }
        files.append(f)
    info["files"] = files

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

    nodes = []
    for host, port in ti.nodes():
        nodes.append({"host": host, "port": port})
    info["nodes"] = nodes

    url_seeds = getattr(ti, "url_seeds", lambda: [])()
    info["url_seeds"] = url_seeds

    http_seeds = getattr(ti, "http_seeds", lambda: [])()
    info["http_seeds"] = http_seeds

    return info
