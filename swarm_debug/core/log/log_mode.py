import os
from swarm_debug.core.data_dir import get_data_file
from swarm_debug.core.DEFAULTS import get_root_dir


def _log_mode_file():
    return get_data_file("log_mode.txt", get_root_dir())


def set_log_mode(mode):
    with open(_log_mode_file(), 'w') as f:
        f.write(mode)

def get_log_mode():
    path = _log_mode_file()
    if os.path.exists(path):
        with open(path, 'r') as f:
            return f.read().strip()
    return 'all'
