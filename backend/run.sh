#!/bin/bash
# The comment above is shebang, DO NOT REMOVE
RUN_BACKEND_ABSPATH="$(readlink -f "${BASH_SOURCE[0]}")"
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/\r//g' "$RUN_BACKEND_ABSPATH"
else
    sed -i 's/\r//g' "$RUN_BACKEND_ABSPATH"
fi
chmod +x "$RUN_BACKEND_ABSPATH"

BACKEND_DIR_ABSPATH="$(dirname "$RUN_BACKEND_ABSPATH")"

# --- Find a working Python 3 ---
PYTHON=""
for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" &>/dev/null && "$candidate" -c "print('ok')" &>/dev/null; then
        PYTHON="$candidate"
        break
    fi
done
if [[ -z "$PYTHON" ]]; then
    echo "Error: No working Python 3 found."
    exit 1
fi
echo "Using Python: $PYTHON ($($PYTHON --version 2>&1))"

# --- Create virtual environment if it doesn't exist ---
VENV_DIR="$BACKEND_DIR_ABSPATH/.venv"
if [[ ! -d "$VENV_DIR" ]]; then
    echo "Creating virtual environment..."
    "$PYTHON" -m venv "$VENV_DIR"
    if [[ $? -ne 0 ]]; then
        echo "Error: Failed to create virtual environment."
        exit 1
    fi
fi
source "$VENV_DIR/bin/activate"

# --- Install Python dependencies from pyproject.toml ---
echo "Installing dependencies..."
pip install -e "$BACKEND_DIR_ABSPATH/.."
if [[ $? -ne 0 ]]; then
    echo "Error: Failed to install Python dependencies."
    exit 1
fi

# --- Load port config ---
source "$BACKEND_DIR_ABSPATH/../ports.conf"
export BACKEND_PORT

# --- Start the backend server ---
echo "Starting backend server on http://0.0.0.0:${BACKEND_PORT:-8324} ..."
cd "$BACKEND_DIR_ABSPATH/.."
python -m uvicorn swarm_debug.server:app --host 0.0.0.0 --port ${BACKEND_PORT:-8324} --reload
