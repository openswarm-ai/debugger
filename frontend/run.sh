#!/bin/bash
# The comment above is shebang, DO NOT REMOVE
RUN_FRONTEND_ABSPATH="$(readlink -f "${BASH_SOURCE[0]}")"
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/\r//g' "$RUN_FRONTEND_ABSPATH"
else
    sed -i 's/\r//g' "$RUN_FRONTEND_ABSPATH"
fi
chmod +x "$RUN_FRONTEND_ABSPATH"

FRONTEND_DIR_ABSPATH="$(dirname "$RUN_FRONTEND_ABSPATH")"

# --- Load port config ---
source "$FRONTEND_DIR_ABSPATH/../ports.conf"
export PORT="${FRONTEND_PORT:-3000}"

echo "Installing dependencies..."
cd "$FRONTEND_DIR_ABSPATH"
npm install

echo "Starting frontend..."
npm run dev
