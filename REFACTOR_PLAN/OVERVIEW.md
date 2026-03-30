# Refactor Plan — Overview

Bring the debugger codebase into alignment with the [webapp-template](https://github.com/openswarm-ai/webapp-template) conventions while preserving the `openswarm-debug` PyPI packaging plan (see `DEBUGGER_PIP_MODULE_CONTEXT.md`).

---

## Guiding Principles

- **Template is law** — every convention in webapp-template applies unless there's a debugger-specific reason to diverge.
- **PyPI compatibility** — the refactored codebase must still support `pip install openswarm-debug` with a bundled React build and a `debug-server` CLI entry point.
- **`debug.py` is sacred** — the `sys.modules[__name__] = debug` trick and `import debug; debug(x)` API must remain untouched.
- **Phase-by-phase** — each agent session is independently verifiable. Don't attempt everything at once.

---

## Agent Sessions

The work is split across **4 sequential agent sessions**. Each has its own detailed instruction file.

| Session | File | Phases | Scope | Effort |
|---------|------|--------|-------|--------|
| **Agent 1** | `AGENT_1_BACKEND.md` | 1 + 2 | Backend: Flask → FastAPI + SubApp pattern, `run.sh` scripts | Medium |
| **Agent 2** | `AGENT_2_BUILD_AND_TYPESCRIPT.md` | 3 + 4 + 5 | Frontend: CRA → Webpack 5, JS → TypeScript, architecture restructure | High |
| **Agent 3** | `AGENT_3_REDUX_AND_STYLING.md` | 6 + 7 + 8 | Frontend: Redux Toolkit, CSS → MUI `sx` + tokens, Framer Motion | High |
| **Agent 4** | `AGENT_4_PYPI_AND_CLEANUP.md` | 9 + 10 | PyPI packaging compatibility, dead file cleanup, README | Low |

---

## Dependency Graph

```
Agent 1 (backend + run.sh)
    │
    ▼
Agent 2 (webpack + TS + restructure)
    │
    ▼
Agent 3 (redux + styling + animation)
    │
    ▼
Agent 4 (PyPI compat + cleanup)
```

**These are strictly sequential.** Each agent depends on the previous one's output.

---

## Checkpoint Protocol

Between each agent session, manually verify:

1. **After Agent 1**: `bash run.sh` starts the backend on port 8324, `curl http://localhost:8324/api/health/check` returns `OK`, frontend still connects (will use old port temporarily)
2. **After Agent 2**: `bash run.sh` starts both services, frontend builds with Webpack on port 3000, TypeScript compiles without errors, all existing UI functionality works
3. **After Agent 3**: Full UI works with MUI components, dark/light mode toggle functions, all interactions (toggle, color, emoji, save, refresh) work
4. **After Agent 4**: `pip install -e .` works, `debug-server` launches the app, `import debug; debug("test")` works, README is accurate

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `DEBUGGER_PIP_MODULE_CONTEXT.md` | PyPI packaging plan — constraints on naming, bundling, entry points |
| `frontend/DESIGN.md` | (Created by Agent 3) Full design system specification from the template |
| [webapp-template](https://github.com/openswarm-ai/webapp-template) | The source of truth for all conventions |

---

## Port Changes

| Service | Current | Target |
|---------|---------|--------|
| Backend | 6969 | 8324 |
| Frontend | 6970 | 3000 |

---

## Final Directory Structure (after all 4 agents)

```
debugger/
├── run.sh                              # Root orchestrator: backend → health check → frontend
├── debug.py                            # Sacred — pip module entry, do not modify behavior
├── pyproject.toml                      # Replaces setup.py
├── DEBUGGER_PIP_MODULE_CONTEXT.md
├── README.md                           # Rewritten to match template format
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
│   │       └── debugger.py            # All 4 debugger endpoints
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
