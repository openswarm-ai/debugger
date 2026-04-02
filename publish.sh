#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Parse args ────────────────────────────────────────────────
TARGET=""
for arg in "$@"; do
    case "$arg" in
        --test) TARGET="test" ;;
        --real) TARGET="real" ;;
        *)
            echo "Unknown argument: $arg"
            echo "Usage: ./publish.sh --test | --real"
            exit 1
            ;;
    esac
done

if [ -z "$TARGET" ]; then
    echo "ERROR: You must specify --test or --real"
    echo ""
    echo "  ./publish.sh --test   # upload to test.pypi.org"
    echo "  ./publish.sh --real   # upload to pypi.org"
    exit 1
fi

# ── Check prerequisites ──────────────────────────────────────
for cmd in python3 npm; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "ERROR: $cmd is not installed."
        exit 1
    fi
done

if ! python3 -m build --version &>/dev/null; then
    echo "ERROR: 'build' package not found. Install it with:"
    echo "  pip install build"
    exit 1
fi

if ! python3 -m twine --version &>/dev/null 2>&1; then
    echo "ERROR: 'twine' package not found. Install it with:"
    echo "  pip install twine"
    exit 1
fi

# ── Clean previous artifacts ─────────────────────────────────
echo "Cleaning previous build artifacts..."
rm -rf "$ROOT_DIR/dist" \
       "$ROOT_DIR/build" \
       "$ROOT_DIR"/*.egg-info \
       "$ROOT_DIR/backend/debugger_gui_build"

# ── Build frontend ───────────────────────────────────────────
echo "Building frontend..."
cd "$ROOT_DIR/frontend"
npm ci
npm run build

# ── Copy frontend build into the Python package ──────────────
echo "Copying frontend build to backend/debugger_gui_build/..."
cp -r "$ROOT_DIR/frontend/dist" "$ROOT_DIR/backend/debugger_gui_build"

# ── Build Python sdist + wheel ───────────────────────────────
echo "Building Python package..."
cd "$ROOT_DIR"
python3 -m build

# ── Upload ───────────────────────────────────────────────────
if [ "$TARGET" = "test" ]; then
    echo ""
    echo "Uploading to TEST PyPI (test.pypi.org)..."
    python3 -m twine upload --repository testpypi dist/*
    echo ""
    echo "Done! Install with:"
    echo "  pip install -i https://test.pypi.org/simple/ swarm-debug"
else
    echo ""
    echo "Uploading to PyPI (pypi.org)..."
    python3 -m twine upload dist/*
    echo ""
    echo "Done! Install with:"
    echo "  pip install swarm-debug"
fi
