# Haik: sorry bout the filename

import os
import threading
import time

from rich.console import Console
from rich.panel import Panel

from swarm_debug.core.DEFAULTS import DEFAULT_COLOR, DEFAULT_TOGGLED, DEFAULT_EMOJI, get_root_dir
from swarm_debug.core.data_dir import get_data_file
from swarm_debug.core.models.DebugFile import DebugFile
from swarm_debug.core.models.Directory import Directory
from swarm_debug.core.models.project_scanner import update_debug_toggles

_console = Console(color_system="truecolor")
_err_console = Console(stderr=True)


class Debugleton:
    _instance = None
    _lock = threading.Lock()
    sync_lock: threading.Lock

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(Debugleton, cls).__new__(cls)
                    cls._instance.dir = None
                    cls._instance.sync_lock = threading.Lock()
                    cls._instance.sync_lock.acquire(blocking=False)

                    with _console.status("[bold green]Debugleton: scanning project...", spinner="dots"):
                        cls._instance.sync_to_saved(is_first_sync=True)

                    cls._instance.sync_lock.release()
                    _console.print(Panel(
                        "[bold green]Debugleton initialized[/bold green]",
                        border_style="green",
                        expand=False,
                    ))
        return cls._instance

    def _needs_resync_file(self):
        return get_data_file("needs_resync.txt", get_root_dir())

    def sync_to_saved(self, is_first_sync=False):
        if not is_first_sync:
            self.sync_lock.acquire()
        self.dir = update_debug_toggles(save_to_file=False)
        self.abspaths, self.instances = self.dir.get_ordered_abspaths_and_instances()
        with open(self._needs_resync_file(), 'w') as f:
            f.write('0')
        if not is_first_sync:
            self.sync_lock.release()

    def needs_resync(self):
        num_tries = 0
        while self.is_syncing():
            _console.print(f"[dim]Waiting for Debugleton to sync... ({num_tries})[/dim]")
            time.sleep(5)
            num_tries += 1
            if num_tries > 10:
                _err_console.print(Panel(
                    "[bold yellow]Debugleton is taking a long time.[/bold yellow]\n\n"
                    "If running in Docker and you deleted one of the root dirs in the volumes "
                    "of docker-compose, the debugger will not be able to find the project and "
                    "will get stuck in an infinite loop.\n\n"
                    "Restart the Docker container and remove the volume to resync.",
                    title="Warning",
                    border_style="yellow",
                ))
        with open(self._needs_resync_file(), 'r') as f:
            does_need_resync = f.read().strip() == '1'
        return does_need_resync

    def is_syncing(self):
        return self.sync_lock.locked()

    def find_file_info(self, filepath: str):
        filepath = filepath.lower()
        if self.needs_resync():
            self.sync_to_saved()
        try:
            filepath_id = self.abspaths.index(filepath)
            match = self.instances[filepath_id]
            return match.color, match.is_toggled, match.emoji
        except ValueError:
            _err_console.print(f"[yellow]Filepath not found: {filepath}[/yellow]")
            return DEFAULT_COLOR, DEFAULT_TOGGLED, DEFAULT_EMOJI
