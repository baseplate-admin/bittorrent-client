from seaderr.singletons import SIO, LibtorrentSession
import libtorrent as lt
import tempfile
import os

sio = SIO.get_instance()


@sio.on("add_file")  # type: ignore
async def add_file(sid: str, data: dict):
    """
    Handle the 'add_file' event from the client.

    Args:
        sid (str): The session ID of the client.
        data (dict): The data sent from the client.
    """
    lt_session = await LibtorrentSession.get_session()
    file = data.get("file")
    if not file:
        return {"status": "error", "message": "File not provided"}

    if not isinstance(file, bytes):
        return {"status": "error", "message": "File must be a byte string"}

    with tempfile.NamedTemporaryFile(delete=False, suffix=".bin") as tmp_file:
        tmp_file.write(file)
        tmp_path = tmp_file.name

    try:
        fs = lt.file_storage()
        lt.add_files(fs, tmp_path)  # Add the single file to the file storage

        tpc = lt.create_torrent(fs)
        tpc.set_creator("SocketIO uploader")
        lt.set_piece_hashes(tpc, os.path.dirname(tmp_path))
        torrent = tpc.generate()

        # Save .torrent file if you want
        torrent_path = tmp_path + ".torrent"
        with open(torrent_path, "wb") as f:
            f.write(lt.bencode(torrent))

        # Add torrent to session
        params = {
            "ti": lt.torrent_info(torrent),
            "save_path": os.path.dirname(tmp_path),  # Where files are stored
            "storage_mode": lt.storage_mode_t.storage_mode_sparse,
        }
        handle = lt_session.add_torrent(params)
        print(f"[✓] Added to libtorrent: {handle.name()}")

        await sio.emit("upload_complete", {"torrent_name": handle.name()}, to=sid)

    except Exception as e:
        print("[-] Failed to add to libtorrent:", e)
        await sio.emit("upload_error", {"error": str(e)}, to=sid)
