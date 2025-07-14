import sys
import os
import platform
import re
import requests
import zipfile
import shutil
from io import BytesIO


def get_os_name_for_asset():
    system = platform.system().lower()
    if system == "darwin":
        return "macos"
    elif system == "linux":
        return "ubuntu"  # per the example, ubuntu used for Linux builds
    elif system == "windows":
        return "windows"  # if they have windows builds, else adapt
    else:
        raise RuntimeError(f"Unsupported OS: {system}")


def get_python_minor_version():
    return sys.version_info.minor


def get_venv_site_packages():
    prefix = sys.prefix  # usually the venv root when running inside venv
    py_version = f"python{sys.version_info.major}.{sys.version_info.minor}"

    # Possible site-packages paths depending on OS
    candidate_paths = [
        os.path.join(prefix, "lib", py_version, "site-packages"),  # Unix/macOS
        os.path.join(prefix, "Lib", "site-packages"),  # Windows
    ]
    for path in candidate_paths:
        if os.path.isdir(path):
            return path

    # fallback to prefix if nothing found
    return prefix


def download_and_extract_zip(url, extract_to):
    print(f"Downloading {url} ...")
    r = requests.get(url)
    r.raise_for_status()
    with zipfile.ZipFile(BytesIO(r.content)) as z:
        print(f"Extracting to {extract_to} ...")
        z.extractall(extract_to)


def copy_folder(src_folder, dst_folder):
    print(f"Copying from {src_folder} to {dst_folder} ...")
    if os.path.exists(dst_folder):
        shutil.rmtree(dst_folder)
    shutil.copytree(src_folder, dst_folder)


def find_libtorrent_folder(root_dir):
    """Recursively search for a folder named 'libtorrent' inside root_dir."""
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if "libtorrent" in dirnames:
            return os.path.join(dirpath, "libtorrent")
    return None


def main():
    os_name = get_os_name_for_asset()
    py_minor = get_python_minor_version()

    # Compose regex pattern to find the exact matching zip file
    pattern = re.compile(
        rf"python-bindings-{os_name}-latest-py3\.{py_minor}-build\.zip"
    )

    print(f"Looking for assets matching OS='{os_name}', Python 3.{py_minor}")

    # GitHub API URL for latest release
    GITHUB_API_RELEASES_URL = (
        "https://api.github.com/repos/baseplate-admin/libtorrent-python/releases/latest"
    )
    resp = requests.get(GITHUB_API_RELEASES_URL)
    resp.raise_for_status()
    release_data = resp.json()

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

    # Create temp extraction folder
    tmp_extract_dir = "tmp_extract"
    if os.path.exists(tmp_extract_dir):
        shutil.rmtree(tmp_extract_dir)
    os.makedirs(tmp_extract_dir)

    # Download and extract
    download_and_extract_zip(download_url, tmp_extract_dir)

    # Copy libtorrent folder to venv site-packages
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
    main()
