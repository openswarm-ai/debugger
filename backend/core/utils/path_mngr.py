import os
from backend.core.DEFAULTS import get_root_dir


def get_abspath(path: str):
    return os.path.join(get_root_dir(), path)


def get_root_rel_path(path: str):
    root = get_root_dir()
    assert path.startswith(root)
    path = path[len(root):]
    while path.startswith(os.sep):
        path = path[1:]
    return path
