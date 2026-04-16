import json
import os
import re
import sys
from contextlib import contextmanager
from typing import Optional, Union

from swarm_debug.core.data_dir import get_data_file
from swarm_debug.core.DEFAULTS import (
    DEFAULT_COLOR,
    DEFAULT_EMOJI,
    DEFAULT_SET_MANUALLY,
    DEFAULT_SET_MANUALLY_EMOJI,
    get_root_dir,
    set_root_dir,
)
from swarm_debug.core.models.DebugFile import DebugFile
from swarm_debug.core.models.Directory import Directory
from swarm_debug.core.models.project_scanner import dir_to_output_format, update_debug_toggles


def _toggle_file() -> str:
    return get_data_file("debug_toggles.json", get_root_dir())


def _needs_resync_file() -> str:
    return get_data_file("needs_resync.txt", get_root_dir())


@contextmanager
def _suppress_stdout():
    old = sys.stdout
    sys.stdout = open(os.devnull, "w")
    try:
        yield
    finally:
        sys.stdout.close()
        sys.stdout = old


def load_tree(quiet: bool = False) -> Directory:
    if quiet:
        with _suppress_stdout():
            return update_debug_toggles(save_to_file=False)
    return update_debug_toggles(save_to_file=False)


def save_tree(tree: Directory):
    output = dir_to_output_format(tree)
    with open(_toggle_file(), "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=4)
    with open(_needs_resync_file(), "w") as f:
        f.write("1")


def _normalize_path(path: str) -> str:
    return path.strip("/").strip(os.sep)


def find_node(tree: Directory, target_path: str) -> Optional[Union[DebugFile, Directory]]:
    """Walk the tree and return the node whose .path matches target_path."""
    target = _normalize_path(target_path)

    def _search(node: Directory) -> Optional[Union[DebugFile, Directory]]:
        if _normalize_path(node.path) == target:
            return node
        for child in node.children:
            if isinstance(child, Directory):
                if _normalize_path(child.path) == target:
                    return child
                result = _search(child)
                if result:
                    return result
            elif isinstance(child, DebugFile):
                if _normalize_path(child.path) == target:
                    return child
        return None

    return _search(tree)


def _set_toggle_recursive(node: Union[DebugFile, Directory], state: bool):
    node.is_toggled = state
    node.set_manually = True
    if isinstance(node, Directory):
        for child in node.children:
            _set_toggle_recursive(child, state)


def toggle_node(tree: Directory, target_path: str, state: bool) -> bool:
    """Toggle a specific node. Returns True if the node was found."""
    node = find_node(tree, target_path)
    if node is None:
        return False
    _set_toggle_recursive(node, state)
    return True


def toggle_all(tree: Directory, state: bool):
    _set_toggle_recursive(tree, state)


def set_node_color(tree: Directory, target_path: str, color: str) -> bool:
    if not re.match(r"^#[0-9a-fA-F]{6}$", color):
        print(f"Error: '{color}' is not a valid hex color (expected format: #rrggbb)", file=sys.stderr)
        return False
    node = find_node(tree, target_path)
    if node is None:
        return False
    node.color = color
    node.set_manually = True
    return True


def set_node_emoji(tree: Directory, target_path: str, emoji: str) -> bool:
    node = find_node(tree, target_path)
    if node is None:
        return False
    node.emoji = emoji
    node.set_manually_emoji = True
    return True


def reset_all(tree: Directory):
    tree.reset_colors()
    tree.reset_emojis()


def print_status(tree: Directory, json_mode: bool = False):
    if json_mode:
        output = dir_to_output_format(tree)
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return

    root_dir = get_root_dir()
    print(f"Project root: {root_dir}\n")

    def _print_node(node: Union[DebugFile, Directory], depth: int):
        indent = "  " * depth
        tag = "[ON] " if node.is_toggled else "[OFF]"
        name = os.path.basename(node.path) if node.path else "root"
        is_dir = isinstance(node, Directory)
        suffix = "/" if is_dir else ""
        print(f"{indent}{tag} {name}{suffix}")

        if is_dir:
            for child in node.children:
                _print_node(child, depth + 1)

    _print_node(tree, 0)
