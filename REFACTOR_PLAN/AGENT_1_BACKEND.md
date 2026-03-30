# Agent 1 — Backend: Flask → FastAPI + SubApp + `run.sh`

**Phases covered:** 1 (Backend migration) + 2 (`run.sh` separation)

**Prerequisite:** None — this agent goes first.

**Prompt to give this agent:**
> Read `REFACTOR_PLAN/AGENT_1_BACKEND.md` and execute every step. This migrates the backend from Flask to FastAPI with the SubApp pattern, restructures the backend directory, and rewrites the run scripts.

---

## Context

The debugger backend is currently a flat Flask app in `backend/server.py` with 4 routes at the root level. The [webapp-template](https://github.com/openswarm-ai/webapp-template) uses FastAPI with a SubApp/MainApp plugin architecture where each feature is a self-contained module with its own `APIRouter`, auto-mounted at `/api/{name}/`.

The template repo is at https://github.com/openswarm-ai/webapp-template — fetch the following files from it as reference:
- `backend/config/Apps.py`
- `backend/apps/health/health.py`
- `backend/main.py`
- `backend/run.sh`
- `frontend/run.sh`
- `run.sh`

---

## Step 1: Update `backend/requirements.txt`

Replace the contents entirely:

```
fastapi[standard]
typeguard==4.4.2
```

The old contents (`Flask==2.0.1`, `Flask-Cors==4.0.1`, `Werkzeug==2.0.3`) are no longer needed.

---

## Step 2: Create backend directory structure

Create these new directories and `__init__.py` files:

```
backend/config/__init__.py          (empty)
backend/apps/__init__.py            (empty)
backend/apps/health/__init__.py     (empty)
backend/apps/debugger/__init__.py   (empty)
backend/core/__init__.py            (empty)
```

If `backend/__init__.py` doesn't exist, create it (empty).

---

## Step 3: Create `backend/config/Apps.py`

Fetch and copy the template's `backend/config/Apps.py` from the webapp-template repo verbatim. This is the SubApp/MainApp framework. It should contain:

- `class SubApp` — takes a `name` and `lifespan` callable, creates an `APIRouter`
- `class MainApp` — takes a list of `SubApp` instances, creates a `FastAPI` app, composes lifespans, includes routers with `/api/{name}` prefix

---

## Step 4: Create `backend/apps/health/health.py`

Fetch and copy the template's `backend/apps/health/health.py` from the webapp-template repo verbatim. This provides `GET /api/health/check` returning `PlainTextResponse("OK")`.

---

## Step 5: Move domain logic to `backend/core/`

Move these files from `backend/` to `backend/core/`:

| Source | Destination |
|--------|-------------|
| `backend/DEFAULTS.py` | `backend/core/DEFAULTS.py` |
| `backend/Debugleton.py` | `backend/core/Debugleton.py` |
| `backend/DebugFile.py` | `backend/core/DebugFile.py` |
| `backend/Directory.py` | `backend/core/Directory.py` |
| `backend/File.py` | `backend/core/File.py` |
| `backend/color_adjuster.py` | `backend/core/color_adjuster.py` |
| `backend/debug_arg_parser.py` | `backend/core/debug_arg_parser.py` |
| `backend/log_config.py` | `backend/core/log_config.py` |
| `backend/log_mode.py` | `backend/core/log_mode.py` |
| `backend/path_mngr.py` | `backend/core/path_mngr.py` |
| `backend/project_scanner.py` | `backend/core/project_scanner.py` |

**Do NOT move:** `debug_toggles.json`, `log_mode.txt`, `needs_resync.txt`, `requirements.txt`. These stay in `backend/`.

---

## Step 6: Update all internal imports

Every `from backend.X import Y` in the moved files must become `from backend.core.X import Y`.

Files that need import updates (now in `backend/core/`):

**`backend/core/DEFAULTS.py`** — no imports from other backend modules, but update the `TOGGLE_FILE` and `ROOT_DIR` paths. `TOGGLE_FILE` should still point to `backend/debug_toggles.json`. Since the file moved one level deeper:
```python
TOGGLE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'debug_toggles.json')
```
And `ROOT_DIR` needs to go up one more level:
```python
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
```

**`backend/core/Directory.py`** — update:
```python
from backend.core.DebugFile import DebugFile
from backend.core.DEFAULTS import DEFAULT_COLOR, DEFAULT_TOGGLED, DEFAULT_SET_MANUALLY, DEFAULT_EMOJI
from backend.core.path_mngr import get_abspath, get_root_rel_path
```

**`backend/core/DebugFile.py`** — update:
```python
from backend.core.File import File
from backend.core.DEFAULTS import DEFAULT_COLOR, DEFAULT_TOGGLED, DEFAULT_SET_MANUALLY, DEFAULT_EMOJI
```

**`backend/core/project_scanner.py`** — update:
```python
from backend.core.Directory import Directory
from backend.core.DEFAULTS import DEFAULT_COLOR, DEFAULT_TOGGLED, DEFAULT_SET_MANUALLY, TOGGLE_FILE, DEFAULT_EMOJI, ROOT_DIR
from backend.core.DebugFile import DebugFile
```

**`backend/core/Debugleton.py`** — update:
```python
from backend.core.project_scanner import update_debug_toggles
from backend.core.Directory import Directory
from backend.core.DebugFile import DebugFile
from backend.core.DEFAULTS import DEFAULT_COLOR, DEFAULT_TOGGLED, DEFAULT_EMOJI
```
Also update `NEEDS_RESYNC_FILE` path (file moved one level deeper):
```python
NEEDS_RESYNC_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'needs_resync.txt')
```

**`backend/core/log_config.py`** — update:
```python
from backend.core.log_mode import get_log_mode, set_log_mode
```

**`backend/core/log_mode.py`** — update `LOG_MODE_FILE` path:
```python
LOG_MODE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'log_mode.txt')
```

**`backend/core/path_mngr.py`** — update:
```python
from backend.core.DEFAULTS import ROOT_DIR
```

**`backend/core/File.py`** — update:
```python
from backend.core.path_mngr import get_abspath
```

**`backend/core/color_adjuster.py`** — no backend imports, no changes needed.

**`backend/core/debug_arg_parser.py`** — no backend imports, no changes needed.

---

## Step 7: Create `backend/apps/debugger/debugger.py`

This replaces `backend/server.py`. Migrate all 4 endpoints into a SubApp:

```python
import logging
import json
import os
from backend.config.Apps import SubApp
from backend.core.project_scanner import update_debug_toggles, dir_to_output_format
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from typeguard import typechecked

log = logging.getLogger(__name__)

NEEDS_RESYNC_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'needs_resync.txt')
DEBUG_TOGGLE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'debug_toggles.json')


@asynccontextmanager
async def debugger_lifespan():
    log.debug("debugger_lifespan START")
    yield
    log.debug("debugger_lifespan END")


debugger = SubApp("debugger", debugger_lifespan)


@debugger.router.get("/pull_structure")
@typechecked
async def pull_structure() -> JSONResponse:
    log.info("GET /api/debugger/pull_structure")
    scanned_dir = update_debug_toggles(save_to_file=True)
    output = dir_to_output_format(scanned_dir)
    return JSONResponse(content=output)


@debugger.router.post("/push_structure")
@typechecked
async def push_structure(data: dict) -> JSONResponse:
    log.info("POST /api/debugger/push_structure")
    project_structure = data['projectStructure']
    with open(DEBUG_TOGGLE_FILE, 'w', encoding='utf-8') as file:
        json.dump(project_structure, file, indent=4)
    with open(NEEDS_RESYNC_FILE, 'w') as f:
        f.write('1')
    return JSONResponse(content={"status": "success"})


@debugger.router.post("/reset_color")
@typechecked
async def reset_color() -> JSONResponse:
    log.info("POST /api/debugger/reset_color")
    scanned_dir = update_debug_toggles(save_to_file=False)
    scanned_dir.reset_colors()
    output = dir_to_output_format(scanned_dir)
    return JSONResponse(content=output)


@debugger.router.post("/reset_emoji")
@typechecked
async def reset_emoji() -> JSONResponse:
    log.info("POST /api/debugger/reset_emoji")
    scanned_dir = update_debug_toggles(save_to_file=False)
    scanned_dir.reset_emojis()
    output = dir_to_output_format(scanned_dir)
    return JSONResponse(content=output)
```

**Important:** The `push_structure` endpoint changes from using Flask's `request.get_json()` to accepting a `data: dict` parameter — FastAPI automatically parses the JSON request body. The frontend sends `{ projectStructure: ... }`, so `data['projectStructure']` still works.

---

## Step 8: Create `backend/main.py`

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

from backend.config.Apps import MainApp
from backend.apps.health.health import health
from backend.apps.debugger.debugger import debugger
from fastapi.middleware.cors import CORSMiddleware

main_app = MainApp([health, debugger])
app = main_app.app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def main():
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8324, reload=True)


if __name__ == "__main__":
    main()
```

---

## Step 9: Update `debug.py` imports

`debug.py` (in the project root) imports from `backend.*`. Update these to `backend.core.*`:

```python
from backend.core.log_config import log_config
from backend.core.Debugleton import Debugleton
from backend.core.color_adjuster import rgb_to_ansi, bold_and_italicize_text, hex_to_rgb
from backend.core.debug_arg_parser import is_text, is_error
```

**Do NOT change anything else in `debug.py`.** The `sys.modules[__name__] = debug` trick is sacred.

---

## Step 10: Update frontend API base URL

In `frontend/src/App.js`, change the API base and all route paths to point at the new endpoints:

```javascript
const API_BASE = 'http://127.0.0.1:8324/api/debugger';
```

This is a temporary bridge — Agent 2 will do the full restructure with `API_ENDPOINTS.ts`. For now, just update the URL so the frontend can talk to the new backend.

Also verify all `axios` calls use the right paths. The current calls are:
- `axios.get(`${API_BASE}/pull_structure`)` — works as-is with new base
- `axios.post(`${API_BASE}/push_structure`, ...)` — works as-is
- `axios.post(`${API_BASE}/reset_color`)` — works as-is
- `axios.post(`${API_BASE}/reset_emoji`)` — works as-is (not directly in App.js but is a route)

---

## Step 11: Delete `backend/server.py`

It's been fully replaced by `backend/main.py` + `backend/apps/debugger/debugger.py`.

---

## Step 12: Create `backend/run.sh`

Fetch the template's `backend/run.sh` from the webapp-template repo and copy it. It should:
1. Strip carriage returns, chmod +x itself
2. Find a working Python 3 (tries `python3.13` down to `python3`)
3. Create `.venv` if it doesn't exist
4. Activate venv, `pip install -r requirements.txt`
5. Start: `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8324 --reload`

---

## Step 13: Create `frontend/run.sh`

Fetch the template's `frontend/run.sh` from the webapp-template repo and adapt it. For now (until Agent 2 switches to Webpack), the start command should be:

```bash
npm run start
```

(This still uses `react-scripts start` via the current `package.json` scripts. Agent 2 will change this to `npm run dev` when Webpack is introduced.)

Also update `frontend/package.json` to change the port from 6970 to 3000. Change the `start` script from:
```json
"start": "cross-env PORT=6970 react-scripts start"
```
to:
```json
"start": "cross-env PORT=3000 react-scripts start"
```

---

## Step 14: Rewrite root `run.sh`

Fetch the template's root `run.sh` from the webapp-template repo and adapt it. Key changes from the current script:

1. **Start backend first** (currently frontend starts first)
2. **Health check readiness** — poll `http://localhost:8324/api/health/check` until 200
3. **Then start frontend**
4. **Monitor both PIDs** in a loop — exit if either dies
5. **Cleanup** uses `kill 0` to terminate the whole process group
6. **Prefix output** with `[backend]` / `[frontend]` via `awk`

The `BACKEND_URL` should be `http://localhost:8324/api/health/check`.

---

## Step 15: Verify

Run these checks:

1. `bash backend/run.sh` — backend starts on port 8324, no import errors
2. `curl http://localhost:8324/api/health/check` — returns `OK`
3. `curl http://localhost:8324/api/debugger/pull_structure` — returns the project structure JSON
4. `curl http://localhost:8324/docs` — FastAPI auto-docs load
5. `bash run.sh` — both services start (backend first, then frontend)
6. Frontend UI loads and can pull/push structure, toggle files, change colors/emojis
7. `python -c "import debug"` — no import errors (verifies `debug.py` import paths work)

---

## Files Created

| File | Description |
|------|-------------|
| `backend/__init__.py` | Empty (if didn't exist) |
| `backend/config/__init__.py` | Empty |
| `backend/config/Apps.py` | SubApp/MainApp framework (from template) |
| `backend/apps/__init__.py` | Empty |
| `backend/apps/health/__init__.py` | Empty |
| `backend/apps/health/health.py` | Health check endpoint (from template) |
| `backend/apps/debugger/__init__.py` | Empty |
| `backend/apps/debugger/debugger.py` | Migrated debugger endpoints |
| `backend/core/__init__.py` | Empty |
| `backend/core/*.py` | All domain logic (moved from `backend/`) |
| `backend/main.py` | FastAPI app composition |
| `backend/run.sh` | Standalone backend runner |
| `frontend/run.sh` | Standalone frontend runner |

## Files Modified

| File | Change |
|------|--------|
| `backend/requirements.txt` | Flask deps → `fastapi[standard]`, `typeguard` |
| `debug.py` | `backend.X` imports → `backend.core.X` |
| `frontend/src/App.js` | `API_BASE` URL updated to `http://127.0.0.1:8324/api/debugger` |
| `frontend/package.json` | Port 6970 → 3000 |
| `run.sh` | Full rewrite to template pattern |

## Files Deleted

| File | Reason |
|------|--------|
| `backend/server.py` | Replaced by `backend/main.py` + SubApp |
| `backend/DEFAULTS.py` | Moved to `backend/core/DEFAULTS.py` |
| `backend/Debugleton.py` | Moved to `backend/core/Debugleton.py` |
| `backend/DebugFile.py` | Moved to `backend/core/DebugFile.py` |
| `backend/Directory.py` | Moved to `backend/core/Directory.py` |
| `backend/File.py` | Moved to `backend/core/File.py` |
| `backend/color_adjuster.py` | Moved to `backend/core/color_adjuster.py` |
| `backend/debug_arg_parser.py` | Moved to `backend/core/debug_arg_parser.py` |
| `backend/log_config.py` | Moved to `backend/core/log_config.py` |
| `backend/log_mode.py` | Moved to `backend/core/log_mode.py` |
| `backend/path_mngr.py` | Moved to `backend/core/path_mngr.py` |
| `backend/project_scanner.py` | Moved to `backend/core/project_scanner.py` |
