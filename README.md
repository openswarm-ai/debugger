# swarm-debug

A drop-in replacement for `print()` debugging. Colorized, per-file toggleable output with a visual web GUI to control it all.

```bash
pip install swarm-debug
```

## What it does

`debug()` works like `print()`, but every call is:

- **Colorized** -- each file gets its own color so you can visually separate output
- **Toggleable** -- turn debug output on/off per file or entire directories without touching code
- **Context-aware** -- automatically shows the calling function, class, variable name, and indentation level
- **Emoji-tagged** -- assign emojis to files for instant visual scanning
- **Error-aware** -- exceptions are auto-highlighted in red with a dedicated emoji

All configuration is managed through a web GUI. No config files to write, no decorators to add.

## Usage

### 1. Add `debug()` calls to your code

```python
import debug

x = 42
debug(x)
# ⚫ [my_script.py] : x = 42

debug("loading config")
# ⚫ [my_script.py] : loading config

def process(data):
    debug(data, len(data))
    # ⚫ [MyClass.process] : data = [1, 2, 3]
    # ⚫ [MyClass.process] : len(data) = 3
```

Strings are rendered as italic labels. Everything else shows `name = value`. Errors are auto-detected and forced on in red regardless of toggle state.

### 2. Launch the GUI

```bash
debug-server
```

Open [http://localhost:8324](http://localhost:8324). You'll see a file tree of your project showing every file that calls `debug()`. From there you can:

- Toggle files/directories on and off
- Assign custom colors per file or directory (children inherit from parents)
- Assign emojis for visual tagging
- Push/pull configuration changes
- Reset colors or emojis to defaults

The server scans whichever directory you launched it from. To point it at a different project:

```bash
# Option A: cd into the project first
cd /path/to/my/project && debug-server

# Option B: set an env var
SWARM_DEBUG_ROOT=/path/to/my/project debug-server

# Option C: use the API
curl -X POST http://localhost:8324/api/debugger/root_dir \
  -H "Content-Type: application/json" \
  -d '{"root_dir": "/path/to/my/project"}'
```

The root dir persists across restarts (saved to `~/.swarm-debug/root_dir.txt`).

### Configuration storage

All runtime state lives in `~/.swarm-debug/`:

| File | Purpose |
|------|---------|
| `debug_toggles.json` | Per-file toggle, color, and emoji state |
| `root_dir.txt` | Persisted project root directory |
| `log_mode.txt` | Log output mode (`all`, `debug`, etc.) |
| `needs_resync.txt` | Internal flag for syncing state |

### API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/check` | Health check |
| GET | `/api/debugger/pull_structure` | Get file tree with toggle states |
| POST | `/api/debugger/push_structure` | Save toggle/color/emoji config |
| POST | `/api/debugger/reset_color` | Reset all colors to defaults |
| POST | `/api/debugger/reset_emoji` | Reset all emojis to defaults |
| GET | `/api/debugger/root_dir` | Get current project root |
| POST | `/api/debugger/root_dir` | Set project root (triggers resync) |

Full interactive docs at [http://localhost:8324/docs](http://localhost:8324/docs).

---

## Development (source)

### Prerequisites

- Python 3.9+
- Node.js 18+

### Running locally

Both services (backend on `:8324`, frontend dev server on `:3000`):

```bash
bash run.sh
```

Individually:

```bash
bash backend/run.sh    # FastAPI backend only
bash frontend/run.sh   # Webpack dev server only
```

### Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Webpack 5, MUI v7, Redux Toolkit, Framer Motion |
| Backend | FastAPI, Uvicorn, Python 3.9+ |
| Runtime types | typeguard (`@typechecked` on endpoints) |

### Architecture

**Backend** uses a SubApp pattern -- each feature is a self-contained module with its own APIRouter and async lifespan, auto-mounted at `/api/{name}/`. SubApps are registered in `backend/config/Apps.py` and composed into the FastAPI app in `backend/main.py`.

**Frontend** uses a custom design token system layered on MUI, accessed via `useClaudeTokens()`. See `frontend/DESIGN.md` for the full spec.

**Debugleton** is a thread-safe singleton that holds the scanned project tree in memory and resyncs when the `needs_resync` flag is set (after any push from the GUI).

### Project structure

```
debugger/
├── debug.py                     # The debug() function -- pip module entry point
├── pyproject.toml               # PyPI package config (swarm-debug)
├── publish.sh                   # Build + publish to PyPI
├── run.sh                       # Dev orchestrator: backend -> frontend
├── ports.conf                   # Port configuration
├── backend/
│   ├── main.py                  # FastAPI app, CORS, static file serving
│   ├── config/Apps.py           # SubApp / MainApp framework
│   ├── apps/
│   │   ├── health/health.py     # GET /api/health/check
│   │   └── debugger/debugger.py # All debugger API endpoints
│   ├── core/
│   │   ├── data_dir.py          # ~/.swarm-debug/ path management
│   │   ├── DEFAULTS.py          # Default values, get/set_root_dir
│   │   ├── Debugleton.py        # Thread-safe singleton for project state
│   │   ├── models/
│   │   │   ├── File.py          # Base file class
│   │   │   ├── DebugFile.py     # File with color/toggle/emoji
│   │   │   ├── Directory.py     # Recursive directory tree
│   │   │   └── project_scanner.py
│   │   ├── log/
│   │   │   ├── log_config.py    # Custom logger with modes
│   │   │   └── log_mode.py      # Read/write log mode
│   │   └── utils/
│   │       ├── color_adjuster.py
│   │       ├── debug_arg_parser.py
│   │       └── path_mngr.py
│   └── data/                    # Legacy data dir (runtime state now in ~/.swarm-debug/)
└── frontend/
    ├── package.json
    ├── webpack.config.js
    ├── DESIGN.md                # Design system specification
    └── src/
        ├── index.tsx
        ├── app/
        │   ├── Main.tsx
        │   ├── pages/Debugger/
        │   └── components/      # Tree, SyncSection, EmojiPicker, SettingsModal
        └── shared/
            ├── state/           # Redux store, slice, thunks
            ├── styles/          # Theme tokens
            └── constants/
```

---

## Publishing to PyPI

Everything is handled by a single script:

```bash
# Publish to test.pypi.org (for testing)
./publish.sh --test

# Publish to pypi.org (for real)
./publish.sh --real
```

The script will:
1. Clean previous build artifacts
2. Build the React frontend (`npm ci && npm run build`)
3. Bundle the build into `backend/debugger_gui_build/`
4. Build the Python sdist + wheel
5. Upload via twine

### Prerequisites for publishing

```bash
pip install build twine
```

You'll need a PyPI account and API token. Configure `~/.pypirc` or pass credentials when prompted by twine.

### How the pip package works

When installed from PyPI, the pre-built React frontend is bundled inside the wheel at `backend/debugger_gui_build/`. The FastAPI server serves these static files alongside the API, so end users get both the GUI and the API on a single port (8324) with zero Node.js dependency.

The `debug` module uses a `sys.modules` trick to make itself callable -- `import debug` gives you a function, not a module. This means `debug(x)` works directly after import with no extra setup.

## License

MIT
