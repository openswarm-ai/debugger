import os
from pathlib import Path

DATA_DIR = os.path.join(str(Path.home()), ".swarm-debug")

_DEFAULTS = {
    "debug_toggles.json": "[]",
    "log_mode.txt": "all",
    "needs_resync.txt": "1",
    "root_dir.txt": "",
}


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def get_data_file(name: str) -> str:
    _ensure_data_dir()
    path = os.path.join(DATA_DIR, name)
    if not os.path.exists(path) and name in _DEFAULTS:
        with open(path, "w", encoding="utf-8") as f:
            f.write(_DEFAULTS[name])
    return path


TOGGLE_FILE = get_data_file("debug_toggles.json")
NEEDS_RESYNC_FILE = get_data_file("needs_resync.txt")
LOG_MODE_FILE = get_data_file("log_mode.txt")
ROOT_DIR_FILE = get_data_file("root_dir.txt")
