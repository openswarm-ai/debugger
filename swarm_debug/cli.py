import enum
import filecmp
import json
import os
import shutil
import urllib.request
from importlib.metadata import version as pkg_version
from pathlib import Path
from typing import Optional

import click
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.traceback import install as install_rich_traceback

install_rich_traceback(show_locals=True)

app = typer.Typer(
    name="swarm-debug",
    help="A colorized, toggleable debug logger with a web GUI and CLI.",
    no_args_is_help=True,
)

_console = Console(color_system="truecolor")
_err_console = Console(stderr=True, color_system="truecolor")

DEFAULT_PORT = 6969

_SKILL_SRC = Path(__file__).resolve().parent / "data" / "SKILL.md"


class State(str, enum.Enum):
    on = "on"
    off = "off"


def _skill_dst_dir() -> Path:
    from swarm_debug.core.DEFAULTS import get_root_dir
    return Path(get_root_dir()) / ".cursor" / "skills" / "swarm-debug"


def _skill_dst() -> Path:
    return _skill_dst_dir() / "SKILL.md"


def _check_skill_staleness():
    dst = _skill_dst()
    if dst.exists() and _SKILL_SRC.exists():
        if not filecmp.cmp(_SKILL_SRC, dst, shallow=False):
            _err_console.print(Panel(
                "[bold]Your Cursor skill is out of date.[/bold]\n"
                "Run: [cyan]swarm-debug install-cursor-skill[/cyan]",
                title="Skill Outdated",
                border_style="red",
            ))


def _check_package_staleness(current_version: str):
    from packaging.version import Version, InvalidVersion

    try:
        url = "https://pypi.org/pypi/swarm-debug/json"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read())
        latest = data["info"]["version"]
        if Version(latest) > Version(current_version):
            _err_console.print(Panel(
                f"[bold]A newer swarm-debug is available: [green]{latest}[/green][/bold]\n"
                f"You are running: [red]{current_version}[/red]\n"
                "Run: [cyan]pip install --upgrade swarm-debug[/cyan]",
                title="Update Available",
                border_style="yellow",
            ))
    except (urllib.error.URLError, TimeoutError, KeyError,
            json.JSONDecodeError, InvalidVersion, OSError):
        pass


def _check_all_staleness(current_version: str):
    _check_skill_staleness()
    _check_package_staleness(current_version)


def _get_version() -> str:
    try:
        return pkg_version("swarm-debug")
    except Exception:
        return "0.0.0-dev"


def _version_callback(value: bool):
    if value:
        ver = _get_version()
        _check_all_staleness(ver)
        _console.print(f"swarm-debug {ver}")
        raise typer.Exit()


def _help_all_callback(ctx: typer.Context, value: bool):
    if not value:
        return

    click_group = ctx.command
    ver = _get_version()

    _console.print()
    _console.print(Panel(
        f"[bold cyan]swarm-debug[/bold cyan] [dim]{ver}[/dim] — Full Command Reference",
        border_style="bright_cyan",
    ))

    for cmd_name in click_group.list_commands(ctx):
        cmd = click_group.get_command(ctx, cmd_name)
        desc = cmd.help or ""

        header = Text()
        header.append(f"  {cmd_name}", style="bold cyan")
        header.append(f"  {desc}", style="dim")
        _console.print(header)

        args = [p for p in cmd.params if isinstance(p, click.Argument)]
        opts = [p for p in cmd.params if isinstance(p, click.Option) and p.name != "help"]

        if args:
            for a in args:
                type_name = a.type.name.upper() if hasattr(a.type, "name") else "VALUE"
                required = " [dim](required)[/dim]" if a.required else " [dim](optional)[/dim]"
                help_text = getattr(a, "help", None) or ""
                _console.print(
                    f"        [green]{a.name.upper():<16}[/green]"
                    f"[yellow]{type_name:<10}[/yellow]"
                    f"{help_text}{required}"
                )

        if opts:
            for o in opts:
                flag_str = " / ".join(o.opts)
                default = f" [dim]\\[default: {o.default}][/dim]" if o.default is not None and o.default is not False else ""
                help_text = o.help or ""
                _console.print(
                    f"        [green]{flag_str:<16}[/green]"
                    f"{help_text}{default}"
                )

        if not args and not opts:
            _console.print("        [dim](no arguments or options)[/dim]")

        _console.print()

    api_table = Table(
        title="API-Only Endpoints (no CLI equivalent)",
        show_header=True,
        border_style="bright_cyan",
        title_style="bold",
    )
    api_table.add_column("Method", style="bold yellow", width=8)
    api_table.add_column("Endpoint", style="cyan")
    api_table.add_column("Description")
    api_table.add_row("POST", "/api/debugger/reset_color", "Reset all colors to defaults (individually, without resetting emojis)")
    api_table.add_row("POST", "/api/debugger/reset_emoji", "Reset all emojis to defaults (individually, without resetting colors)")
    api_table.add_row("GET", "/api/debugger/pull_structure", "Fetch the full debug tree as JSON")
    api_table.add_row("POST", "/api/debugger/push_structure", "Push a modified debug tree")
    api_table.add_row("GET", "/api/debugger/events", "SSE stream — emits events when toggles change on disk")
    _console.print(api_table)

    _console.print()
    _console.print("[dim]Access these via the GUI ([cyan]swarm-debug gui[/cyan]) or directly at [cyan]http://localhost:6969/docs[/cyan][/dim]")
    _console.print()

    raise typer.Exit()


_SKIP_STALENESS_COMMANDS = {"install-cursor-skill", "uninstall-cursor-skill"}


@app.callback(invoke_without_command=True)
def _callback(
    ctx: typer.Context,
    version: bool = typer.Option(
        False, "--version", "-V", callback=_version_callback, is_eager=True,
        help="Show version and exit.",
    ),
    help_all: bool = typer.Option(
        False, "--help-all", "-H", callback=_help_all_callback, is_eager=True,
        help="Show detailed help for all commands.",
    ),
):
    if ctx.invoked_subcommand not in _SKIP_STALENESS_COMMANDS:
        _check_all_staleness(_get_version())


@app.command()
def gui(
    port: int = typer.Option(DEFAULT_PORT, "--port", "-p",
                             help=f"Port for the GUI server (default: {DEFAULT_PORT})"),
    verbose: bool = typer.Option(False, "--verbose", "-v",
                                 help="Show all server logs in the terminal."),
):
    """Launch the debug configuration GUI."""
    import os
    os.environ["SWARM_DEBUG_VERBOSE"] = "1" if verbose else "0"
    from swarm_debug.server import start_server
    start_server(port=port, open_browser=True, verbose=verbose)


@app.command()
def status(
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    """Show the debug toggle tree."""
    from swarm_debug.core.toggle_ops import load_tree, print_status
    tree = load_tree(quiet=json_output)
    print_status(tree, json_mode=json_output)


@app.command()
def toggle(
    state: State = typer.Argument(..., help="Desired state"),
    path: Optional[str] = typer.Argument(None, help="Relative path (e.g. src/utils/helpers.py)"),
    all_files: bool = typer.Option(False, "--all", help="Toggle all files"),
):
    """Toggle debug output for a file or directory."""
    from swarm_debug.core.toggle_ops import load_tree, save_tree, toggle_all, toggle_node

    tree = load_tree()

    if all_files:
        toggle_all(tree, state == State.on)
        save_tree(tree)
        label = "[green]ON[/green]" if state == State.on else "[red]OFF[/red]"
        _console.print(f"Toggled all files {label}")
        return

    if not path:
        _err_console.print("[red]Error:[/red] a path is required (or use --all)")
        raise typer.Exit(code=1)

    on = state == State.on
    if toggle_node(tree, path, on):
        save_tree(tree)
        label = "[green]ON[/green]" if on else "[red]OFF[/red]"
        _console.print(f"Toggled [bold]'{path}'[/bold] {label}")
    else:
        _err_console.print(f"[red]Error:[/red] path '{path}' not found in the debug tree")
        raise typer.Exit(code=1)


@app.command("set-root")
def set_root(
    path: str = typer.Argument(..., help="Absolute or relative path to the project root"),
):
    """Set the project root directory."""
    from swarm_debug.core.DEFAULTS import set_root_dir
    from swarm_debug.core.data_dir import get_data_file

    abs_path = os.path.abspath(path)
    if not os.path.isdir(abs_path):
        _err_console.print(f"[red]Error:[/red] '{abs_path}' is not a valid directory")
        raise typer.Exit(code=1)

    set_root_dir(abs_path)
    needs_resync_file = get_data_file("needs_resync.txt", abs_path)
    with open(needs_resync_file, "w") as f:
        f.write("1")
    _console.print(f"Project root set to: [bold]{abs_path}[/bold]")


@app.command("set-color")
def set_color(
    path: str = typer.Argument(..., help="Relative path to the file or directory"),
    color: str = typer.Argument(..., help="Hex color (e.g. #ff0000)"),
):
    """Set a node's debug output color."""
    from swarm_debug.core.toggle_ops import load_tree, save_tree, set_node_color

    tree = load_tree()
    if set_node_color(tree, path, color):
        save_tree(tree)
        _console.print(f"Set color of [bold]'{path}'[/bold] to [{color}]{color}[/]")
    else:
        if not color.startswith("#") or len(color) != 7:
            pass
        else:
            _err_console.print(f"[red]Error:[/red] path '{path}' not found in the debug tree")
        raise typer.Exit(code=1)


@app.command("set-emoji")
def set_emoji(
    path: str = typer.Argument(..., help="Relative path to the file or directory"),
    emoji: str = typer.Argument(..., help="Emoji character"),
):
    """Set a node's debug output emoji."""
    from swarm_debug.core.toggle_ops import load_tree, save_tree, set_node_emoji

    tree = load_tree()
    if set_node_emoji(tree, path, emoji):
        save_tree(tree)
        _console.print(f"Set emoji of [bold]'{path}'[/bold] to {emoji}")
    else:
        _err_console.print(f"[red]Error:[/red] path '{path}' not found in the debug tree")
        raise typer.Exit(code=1)


@app.command()
def reset():
    """Reset all colors and emojis to defaults."""
    typer.confirm("This will reset all colors and emojis to defaults. Continue?", abort=True)

    from swarm_debug.core.toggle_ops import load_tree, reset_all, save_tree

    tree = load_tree()
    reset_all(tree)
    save_tree(tree)
    _console.print("[green]Reset all colors and emojis to defaults[/green]")


@app.command("install-cursor-skill")
def install_cursor_skill():
    """Install the swarm-debug Cursor AI skill to .cursor/skills/ in the project root."""
    if not _SKILL_SRC.exists():
        _err_console.print("[red]Error:[/red] bundled SKILL.md not found in package data")
        raise typer.Exit(code=1)

    dst_dir = _skill_dst_dir()
    dst = _skill_dst()

    if dst.exists():
        if filecmp.cmp(_SKILL_SRC, dst, shallow=False):
            _console.print(Panel(f"[bold yellow]Cursor skill is already up to date:[/bold yellow] [dim]{dst}[/dim]"))
            return
        shutil.copy2(_SKILL_SRC, dst)
        _console.print(f"Cursor skill [green]updated[/green]: {dst}")
    else:
        dst_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(_SKILL_SRC, dst)
        _console.print(f"Cursor skill [green]installed[/green]: {dst}")

    _console.print("[dim]Tip: this will be kept in sync automatically whenever you use any swarm-debug command.[/dim]")


@app.command("uninstall-cursor-skill")
def uninstall_cursor_skill():
    """Remove the swarm-debug Cursor AI skill from .cursor/skills/ in the project root."""
    dst_dir = _skill_dst_dir()

    if not dst_dir.exists():
        _console.print(Panel("[red]Cursor skill is not installed, nothing to remove.[/red]"))
        return

    typer.confirm("Remove the Cursor skill?", abort=True)
    shutil.rmtree(dst_dir)
    _console.print(f"Cursor skill [red]removed[/red]: {dst_dir}")


@app.command()
def stats():
    """Show a flat table of all debug files with their status, color, and emoji."""
    from swarm_debug.core.DEFAULTS import get_root_dir
    from swarm_debug.core.models.DebugFile import DebugFile
    from swarm_debug.core.models.Directory import Directory
    from swarm_debug.core.toggle_ops import load_tree

    tree = load_tree(quiet=True)

    table = Table(title=f"Debug Files — {get_root_dir()}")
    table.add_column("Path", style="bold")
    table.add_column("Status", justify="center")
    table.add_column("Color", justify="center")
    table.add_column("Emoji", justify="center")

    def _walk(node, depth=0):
        if isinstance(node, DebugFile):
            status_str = "[green]ON[/green]" if node.is_toggled else "[red]OFF[/red]"
            color_block = f"[{node.color}]██[/]"
            table.add_row(node.path, status_str, color_block, node.emoji)
        elif isinstance(node, Directory):
            for child in node.children:
                _walk(child, depth + 1)

    _walk(tree)
    _console.print(table)


def main():
    app()
