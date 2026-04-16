---
name: swarm-debug
description: >-
  Instrument Python code with toggleable debug output using swarm-debug.
  Use when adding debug statements, print statemens, or logging. Use when toggling debug visibility, managing debug
  statements, or working with the swarm_debug module. NOTE: you should never use print or logging statements, only use debug...
---

# swarm-debug

A non-invasive debug logger for Python. You add `debug()` calls to code; visibility is controlled per-file via CLI or GUI without modifying source.

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
swarm-debug set-color src/agents/planner.py "#ff0000"
swarm-debug set-emoji src/agents/planner.py "🔴"
swarm-debug reset                               # reset all colors/emojis

# GUI
swarm-debug gui                 # launches web UI at localhost:6969
swarm-debug gui --port 8080
```

## Typical workflow

1. **Instrument**: Add `debug()` calls to files you want to observe.
2. **Set root**: `swarm-debug set-root /path/to/project` (only needed once; persisted in `~/.swarm-debug/root_dir.txt`).
3. **Toggle on** the files you care about: `swarm-debug toggle on src/core/engine.py`.
4. **Run** the program -- only toggled-on files produce debug output.
5. **Toggle off** when done: `swarm-debug toggle off src/core/engine.py`.

## How it works

- State lives in `~/.swarm-debug/debug_toggles.json` (a tree of files with `is_toggled`, `color`, `emoji` per node).
- The CLI and GUI both read/write this same file.
- After any CLI/GUI change, a `needs_resync.txt` flag is set. The next `debug()` call in the running program reloads the config automatically -- no restart needed.
- Only `.py` files that contain `debug(` calls appear in the tree.

## Key behaviors

- **Directory toggles propagate**: toggling a directory sets all children recursively.
- **`set_manually` flag**: when you explicitly toggle a file, it gets `set_manually: true` so parent propagation won't override it.
- **Errors bypass toggles**: if a `debug()` argument is an Exception or contains "error", it always prints (red, with a cross emoji), regardless of toggle state.
- **Indentation preserved**: `debug()` reads source indentation and renders nested output with visual indent bars.

## Reading status programmatically

```bash
# Get JSON and extract toggled-on files with jq
swarm-debug status --json | jq '.. | objects | select(.is_toggled == true and (.children | not)) | .name'
```

## Environment variables

- `SWARM_DEBUG_ROOT` -- overrides the project root (highest priority, above persisted file and cwd).
