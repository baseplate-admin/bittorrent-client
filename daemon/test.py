import tempfile

import anyio
import libtorrent as lt

MAGNET_LINK = (
    "magnet:?xt=urn:btih:F9B4F6C8D8E1F8B13BB2468D1945A904285CE3C2&dn=Call+of+Duty..."
)


async def main():
    session = lt.session()
    session.apply_settings({"listen_interfaces": "0.0.0.0:6881", "enable_dht": True})

    with tempfile.TemporaryDirectory() as save_path:
        params = lt.parse_magnet_uri(MAGNET_LINK)
        params.save_path = save_path
        params.storage_mode = lt.storage_mode_t.storage_mode_sparse
        params.flags |= lt.torrent_flags.auto_managed
        handle = session.add_torrent(params)

        print("Waiting for metadata...")
        while not handle.status().has_metadata:
            await anyio.sleep(1)

        print("Metadata fetched!")

        # === Metadata output ===
        info = handle.get_torrent_info()

        print(f"Torrent name: {info.name()}")
        print(f"Total size: {info.total_size() / (1024**3):.2f} GB")
        print(f"Piece size: {info.piece_length() // 1024} KB")
        print(f"Number of pieces: {info.num_pieces()}")
        print(f"Info hash (SHA1): {str(info.info_hash())}")
        print("Files:")
        for f in info.files():
            print(f" - {f.path} ({f.size / (1024**2):.2f} MB)")


if __name__ == "__main__":
    anyio.run(main())
