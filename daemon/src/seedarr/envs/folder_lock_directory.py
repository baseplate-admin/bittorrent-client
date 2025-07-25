import os

from platformdirs import user_data_dir

FOLDER_LOCK_DIRECTORY = os.environ.get("FOLDER_LOCK_DIRECTORY", user_data_dir("seedarr"))
