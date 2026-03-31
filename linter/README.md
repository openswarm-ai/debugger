# Code Quality Tools

This folder contains the project's code quality tooling: a structural linter, dead code detection, and type checking — covering both the Python backend and TypeScript frontend.

## What gets checked

### Structural rules

**File length** — Every source file must be under 250 lines. Big files are hard to read, review, and maintain. If a file is getting long, it's a sign it should be split.

**Folder size** — Every folder must contain fewer than 6 items. Keeping folders small forces you to organize code into logical groups.

**Unused Python code (Vulture)** — Flags unused functions, classes, variables, and imports in the backend. Integrated into the linter's watch loop — findings appear as warnings in the Problems panel alongside structural errors. Only reports findings with >= 80% confidence to reduce noise.

These rules apply to `.py`, `.ts`, `.tsx`, `.js`, and `.jsx` files.

### Unused TypeScript code

**Per-file (ESLint)** — Catches unused variables, parameters, and imports within each file. Runs in real-time through the VS Code ESLint extension.

**Project-wide (Knip)** — Finds unused exports, unused files, and unused `package.json` dependencies across the entire frontend. Run manually or in CI.

### Type checking

**Python (Pyright/Pylance)** — Strict type checking for the backend, configured via `config/pyrightconfig.json`. Works through the Pylance extension in real-time.

**TypeScript** — The `tsconfig.json` in `frontend/` has strict mode enabled. TypeScript errors show in the editor automatically.

## How it runs

### Linter watch (automatic)

When you open the project in Cursor/VS Code, a background task starts watching for file changes. Every save re-checks the codebase. Violations show up in the **Problems panel** (`Cmd+Shift+M`).

```bash
# one-shot check (exits with code 1 if violations exist)
python3 linter/lint.py --root .

# continuous watch mode
python3 linter/lint.py --watch --root .
```

### ESLint (automatic)

The VS Code ESLint extension picks up `frontend/eslint.config.mjs` and shows errors inline as you type. To run from the terminal:

```bash
cd frontend

# check for problems
npm run lint

# auto-fix what's possible
npm run lint:fix
```

### Knip (manual / CI)

```bash
cd frontend
npm run knip
```

Or use the `knip:check` VS Code task (`Cmd+Shift+P` → "Run Task" → "knip:check").

## Configuration

### config/config.json

```json
{
  "enabled": {
    "max-file-lines": true,    // toggle each check on/off
    "max-folder-items": true,
    "no-nested-imports": true,
    "vulture": true,
    "eslint": true,
    "knip": true
  },
  "rules": {
    "max-file-lines": 250,     // files with >= this many lines trigger an error
    "max-folder-items": 6,     // folders with >= this many items trigger an error
    "vulture-min-confidence": 80,  // minimum confidence (0-100) to flag a finding
    "vulture-error-threshold": 90  // confidence at which a finding becomes an error
  },
  "include_extensions": [".py", ".ts", ".tsx", ".js", ".jsx"],
  "exclude": ["node_modules", ".venv", "..."],
  "exceptions": {
    "max-file-lines": [],      // glob patterns for exempt files
    "max-folder-items": [],    // glob patterns for exempt folders
    "vulture": []              // glob patterns for files vulture should ignore
  }
}
```

Set any key in `"enabled"` to `false` to skip that check entirely. Missing keys default to `true`, so existing configs without the `"enabled"` section behave identically to before.

### Vulture whitelist

`config/vulture_whitelist.py` suppresses false positives — symbols used by frameworks, entry points, or external consumers that vulture can't detect statically. Add bare names to the file to mark them as intentionally used.

### ESLint

`frontend/eslint.config.mjs` — flat config format (ESLint v9). The key rule for unused code is `@typescript-eslint/no-unused-vars`. Prefix a variable with `_` to suppress the warning.

### Knip

`frontend/knip.json` — Knip auto-detects entry points from `webpack.config.js`. The `project` field tells it which files to analyze.

## Adding exceptions

If a file legitimately needs to exceed a limit, add a glob to the `exceptions` list in `config/config.json`:

```json
{
  "exceptions": {
    "max-file-lines": ["backend/tests/test_analytics.py"],
    "max-folder-items": ["backend/apps/agents"],
    "vulture": ["backend/legacy/*"]
  }
}
```

Wildcards work: `"backend/tests/*"` exempts all files in the tests folder.

## Folder structure

```
linter/
  checks/              # check implementations
    __init__.py        # shared filter/match utilities
    structural.py      # file length, folder size, nested imports
    vulture.py         # vulture dead-code runner
    eslint.py          # eslint runner
    knip.py            # knip unused-code runner
  config/              # all configuration files
    config.json        # enabled checks, rules, exclusions, exceptions
    pyrightconfig.json # python type checking config
    vulture_whitelist.py # false positive suppressions for vulture
  lint.py              # orchestrator (loads config, runs checks, outputs results)
  print_errors.sh      # colored terminal reporter
  README.md
```
