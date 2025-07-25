import anyio
import anyio.to_thread
import libtorrent as lt


async def serialize_magnet_torrent_info(handle: lt.torrent_handle) -> dict:
    ti = await anyio.to_thread.run_sync(handle.get_torrent_info)
    status = await anyio.to_thread.run_sync(handle.status)

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
        "total_known_peers": len(handle.get_peer_info()),
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

    # nodes = [{"host": host, "port": port} for host, port in ti.nodes()]
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
            "trackers": trackers,
            # "nodes": nodes,
            "url_seeds": getattr(ti, "url_seeds", lambda: [])(),
            "http_seeds": getattr(ti, "http_seeds", lambda: [])(),
        }
    )

    return info
