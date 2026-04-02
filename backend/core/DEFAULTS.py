import os
from backend.core.data_dir import TOGGLE_FILE, ROOT_DIR_FILE

DEFAULT_COLOR = '#ffffff'
DEFAULT_TOGGLED = False
DEFAULT_SET_MANUALLY = False
DEFAULT_SET_MANUALLY_EMOJI = False
DEFAULT_EMOJI = '⚫'


def get_root_dir() -> str:
    """Priority: env var > persisted file > cwd."""
    env = os.environ.get("SWARM_DEBUG_ROOT")
    if env:
        return os.path.abspath(env)

    if os.path.exists(ROOT_DIR_FILE):
        with open(ROOT_DIR_FILE, "r") as f:
            saved = f.read().strip()
        if saved:
            return saved

    return os.getcwd()


def set_root_dir(path: str):
    path = os.path.abspath(path)
    with open(ROOT_DIR_FILE, "w") as f:
        f.write(path)