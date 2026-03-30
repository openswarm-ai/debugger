# Code Quality Tools

This folder contains the project's code quality tooling: a structural linter, dead code detection, and type checking — covering both the Python backend and TypeScript frontend.

## What gets checked

### Structural rules (structlint)

**File length** — Every source file must be under 250 lines. Big files are hard to read, review, and maintain. If a file is getting long, it's a sign it should be split.

**Folder size** — Every folder must contain fewer than 6 items. Keeping folders small forces you to organize code into logical groups.

**Unused Python code (Vulture)** — Flags unused functions, classes, variables, and imports in the backend. Integrated into structlint's watch loop — findings appear as warnings in the Problems panel alongside structural errors. Only reports findings with >= 80% confidence to reduce noise.

These rules apply to `.py`, `.ts`, `.tsx`, `.js`, and `.jsx` files.

### Unused TypeScript code

**Per-file (ESLint)** — Catches unused variables, parameters, and imports within each file. Runs in real-time through the VS Code ESLint extension.

**Project-wide (Knip)** — Finds unused exports, unused files, and unused `package.json` dependencies across the entire frontend. Run manually or in CI.

### Type checking

**Python (Pyright/Pylance)** — Strict type checking for the backend, configured via `pyrightconfig.json`. Works through the Pylance extension in real-time.

**TypeScript** — The `tsconfig.json` in `frontend/` has strict mode enabled. TypeScript errors show in the editor automatically.

## How it runs

### Structlint + Vulture (automatic)

When you open the project in Cursor/VS Code, a background task starts watching for file changes. Every save re-checks the codebase. Violations show up in the **Problems panel** (`Cmd+Shift+M`).

```bash
# one-shot check (exits with code 1 if violations exist)
python3 linter/structlint.py --root .

# continuous watch mode
python3 linter/structlint.py --watch --root .
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

### structlint.json

```json
{
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

Set `"vulture-min-confidence": null` (or remove the key) to disable vulture entirely.

### Vulture whitelist

`vulture_whitelist.py` suppresses false positives — symbols used by frameworks, entry points, or external consumers that vulture can't detect statically. Add bare names to the file to mark them as intentionally used.

### ESLint

`frontend/eslint.config.mjs` — flat config format (ESLint v9). The key rule for unused code is `@typescript-eslint/no-unused-vars`. Prefix a variable with `_` to suppress the warning.

### Knip

`frontend/knip.json` — Knip auto-detects entry points from `webpack.config.js`. The `project` field tells it which files to analyze.

## Adding exceptions

If a file legitimately needs to exceed a structlint limit, add a glob to the `exceptions` list in `structlint.json`:

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

## Files in this folder

| File | Purpose |
|---|---|
| `structlint.py` | Structural linter + vulture integration |
| `structlint.json` | Rules, exclusions, and exceptions |
| `vulture_whitelist.py` | False positive suppressions for vulture |
| `pyrightconfig.json` | Python type checking config |
