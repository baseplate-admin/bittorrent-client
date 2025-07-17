import asyncio
import os
import platform
import re
import shutil
import sys
import zipfile
from io import BytesIO

import aiohttp


def get_os_name_for_asset():
    system = platform.system().lower()
    if system == "darwin":
        return "macos"
    elif system == "linux":
        return "ubuntu"  # per example, Linux builds use ubuntu naming
    elif system == "windows":
        return "windows"
    else:
        raise RuntimeError(f"Unsupported OS: {system}")


def get_python_minor_version():
    return sys.version_info.minor


def get_venv_site_packages():
    prefix = sys.prefix  # venv root when inside venv
    py_version = f"python{sys.version_info.major}.{sys.version_info.minor}"

    candidate_paths = [
        os.path.join(prefix, "lib", py_version, "site-packages"),  # Unix/macOS
        os.path.join(prefix, "Lib", "site-packages"),  # Windows
    ]
    for path in candidate_paths:
        if os.path.isdir(path):
            return path
    return prefix


def find_libtorrent_folder(root_dir):
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if "libtorrent" in dirnames:
            return os.path.join(dirpath, "libtorrent")
    return None


def copy_folder(src_folder, dst_folder):
    print(f"Copying from {src_folder} to {dst_folder} ...")
    if os.path.exists(dst_folder):
        shutil.rmtree(dst_folder)
    shutil.copytree(src_folder, dst_folder)


async def fetch_json(session, url):
    async with session.get(url) as resp:
        resp.raise_for_status()
        return await resp.json()


async def download_file(session, url):
    print(f"Downloading {url} ...")
    async with session.get(url) as resp:
        resp.raise_for_status()
        data = await resp.read()
        return data


async def main():
    os_name = get_os_name_for_asset()
    py_minor = get_python_minor_version()
    pattern = re.compile(
        rf"python-bindings-{os_name}-latest-py3\.{py_minor}-build\.zip"
    )
    print(f"Looking for assets matching OS='{os_name}', Python 3.{py_minor}")

    GITHUB_API_RELEASES_URL = (
        "https://api.github.com/repos/baseplate-admin/libtorrent-python/releases/latest"
    )

    async with aiohttp.ClientSession() as session:
        release_data = await fetch_json(session, GITHUB_API_RELEASES_URL)

        assets = release_data.get("assets", [])
        matching_asset = None

        for asset in assets:
            name = asset.get("name", "")
            if pattern.fullmatch(name):
                matching_asset = asset
                break

        if not matching_asset:
            print("No matching asset found for pattern:", pattern.pattern)
            return

        print(f"Found asset: {matching_asset['name']}")
        download_url = matching_asset["browser_download_url"]

        # Download zip file bytes
        zip_bytes = await download_file(session, download_url)

    # Extract zip synchronously
    tmp_extract_dir = "tmp_extract"
    if os.path.exists(tmp_extract_dir):
        shutil.rmtree(tmp_extract_dir)
    os.makedirs(tmp_extract_dir)

    with zipfile.ZipFile(BytesIO(zip_bytes)) as z:
        print(f"Extracting to {tmp_extract_dir} ...")
        z.extractall(tmp_extract_dir)

    # Find nested libtorrent folder and copy it
    libtorrent_src = find_libtorrent_folder(tmp_extract_dir)
    if not libtorrent_src:
        print("Error: 'libtorrent' folder not found in extracted content.")
        return

    site_packages_path = get_venv_site_packages()
    print("Detected site-packages folder:", site_packages_path)

    dst = os.path.join(site_packages_path, "libtorrent")
    copy_folder(libtorrent_src, dst)

    # Cleanup temp folder
    shutil.rmtree(tmp_extract_dir)

    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
