import libtorrent as lt
from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


@sio.on("libtorrent:get_all")  # type: ignore
async def get_all(sid: str):
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    all_torrents = []

    for handle in handles:
        if not handle.is_valid():
            continue

        status = handle.status()
        seeders = 0
        try:
            peers_info = handle.get_peer_info()
            peers = []
            for p in peers_info:
                is_seed = bool(p.flags & lt.peer_info.seed)
                if is_seed:
                    seeders += 1
                peers.append(
                    {
                        "ip": str(p.ip),
                        "client": p.client,
                        "flags": str(p.flags),
                        "progress": round(p.progress * 100, 2),
                        "download_rate": p.down_speed,
                        "upload_rate": p.up_speed,
                        "is_seed": is_seed,
                    }
                )
        except Exception:
            peers = []
            seeders = 0

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
            "seeders": seeders,
            "peers": peers,
        }

        all_torrents.append(torrent_info)

    return {"status": "success", "torrents": all_torrents}
