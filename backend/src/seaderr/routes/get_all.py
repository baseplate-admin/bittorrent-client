from seaderr.singletons import SIO, LibtorrentSession

sio = SIO.get_instance()


@sio.on("get_all")  # type: ignore
async def get_all(sid: str):
    """
    Handle the 'get_all' event from the client.

    Args:
        sid (str): The session ID of the client.

    Returns:
        dict: Torrent info for all torrents in the session.
    """
    ses = await LibtorrentSession.get_session()
    handles = ses.get_torrents()

    all_torrents = []

    for handle in handles:
        if not handle.is_valid():
            continue

        status = handle.status()
        torrent_info = {
            "name": status.name,
            "info_hash": str(handle.info_hash()),
            "progress": round(status.progress * 100, 2),
            "state": str(status.state).split(".")[-1],  # enum to string
            "paused": handle.is_paused(),
            "total_download": status.total_done,
            "total_size": status.total_wanted,
            "download_rate": status.download_rate,
            "upload_rate": status.upload_rate,
            "num_peers": status.num_peers,
        }

        all_torrents.append(torrent_info)

    return {"status": "success", "torrents": all_torrents}
