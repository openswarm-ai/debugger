import hashlib
import os
from pathlib import Path

GLOBAL_DATA_DIR = os.path.join(str(Path.home()), ".swarm-debug")

_DEFAULTS = {
    "debug_toggles.json": "[]",
    "log_mode.txt": "all",
    "needs_resync.txt": "1",
}


def _project_key(root: str) -> str:
    return hashlib.sha256(os.path.abspath(root).encode()).hexdigest()[:16]


def get_project_data_dir(root: str) -> str:
    key = _project_key(root)
    d = os.path.join(GLOBAL_DATA_DIR, "projects", key)
    os.makedirs(d, exist_ok=True)
    return d


def get_data_file(name: str, root: str) -> str:
    d = get_project_data_dir(root)
    path = os.path.join(d, name)
    if not os.path.exists(path) and name in _DEFAULTS:
        with open(path, "w", encoding="utf-8") as f:
            f.write(_DEFAULTS[name])
    return path
