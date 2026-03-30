# Debugger → PyPI Package Migration Context

This file contains context from a prior conversation about turning the `debugger/` folder into a standalone, pip-installable package on PyPI.

---

## What the debugger is

The debugger has **three parts**:

1. **`debug.py`** — A drop-in replacement for `print()`. Uses `sys.modules[__name__] = debug` to make `import debug` callable directly (i.e. `debug(foo)` works after `import debug`). It inspects the call stack to get file/function names, reads toggle/color config from JSON files, and prints colorized output with emojis.

2. **`debugger_backend/`** — A Flask server (port 6969) with three endpoints:
   - `GET /pull_structure` — scans the project and returns the file tree with toggle states
   - `POST /push_structure` — saves toggle/color/emoji config to `debug_toggles.json`
   - `POST /reset_color` — resets all colors to defaults
   - Dependencies: `Flask>=2.0`, `Flask-Cors>=4.0`, `Werkzeug`

3. **`debugger_gui/`** — A React app (Create React App, port 6970) with MUI, emoji-mart, and axios. It's a tree view UI where you toggle files on/off, pick colors per file/folder, and assign emojis. It talks to the Flask backend.

---

## PyPI details

- **PyPI package name:** `openswarm-debug` (confirmed available; `debug` is taken by an abandoned 2011 package)
- **Import name stays:** `import debug` — this is configured via `py-modules = ["debug"]` in pyproject.toml
- **PyPI account:** Created (username: `haikdc`), 2FA enabled, API token created with "Entire account" scope
- **After first publish:** Create a new project-scoped token and delete the account-wide one

---

## Chosen approach: Bundle pre-built React into the pip package

This is what Jupyter, MLflow, Streamlit, Gradio all do:

1. `npm run build` in `debugger_gui/` produces a static `build/` folder (HTML/JS/CSS)
2. Copy that build output into the package (e.g. as `debugger_gui_build/`)
3. Flask serves those static files — no Node.js needed on the end user's machine
4. The user runs one command (`debug-server`) to launch Flask, which serves both the API and the GUI on a single port

---

## Target repo structure

```
openswarm-debug/
├── pyproject.toml
├── README.md
├── LICENSE
├── debug.py                    # the import debug function
├── debugger_backend/
│   ├── __init__.py
│   ├── debugger_server.py      # Flask server (modify to serve static GUI build)
│   ├── Debugleton.py
│   ├── project_scanner.py
│   ├── path_mngr.py
│   ├── log_config.py
│   ├── log_mode.py
│   ├── debug_arg_parser.py
│   ├── color_adjuster.py
│   ├── File.py
│   ├── Directory.py
│   ├── DebugFile.py
│   ├── DEFAULTS.py
│   └── ...
├── debugger_gui/               # React source (for development only, NOT shipped)
│   ├── src/
│   ├── package.json
│   └── ...
└── debugger_gui_build/         # pre-built React app (included in pip package)
    ├── index.html
    ├── static/
    └── ...
```

---

## pyproject.toml template

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
    "flask>=2.0",
    "flask-cors>=4.0",
]

[project.scripts]
debug-server = "debugger_backend.debugger_server:main"

[tool.setuptools]
py-modules = ["debug"]
packages = ["debugger_backend"]

[tool.setuptools.package-data]
debugger_backend = ["debugger_gui_build/**/*"]
```

---

## Flask server changes needed

Add static file serving so the GUI is served from the pre-built React bundle:

```python
from flask import send_from_directory
import os

BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'debugger_gui_build')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_gui(path):
    if path and os.path.exists(os.path.join(BUILD_DIR, path)):
        return send_from_directory(BUILD_DIR, path)
    return send_from_directory(BUILD_DIR, 'index.html')
```

Also add a `main()` entry point so `debug-server` CLI command works:

```python
def main():
    app.run(host='0.0.0.0', port=6969, debug=False)

if __name__ == '__main__':
    main()
```

---

## Build & publish steps

```bash
# 1. Build the React GUI
cd debugger_gui
npm install && npm run build
cp -r build/ ../debugger_gui_build/

# 2. Build the pip package
cd /path/to/openswarm-debug
pip install build twine
python -m build

# 3. (Optional) Test on TestPyPI first
twine upload --repository testpypi dist/*
# username: __token__    password: your pypi-... token
pip install --index-url https://test.pypi.org/simple/ openswarm-debug

# 4. Upload to real PyPI
twine upload dist/*
# username: __token__    password: your pypi-... token

# 5. Verify
pip install openswarm-debug
```

---

## GitHub Actions automation (optional, for later)

`.github/workflows/publish.yml` — triggers on git tag push:

```yaml
name: Publish to PyPI
on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: cd debugger_gui && npm ci && npm run build && cp -r build ../debugger_gui_build

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install build twine
      - run: python -m build
      - run: twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
```

Store the PyPI API token as a GitHub Actions secret named `PYPI_API_TOKEN`.

---

## Key gotchas

- The `debug` name on PyPI is taken — must publish as `openswarm-debug`, but `import debug` still works via `py-modules = ["debug"]`
- The `sys.modules[__name__] = debug` trick in `debug.py` is what makes `import debug; debug(x)` work as a callable — don't break this
- The React GUI source (`debugger_gui/`) is for development only; end users get the pre-built static files (`debugger_gui_build/`)
- After first successful upload, create a project-scoped PyPI token and delete the account-wide one
