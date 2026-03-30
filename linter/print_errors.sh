#!/bin/bash
# Print structlint violations to stdout with colored formatting.
# Usage: bash linter/print_errors.sh [ROOT_DIR]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${1:-$(dirname "$SCRIPT_DIR")}"

YELLOW='\033[33m'
BOLD='\033[1m'
RESET='\033[0m'

LINT_OUTPUT=$(python3 "$SCRIPT_DIR/structlint.py" --root "$ROOT_DIR" 2>&1)
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}${BOLD}[structlint] Violations found:${RESET}"
    echo "$LINT_OUTPUT" | grep -v "^structlint:" | grep -v "^vulture:" | while IFS= read -r line; do
        echo -e "${YELLOW}  $line${RESET}"
    done
    LINT_COUNT=$(echo "$LINT_OUTPUT" | grep -cE ':\s+(error|warning):\s+')
    echo -e "${YELLOW}${BOLD}  ${LINT_COUNT} violation(s) — fix or add exceptions in linter/structlint.json${RESET}"
    echo ""
fi
