---
name: swarm-debug
description: >-
  Instrument Python code with toggleable debug output using swarm-debug.
  Use when adding debug statements, print statemens, or logging. Use when toggling debug visibility, managing debug
  statements, or working with the swarm_debug module. NOTE: you should never use print or logging statements, only use debug.
---

# swarm-debug

A non-invasive debug logger for Python. You add `debug()` calls to code; visibility is controlled per-file via CLI or GUI without modifying source.

## CRITICAL: Always use the CLI, never read raw files

- **NEVER** read `~/.swarm-debug/projects/<hash>/debug_toggles.json` directly with `cat`, `head`, `tail`, `read`, or any file tool. The raw JSON is an internal per-project cache and may be stale or inconsistent with the actual codebase.
- **ALWAYS** use `swarm-debug status` or `swarm-debug status --json` to inspect state. The CLI rescans for `debug(` calls and returns the true resolved state.
- **NEVER** write to `debug_toggles.json` directly (stored per-project under `~/.swarm-debug/projects/<hash>/`). Use `swarm-debug toggle`, `swarm-debug set-color`, `swarm-debug set-emoji`, etc.

## CRITICAL: Locate and activate the correct Python environment first

Before running **any** `swarm-debug` command, you must find the environment that has the `swarm-debug` package installed:

1. **Check `.vscode/settings.json`** in the project root for a `python.defaultInterpreterPath`. If it points to a venv (e.g. `${workspaceFolder}/backend/.venv/bin/python`), activate that venv first:
   ```bash
   source <path-to-that-venv>/bin/activate
   ```
2. **If no `.vscode/settings.json` exists** (or it has no interpreter path), search the project for a `.venv` directory that contains the `swarm-debug` package:
   ```bash
   find . -path '*/.venv/bin/swarm-debug' -print -quit
   ```
   If found, activate that venv.
3. **If neither exists**, ask the user where the `swarm-debug` package is installed. Do **NOT** fall back to reading the raw JSON file or guessing a system Python path.

## Adding debug statements

```python
from swarm_debug import debug

debug(my_var)           # prints: [func_name] : my_var = <value>
debug("checkpoint")     # prints: [func_name] : checkpoint  (italic)
debug(err)              # errors auto-force ON with red output
debug("x=%s y=%s", x, y)  # %-style formatting
```

`debug()` inspects the call stack to extract the caller's file, function, variable names, and indentation. No format strings or manual labels needed -- pass variables directly.

## CLI reference

All commands work standalone (no server required). Paths are relative to project root.

```bash
# View current state
swarm-debug status              # human-readable tree with [ON]/[OFF] tags
swarm-debug status --json       # machine-readable JSON (pipe to jq, python, etc.)

# Toggle visibility
swarm-debug toggle on  src/agents/planner.py    # single file
swarm-debug toggle off src/agents/              # whole directory (recursive)
swarm-debug toggle on  --all                    # everything

# Configuration
swarm-debug set-root /path/to/project
swarm-debug set-color src/agents/planner.py "#ff0000"  # single file
swarm-debug set-color src/agents/ "#ff0000"            # directory (propagates lightened color to children)
swarm-debug set-emoji src/agents/planner.py "🔴"       # single file
swarm-debug set-emoji src/agents/ "🔴"                 # directory (propagates emoji to children)
swarm-debug reset                                      # reset all colors/emojis

# GUI
swarm-debug gui                 # launches web UI at localhost:6969
swarm-debug gui --port 8080
```

## Typical workflow

1. **Instrument**: Add `debug()` calls to files you want to observe.
2. **Set root**: `swarm-debug set-root /path/to/project` (only needed once; persisted in `~/.swarm-debug/projects/<hash>/root_dir.txt`).
3. **Toggle on** the files you care about: `swarm-debug toggle on src/core/engine.py`.
4. **Run** the program -- only toggled-on files produce debug output.
5. **Toggle off** when done: `swarm-debug toggle off src/core/engine.py`.

## How it works

- Internal state is cached per-project in `~/.swarm-debug/projects/<hash>/debug_toggles.json` (where `<hash>` is derived from the project root path), but this file should never be read or written directly. Always use the CLI commands to inspect or modify state.
- The CLI and GUI both read/write through the same underlying store.
- After any CLI/GUI change, a `needs_resync.txt` flag is set. The next `debug()` call in the running program reloads the config automatically -- no restart needed.
- Only `.py` files that contain `debug(` calls appear in the tree.

## Key behaviors

- **Directory changes propagate**: toggling, setting color, or setting emoji on a directory propagates to all children recursively.
- **Manual-override flags**: each concern has its own flag (`set_manually` for toggles, `set_manually_color` for color, `set_manually_emoji` for emoji). When you explicitly set a file's value, its flag is set so parent propagation won't override it.
- **Errors bypass toggles**: if a `debug()` argument is an Exception or contains "error", it always prints (red, with a cross emoji), regardless of toggle state.
- **Indentation preserved**: `debug()` reads source indentation and renders nested output with visual indent bars.

## Reading status programmatically

```bash
# Get JSON and extract toggled-on files with jq
swarm-debug status --json | jq '.. | objects | select(.is_toggled == true and (.children | not)) | .name'
```

## Environment variables

- `SWARM_DEBUG_ROOT` -- overrides the project root (highest priority, above persisted file and cwd).
