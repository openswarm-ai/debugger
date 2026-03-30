# Agent 4 — PyPI Packaging Compatibility + Cleanup

**Phases covered:** 9 (PyPI compat) + 10 (Cleanup)

**Prerequisite:** Agents 1–3 must be complete. The full app should be running with FastAPI backend, Webpack frontend, Redux state, MUI components, and design tokens.

**Prompt to give this agent:**
> Read `REFACTOR_PLAN/AGENT_4_PYPI_AND_CLEANUP.md` and execute every step. Also read `DEBUGGER_PIP_MODULE_CONTEXT.md` for the full PyPI packaging plan. This agent verifies PyPI compatibility after the refactor, cleans up dead files, and rewrites the README.

---

## Context

The debugger is designed to be published on PyPI as `openswarm-debug` (see `DEBUGGER_PIP_MODULE_CONTEXT.md`). The refactor changed:
- Backend from Flask to FastAPI
- Backend directory structure (domain logic moved to `backend/core/`)
- Frontend from CRA to Webpack 5 (build output is now `dist/` not `build/`)
- Entry point module structure

All of these affect the packaging. This agent ensures everything still works for `pip install openswarm-debug`.

---

## Phase 9: PyPI Packaging Compatibility

### Step 1: Create/update `pyproject.toml`

If `setup.py` still exists at the root, it should be replaced by `pyproject.toml`. If `pyproject.toml` already exists, update it. The final contents:

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "openswarm-debug"
version = "0.1.0"
description = "A colorized, toggleable debug logger with a web GUI"
readme = "README.md"
license = {text = "MIT"}
requires-python = ">=3.9"
dependencies = [
    "fastapi[standard]",
    "typeguard>=4.4",
    "uvicorn[standard]",
]

[project.scripts]
debug-server = "backend.main:main"

[tool.setuptools]
py-modules = ["debug"]
packages = [
    "backend",
    "backend.config",
    "backend.apps",
    "backend.apps.health",
    "backend.apps.debugger",
    "backend.core",
]

[tool.setuptools.package-data]
backend = ["debugger_gui_build/**/*", "debug_toggles.json", "log_mode.txt", "needs_resync.txt"]
```

Key changes from the original plan in `DEBUGGER_PIP_MODULE_CONTEXT.md`:
- Dependencies changed from `flask>=2.0, flask-cors>=4.0` to `fastapi[standard], typeguard, uvicorn[standard]`
- Package list expanded to include all new subpackages
- Entry point is now `backend.main:main` (not `debugger_backend.debugger_server:main`)
- Package data includes the data files that live in `backend/`

### Step 2: Delete `setup.py`

The old `setup.py` is replaced by `pyproject.toml`.

### Step 3: Add static file serving for the bundled GUI

In `backend/main.py`, add conditional static file serving. When running as a pip-installed package (not in dev mode), the backend should serve the pre-built React frontend:

```python
import os
from fastapi.staticfiles import StaticFiles

BUILD_DIR = os.path.join(os.path.dirname(__file__), 'debugger_gui_build')

# After all SubApp routers are registered, mount static files if the build exists
if os.path.isdir(BUILD_DIR):
    app.mount("/", StaticFiles(directory=BUILD_DIR, html=True), name="gui")
```

This must go **after** the router includes (so API routes take priority over the static file catch-all). The `html=True` flag makes it serve `index.html` for any path that doesn't match a file, enabling client-side routing.

### Step 4: Verify `backend/main.py` has a `main()` function

Confirm that `backend/main.py` has:

```python
def main():
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8324, reload=False)
```

Note: `reload=False` for production/pip usage (no file watching needed). The `run.sh` dev scripts use `--reload` independently.

### Step 5: Update the GUI build script

With Webpack instead of CRA, `npm run build` outputs to `dist/` not `build/`. Create or update a build script. Add a comment at the top of `pyproject.toml` or a `BUILD_INSTRUCTIONS.md` noting:

```bash
# Build the React GUI for pip packaging
cd frontend
npm install && npm run build
cp -r dist/ ../backend/debugger_gui_build/
```

Note the destination changed: the build goes inside `backend/` (not the root) because that's where `main.py` looks for it, and it's the package that gets distributed.

### Step 6: Verify `debug.py` imports

Confirm `debug.py` at the project root has these imports (should have been updated by Agent 1):

```python
from backend.core.log_config import log_config
from backend.core.Debugleton import Debugleton
from backend.core.color_adjuster import rgb_to_ansi, bold_and_italicize_text, hex_to_rgb
from backend.core.debug_arg_parser import is_text, is_error
```

The `sys.modules[__name__] = debug` trick at the bottom must still be present.

### Step 7: Verify pip install works

```bash
pip install -e .
```

This should install the `openswarm-debug` package in development mode. Verify:
- `python -c "import debug; print(type(debug))"` — should print `<class 'function'>`
- `debug-server` CLI command exists (even if it fails to start due to missing GUI build, the entry point should resolve)

### Step 8: Verify full pip package flow

```bash
# Build frontend
cd frontend && npm install && npm run build && cd ..

# Copy build to backend
cp -r frontend/dist/ backend/debugger_gui_build/

# Install
pip install -e .

# Run
debug-server
```

Should start the server on port 8324, serving both the API and the GUI on the same port.

---

## Phase 10: Cleanup

### Step 9: Delete dead files

Scan for any orphaned files that should no longer exist:

| File/Directory | Reason to delete |
|----------------|-----------------|
| `setup.py` | Replaced by `pyproject.toml` |
| `backend/server.py` | Should have been deleted by Agent 1 |
| `frontend/src/index.js` | Should have been deleted by Agent 2 |
| `frontend/src/App.js` | Should have been deleted by Agent 2 |
| `frontend/src/App.css` | Should have been deleted by Agent 2/3 |
| `frontend/src/index.css` | Should have been deleted by Agent 3 |
| `frontend/src/assets/` | Should have been deleted by Agent 2 |
| `frontend/src/components/` (old directory) | Should have been deleted by Agent 2 |
| Any remaining `.css` files in `frontend/src/` | Should have been deleted by Agent 3 |
| `REFACTOR_PLAN/` | Can be deleted after refactor is complete (optional — user's call) |

If any of the above still exist, delete them now.

### Step 10: Update `.gitignore`

Ensure these entries are present:

```gitignore
# Python
*.egg-info/
__pycache__/
.venv/
dist/
build/
*.egg

# Node
node_modules/
frontend/dist/

# Debugger runtime files
backend/debug_toggles.json
backend/needs_resync.txt
backend/log_mode.txt

# PyPI build artifacts
backend/debugger_gui_build/
*.tar.gz
*.whl

# IDE
.idea/
.vscode/
*.swp
*.swo
```

### Step 11: Rewrite `README.md`

Rewrite the README to match the webapp-template's format. It should include:

**Structure:**
1. One-liner description
2. Tech stack table
3. Quick start section
4. Project structure tree
5. Architecture section
6. PyPI installation section
7. License

**Content:**

```markdown
# OpenSwarm Debugger

A colorized, toggleable debug logger with a visual web GUI for managing per-file debug output.

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18, TypeScript, Webpack 5 | Babel transpilation, `@` → `src/` alias |
| UI | MUI v7, Emotion | Custom design token system (`frontend/DESIGN.md`) |
| State | Redux Toolkit | `frontend/src/shared/state/store.ts` |
| Animation | Framer Motion | |
| Backend | FastAPI, Python 3.10+ | Uvicorn ASGI, port 8324 |
| Runtime types | typeguard | `@typechecked` decorator on endpoints |

## Quick Start

Both services (backend on `:8324`, frontend on `:3000`):

```bash
bash run.sh
```

Individually:

```bash
bash backend/run.sh    # backend only
bash frontend/run.sh   # frontend only
```

API docs: `http://127.0.0.1:8324/docs`

## Install as pip package

```bash
pip install openswarm-debug
```

Usage in any Python project:

```python
import debug

debug(my_variable)  # Colorized, toggleable debug output
```

Launch the GUI to configure which files have debug output:

```bash
debug-server
# Open http://localhost:8324
```

## Project Structure

[Include the full tree from OVERVIEW.md]

## Architecture

### Backend — SubApp Pattern

Each feature is a SubApp: a self-contained module with its own APIRouter and async lifespan, auto-mounted at `/api/{name}/`.

### Frontend — Token-Based Theming

All styling flows through a custom design token system layered on MUI. Tokens are accessed via the `useClaudeTokens()` hook. See `frontend/DESIGN.md` for the full specification.

## License

MIT
```

Adapt the above to be accurate for the final state of the codebase. Include the actual project structure tree.

### Step 12: Final verification

Run through this complete checklist:

**Backend:**
- [ ] `bash backend/run.sh` — starts on port 8324
- [ ] `curl http://localhost:8324/api/health/check` — returns `OK`
- [ ] `curl http://localhost:8324/api/debugger/pull_structure` — returns JSON
- [ ] `curl http://localhost:8324/docs` — FastAPI docs load

**Frontend:**
- [ ] `bash frontend/run.sh` — Webpack dev server on port 3000
- [ ] UI loads with MUI components and design tokens
- [ ] Dark/light mode toggle works
- [ ] Tree loads with staggered animation
- [ ] Toggle files on/off — propagates to children
- [ ] Color picker works — propagates to children
- [ ] Emoji picker works — propagates to children
- [ ] Save button shows saving → saved transition
- [ ] Refresh button reloads from backend
- [ ] Settings modal opens with animation
- [ ] Settings persist in localStorage

**Orchestration:**
- [ ] `bash run.sh` — backend starts, waits for health, frontend starts
- [ ] Both processes monitored, clean shutdown on Ctrl+C

**PyPI:**
- [ ] `pip install -e .` — no errors
- [ ] `python -c "import debug; debug('test')"` — works (requires backend toggle config)
- [ ] `debug-server` — starts the server

**Code quality:**
- [ ] No `.css` files in `frontend/src/`
- [ ] No raw HTML elements in components (no `div`, `button`, `span`, `p`)
- [ ] No hardcoded colors in components
- [ ] No `axios` or `emoji-mart` in `package.json`
- [ ] No `react-scripts` in `package.json`
- [ ] No `Flask` in `requirements.txt`
- [ ] All imports use `@/` alias (no relative `../../` chains)
- [ ] TypeScript compiles with no errors

---

## Files Created

| File | Description |
|------|-------------|
| `pyproject.toml` | PyPI package configuration |

## Files Modified

| File | Change |
|------|--------|
| `backend/main.py` | Add static file serving for bundled GUI |
| `.gitignore` | Updated with full ignore list |
| `README.md` | Full rewrite to template format |

## Files Deleted

| File | Reason |
|------|--------|
| `setup.py` | Replaced by `pyproject.toml` |
| Any remaining orphan files from previous agents | Final cleanup sweep |
