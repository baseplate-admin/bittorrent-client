import libtorrent as lt


async def is_valid_magnet(magnet_uri: str) -> bool:
    try:
        params = lt.parse_magnet_uri(magnet_uri)
        return params.info_hash != lt.sha1_hash()
    except Exception:
        return False
