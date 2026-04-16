import argparse
import filecmp
import os
import shutil
import sys
from importlib.metadata import version
from pathlib import Path


DEFAULT_PORT = 6969
_SKILL_SRC = Path(__file__).resolve().parent / "data" / "SKILL.md"
_SKILL_DST_DIR = Path.home() / ".cursor" / "skills" / "swarm-debug"
_SKILL_DST = _SKILL_DST_DIR / "SKILL.md"


def _cmd_gui(args):
    from swarm_debug.server import start_server
    start_server(port=args.port, open_browser=True)


def _cmd_status(args):
    from swarm_debug.core.toggle_ops import load_tree, print_status
    tree = load_tree(quiet=args.json)
    print_status(tree, json_mode=args.json)


def _cmd_toggle(args):
    from swarm_debug.core.toggle_ops import load_tree, save_tree, toggle_all, toggle_node

    tree = load_tree()

    if args.all:
        toggle_all(tree, args.state == "on")
        save_tree(tree)
        state_label = "ON" if args.state == "on" else "OFF"
        print(f"Toggled all files {state_label}")
        return

    if not args.path:
        print("Error: a path is required (or use --all)", file=sys.stderr)
        sys.exit(1)

    state = args.state == "on"
    if toggle_node(tree, args.path, state):
        save_tree(tree)
        state_label = "ON" if state else "OFF"
        print(f"Toggled '{args.path}' {state_label}")
    else:
        print(f"Error: path '{args.path}' not found in the debug tree", file=sys.stderr)
        sys.exit(1)


def _cmd_set_root(args):
    from swarm_debug.core.DEFAULTS import set_root_dir
    from swarm_debug.core.data_dir import NEEDS_RESYNC_FILE

    path = os.path.abspath(args.path)
    if not os.path.isdir(path):
        print(f"Error: '{path}' is not a valid directory", file=sys.stderr)
        sys.exit(1)

    set_root_dir(path)
    with open(NEEDS_RESYNC_FILE, "w") as f:
        f.write("1")
    print(f"Project root set to: {path}")


def _cmd_set_color(args):
    from swarm_debug.core.toggle_ops import load_tree, save_tree, set_node_color

    tree = load_tree()
    if set_node_color(tree, args.path, args.color):
        save_tree(tree)
        print(f"Set color of '{args.path}' to {args.color}")
    else:
        if not args.color.startswith("#") or len(args.color) != 7:
            pass  # error already printed by set_node_color
        else:
            print(f"Error: path '{args.path}' not found in the debug tree", file=sys.stderr)
        sys.exit(1)


def _cmd_set_emoji(args):
    from swarm_debug.core.toggle_ops import load_tree, save_tree, set_node_emoji

    tree = load_tree()
    if set_node_emoji(tree, args.path, args.emoji):
        save_tree(tree)
        print(f"Set emoji of '{args.path}' to {args.emoji}")
    else:
        print(f"Error: path '{args.path}' not found in the debug tree", file=sys.stderr)
        sys.exit(1)


def _cmd_reset(args):
    from swarm_debug.core.toggle_ops import load_tree, reset_all, save_tree

    tree = load_tree()
    reset_all(tree)
    save_tree(tree)
    print("Reset all colors and emojis to defaults")


def _install_cursor_skill():
    if not _SKILL_SRC.exists():
        print("Error: bundled SKILL.md not found in package data", file=sys.stderr)
        sys.exit(1)

    if _SKILL_DST.exists():
        if filecmp.cmp(_SKILL_SRC, _SKILL_DST, shallow=False):
            print(f"Cursor skill is already up to date: {_SKILL_DST}")
            return
        shutil.copy2(_SKILL_SRC, _SKILL_DST)
        print(f"Cursor skill updated: {_SKILL_DST}")
    else:
        _SKILL_DST_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(_SKILL_SRC, _SKILL_DST)
        print(f"Cursor skill installed: {_SKILL_DST}")

    print("Tip: this will be kept in sync automatically whenever you use any swarm-debug command.")


def _uninstall_cursor_skill():
    if not _SKILL_DST_DIR.exists():
        print("Cursor skill is not installed, nothing to remove.")
        return

    shutil.rmtree(_SKILL_DST_DIR)
    print(f"Cursor skill removed: {_SKILL_DST_DIR}")


def _check_skill_staleness():
    """Warn if the installed Cursor skill is outdated compared to the bundled one."""
    if _SKILL_DST.exists() and _SKILL_SRC.exists():
        if not filecmp.cmp(_SKILL_SRC, _SKILL_DST, shallow=False):
            print(
                "Notice: your Cursor skill is out of date. "
                "Run: swarm-debug --install-cursor-skill",
                file=sys.stderr,
            )


def main():
    pkg_version = version("swarm-debug")

    parser = argparse.ArgumentParser(
        prog="swarm-debug",
        description="A colorized, toggleable debug logger with a web GUI and CLI.",
    )
    parser.add_argument(
        "--version", action="version", version=f"swarm-debug {pkg_version}"
    )
    parser.add_argument(
        "--install-cursor-skill", action="store_true",
        help="Install the swarm-debug Cursor AI skill to ~/.cursor/skills/",
    )
    parser.add_argument(
        "--uninstall-cursor-skill", action="store_true",
        help="Remove the swarm-debug Cursor AI skill from ~/.cursor/skills/",
    )
    subparsers = parser.add_subparsers(dest="command")

    # --- gui ---
    gui_parser = subparsers.add_parser("gui", help="Launch the debug configuration GUI")
    gui_parser.add_argument(
        "--port", "-p", type=int, default=DEFAULT_PORT,
        help=f"Port for the GUI server (default: {DEFAULT_PORT})",
    )
    gui_parser.set_defaults(func=_cmd_gui)

    # --- status ---
    status_parser = subparsers.add_parser("status", help="Show the debug toggle tree")
    status_parser.add_argument(
        "--json", action="store_true", help="Output as JSON"
    )
    status_parser.set_defaults(func=_cmd_status)

    # --- toggle ---
    toggle_parser = subparsers.add_parser(
        "toggle", help="Toggle debug output for a file or directory"
    )
    toggle_parser.add_argument("state", choices=["on", "off"], help="Desired state")
    toggle_parser.add_argument("path", nargs="?", default=None, help="Relative path (e.g. src/utils/helpers.py)")
    toggle_parser.add_argument(
        "--all", action="store_true", help="Toggle all files"
    )
    toggle_parser.set_defaults(func=_cmd_toggle)

    # --- set-root ---
    root_parser = subparsers.add_parser("set-root", help="Set the project root directory")
    root_parser.add_argument("path", help="Absolute or relative path to the project root")
    root_parser.set_defaults(func=_cmd_set_root)

    # --- set-color ---
    color_parser = subparsers.add_parser("set-color", help="Set a node's debug output color")
    color_parser.add_argument("path", help="Relative path to the file or directory")
    color_parser.add_argument("color", help="Hex color (e.g. #ff0000)")
    color_parser.set_defaults(func=_cmd_set_color)

    # --- set-emoji ---
    emoji_parser = subparsers.add_parser("set-emoji", help="Set a node's debug output emoji")
    emoji_parser.add_argument("path", help="Relative path to the file or directory")
    emoji_parser.add_argument("emoji", help="Emoji character")
    emoji_parser.set_defaults(func=_cmd_set_emoji)

    # --- reset ---
    reset_parser = subparsers.add_parser("reset", help="Reset all colors and emojis to defaults")
    reset_parser.set_defaults(func=_cmd_reset)

    args = parser.parse_args()

    if args.install_cursor_skill:
        _install_cursor_skill()
        return

    if args.uninstall_cursor_skill:
        _uninstall_cursor_skill()
        return

    _check_skill_staleness()

    if args.command is None:
        parser.print_help()
        sys.exit(0)

    args.func(args)
