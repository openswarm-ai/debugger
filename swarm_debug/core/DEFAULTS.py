import os
from swarm_debug.core.data_dir import get_data_file

DEFAULT_COLOR = '#ffffff'
DEFAULT_TOGGLED = False
DEFAULT_SET_MANUALLY = False
DEFAULT_SET_MANUALLY_EMOJI = False
DEFAULT_EMOJI = '\u26ab'


def get_root_dir() -> str:
    """Priority: env var > cwd."""
    env = os.environ.get("SWARM_DEBUG_ROOT")
    if env:
        return os.path.abspath(env)

    return os.getcwd()


def set_root_dir(path: str):
    """Persist the root inside the target project's data dir (for GUI use)."""
    path = os.path.abspath(path)
    root_file = get_data_file("root_dir.txt", path)
    with open(root_file, "w") as f:
        f.write(path)
