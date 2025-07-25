import os
from pathlib import Path
from typing import Dict

import anyio
import anyio.to_thread
from filelock import BaseFileLock, FileLock

from seedarr.envs import FOLDER_LOCK_DIRECTORY


class FolderLock:
    _instance = None
    _lock = anyio.Lock()

    def __init__(self):
        self._locks: Dict[str, BaseFileLock] = {}
        self._locks_dir = os.path.join(FOLDER_LOCK_DIRECTORY, "locks")
        os.makedirs(self._locks_dir, exist_ok=True)

    @classmethod
    def get_instance(cls) -> "FolderLock":
        if cls._instance is None:
            # It's safe to call __init__ without lock in a single-threaded async context
            cls._instance = cls()
        return cls._instance

    def _get_lock_file_path(self, folder_path: str) -> str:
        safe_name = folder_path.replace(os.sep, "_").replace(":", "")
        return os.path.join(self._locks_dir, f"{safe_name}.lock")

    async def add_folder(self, folder_path: str):
        folder_path = str(Path(folder_path).resolve())

        if folder_path in self._locks:
            raise ValueError(f"Folder already locked: {folder_path}")

        lock_file = self._get_lock_file_path(folder_path)
        file_lock = FileLock(lock_file)

        try:
            await anyio.to_thread.run_sync(lambda: file_lock.acquire(timeout=0.1))
        except TimeoutError:
            raise RuntimeError(f"Folder is already locked elsewhere: {folder_path}")

        self._locks[folder_path] = file_lock
        print(f"[Locked] {folder_path}")

    async def remove_folder(self, folder_path: str):
        folder_path = str(Path(folder_path).resolve())

        if folder_path not in self._locks:
            raise ValueError(f"Folder not managed: {folder_path}")

        lock = self._locks.pop(folder_path)
        await anyio.to_thread.run_sync(lock.release)
        print(f"[Unlocked] {folder_path}")

    def is_locked(self, folder_path: str) -> bool:
        folder_path = str(Path(folder_path).resolve())
        return folder_path in self._locks

    @classmethod
    async def clear_all(cls):
        instance = cls.get_instance()
        for folder_path, lock in list(instance._locks.items()):
            await anyio.to_thread.run_sync(lock.release)
            print(f"[Unlocked] {folder_path}")
        instance._locks.clear()
