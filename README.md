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

```
debugger/
├── run.sh                              # Root orchestrator: backend → health check → frontend
├── debug.py                            # Sacred — pip module entry, do not modify behavior
├── pyproject.toml                      # PyPI package configuration
├── DEBUGGER_PIP_MODULE_CONTEXT.md
├── README.md
├── backend/
│   ├── __init__.py
│   ├── main.py                         # FastAPI app composition, CORS, main()
│   ├── requirements.txt                # fastapi[standard], typeguard
│   ├── run.sh                          # Standalone backend runner
│   ├── config/
│   │   ├── __init__.py
│   │   └── Apps.py                     # SubApp/MainApp framework
│   ├── apps/
│   │   ├── __init__.py
│   │   ├── health/
│   │   │   ├── __init__.py
│   │   │   └── health.py              # GET /api/health/check
│   │   └── debugger/
│   │       ├── __init__.py
│   │       └── debugger.py            # All debugger endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── DEFAULTS.py
│   │   ├── Debugleton.py
│   │   ├── DebugFile.py
│   │   ├── Directory.py
│   │   ├── File.py
│   │   ├── color_adjuster.py
│   │   ├── debug_arg_parser.py
│   │   ├── log_config.py
│   │   ├── log_mode.py
│   │   ├── path_mngr.py
│   │   └── project_scanner.py
│   ├── debug_toggles.json
│   ├── log_mode.txt
│   └── needs_resync.txt
└── frontend/
    ├── run.sh                          # Standalone frontend runner
    ├── package.json                    # Webpack-based, MUI v7, Redux, Framer Motion
    ├── webpack.config.js
    ├── tsconfig.json
    ├── DESIGN.md                       # Full design system spec
    ├── public/
    │   └── index.html
    └── src/
        ├── index.tsx                   # createRoot entry
        ├── types/
        │   └── index.ts
        ├── app/
        │   ├── Main.tsx               # Provider → ThemeProvider → page
        │   ├── pages/
        │   │   └── Debugger/
        │   │       ├── Debugger.tsx
        │   │       └── DebuggerHeader.tsx
        │   └── components/
        │       ├── Tree/
        │       │   ├── Tree.tsx
        │       │   └── TreeNode.tsx
        │       ├── SyncSection/
        │       │   ├── SyncSection.tsx
        │       │   ├── PushButton.tsx
        │       │   └── ColorReset.tsx
        │       ├── EmojiPicker/
        │       │   └── EmojiPicker.tsx
        │       └── SettingsModal/
        │           └── SettingsModal.tsx
        └── shared/
            ├── hooks.ts               # useAppDispatch, useAppSelector
            ├── state/
            │   ├── store.ts
            │   ├── API_ENDPOINTS.ts
            │   └── debuggerSlice.ts
            ├── styles/
            │   └── ThemeContext.tsx
            └── constants/
                └── emojis.ts
```

## Architecture

### Backend — SubApp Pattern

Each feature is a SubApp: a self-contained module with its own APIRouter and async lifespan, auto-mounted at `/api/{name}/`. SubApps are registered in `backend/config/Apps.py` and composed into the FastAPI app in `backend/main.py`.

### Frontend — Token-Based Theming

All styling flows through a custom design token system layered on MUI. Tokens are accessed via the `useClaudeTokens()` hook. See `frontend/DESIGN.md` for the full specification.

### PyPI Bundling

When published to PyPI, the pre-built React frontend is bundled inside `backend/debugger_gui_build/`. The FastAPI app serves these static files alongside the API, so end users get both the GUI and API on a single port with no Node.js dependency.

```bash
# Build the React GUI for pip packaging
cd frontend
npm install && npm run build
cp -r dist/ ../backend/debugger_gui_build/
```

## License

MIT
