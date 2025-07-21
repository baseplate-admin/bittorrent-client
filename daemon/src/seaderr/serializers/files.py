import os

import anyio
import anyio.to_thread
import libtorrent as lt


async def serialize_file_info(handle: lt.torrent_handle) -> list[dict]:
    fs = handle.get_torrent_info().files()
    num_files = fs.num_files()

    try:
        file_progress = await anyio.to_thread.run_sync(handle.file_progress)
    except Exception:
        file_progress = [0] * num_files

    try:
        file_priorities = await anyio.to_thread.run_sync(handle.file_priorities)
    except Exception:
        file_priorities = [0] * num_files

    results = []
    lock = anyio.Lock()

    async with anyio.create_task_group() as tg:

        async def run_and_store(idx: int):
            def extract():
                full_path = fs.file_path(idx)
                size = fs.file_size(idx)
                progress = file_progress[idx]
                remaining = size - progress

                return {
                    "index": idx,
                    "path": str(full_path),
                    "name": os.path.basename(full_path),
                    "size": int(size),
                    "offset": int(fs.file_offset(idx)),
                    "progress": int(progress),
                    "remaining": int(remaining),
                    "priority": int(file_priorities[idx]),
                }

            res = await anyio.to_thread.run_sync(extract)
            async with lock:
                results.append(res)

        for idx in range(num_files):
            tg.start_soon(run_and_store, idx)

    return results
