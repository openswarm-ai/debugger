import os
from swarm_debug.core.data_dir import LOG_MODE_FILE


def set_log_mode(mode):
    with open(LOG_MODE_FILE, 'w') as f:
        f.write(mode)

def get_log_mode():
    if os.path.exists(LOG_MODE_FILE):
        with open(LOG_MODE_FILE, 'r') as f:
            return f.read().strip()
    return 'all'  # Default to 'all' if the file doesn't exist
