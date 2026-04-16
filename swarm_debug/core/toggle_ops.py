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
from swarm_debug.core.models.Directory import Directory, lighten_color
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


def _set_color_recursive(node: Union[DebugFile, Directory], color: str):
    """Propagate a lightened color to children, skipping ``set_manually_color`` nodes.

    Mirrors the frontend's ``updateNodeColor`` propagation in treeUtils.ts.
    Only the original target should have its ``set_manually_color`` set to True
    by the caller; children are left untouched so future parent propagations
    can still reach them.
    """
    if isinstance(node, Directory):
        lightened = lighten_color(color)
        for child in node.children:
            if child.set_manually_color:
                continue
            child.color = lightened
            _set_color_recursive(child, lightened)


def _set_emoji_recursive(node: Union[DebugFile, Directory], emoji: str):
    """Propagate an emoji to children, skipping ``set_manually_emoji`` nodes.

    Mirrors the frontend's ``propagateEmoji`` in treeUtils.ts.  Only the
    original target should have ``set_manually_emoji`` set to True by the
    caller.
    """
    if isinstance(node, Directory):
        for child in node.children:
            if child.set_manually_emoji:
                continue
            child.emoji = emoji
            _set_emoji_recursive(child, emoji)


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
        from rich.console import Console
        Console(stderr=True).print(f"[red]Error:[/red] '{color}' is not a valid hex color (expected format: #rrggbb)")
        return False
    node = find_node(tree, target_path)
    if node is None:
        return False
    node.color = color
    node.set_manually_color = True
    _set_color_recursive(node, color)
    return True


def set_node_emoji(tree: Directory, target_path: str, emoji: str) -> bool:
    node = find_node(tree, target_path)
    if node is None:
        return False
    node.emoji = emoji
    node.set_manually_emoji = True
    _set_emoji_recursive(node, emoji)
    return True


def reset_all(tree: Directory):
    tree.reset_colors()
    tree.reset_emojis()


def print_status(tree: Directory, json_mode: bool = False):
    if json_mode:
        output = dir_to_output_format(tree)
        print(json.dumps(output, ensure_ascii=False, indent=2))
        return

    from rich.console import Console
    from rich.text import Text
    from rich.tree import Tree as RichTree

    console = Console()
    root_dir = get_root_dir()

    def _node_label(node: Union[DebugFile, Directory]) -> Text:
        name = os.path.basename(node.path) if node.path else "root"
        is_dir = isinstance(node, Directory)
        if is_dir:
            name += "/"

        badge = Text(" ON ", style="bold white on green") if node.is_toggled else Text(" OFF ", style="bold white on red")
        label = Text(f"{node.emoji} ", style=node.color)
        label.append(name, style=f"bold {node.color}")
        label.append(" ")
        label.append(badge)
        return label

    def _build_tree(node: Union[DebugFile, Directory], parent: RichTree):
        if isinstance(node, Directory):
            for child in node.children:
                branch = parent.add(_node_label(child))
                if isinstance(child, Directory):
                    _build_tree(child, branch)

    rich_tree = RichTree(_node_label(tree), guide_style="dim")
    _build_tree(tree, rich_tree)

    console.print(f"\nProject root: [bold]{root_dir}[/bold]\n")
    console.print(rich_tree)
