from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


@sio.on("get_specific")  # type: ignore
async def get_specific(sid: str, data: dict):
    info_hash = data.get("info_hash")
    if not info_hash:
        return {"status": "error", "message": "info_hash is required"}

    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    for handle in handles:
        if not handle.is_valid():
            continue
            
        if str(handle.info_hash()) == info_hash:
            status = handle.status()
            try:
                peers_info = handle.get_peer_info()
                peers = [
                    {
                        "ip": str(p.ip),
                        "client": p.client,
                        "flags": str(p.flags),
                        "progress": round(p.progress * 100, 2),
                        "download_speed": p.down_speed,
                        "upload_speed": p.up_speed,
                    }
                    for p in peers_info
                ]
            except Exception:
                peers = []

            torrent_info = {
                "name": status.name,
                "info_hash": str(handle.info_hash()),
                "progress": round(status.progress * 100, 2),
                "state": str(status.state).split(".")[-1],
                "paused": handle.is_paused(),
                "total_download": status.total_done,
                "total_size": status.total_wanted,
                "download_rate": status.download_rate,
                "upload_rate": status.upload_rate,
                "num_peers": status.num_peers,
                "peers": peers,
            }
            return {"status": "success", "torrent": torrent_info}

    return {"status": "error", "message": "torrent not found"}
