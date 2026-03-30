#!/usr/bin/env python3
"""Structural linter: enforces file/folder limits and unused-code detection."""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_FILE = SCRIPT_DIR / "structlint.json"


def load_config() -> dict[str, Any]:
    with open(CONFIG_FILE) as f:
        return json.load(f)


def _matches_any(text: str, patterns: list[str]) -> bool:
    return any(fnmatch.fnmatch(text, p) for p in patterns)


def is_excluded(path: Path, root: Path, excludes: list[str]) -> bool:
    rel = path.relative_to(root)
    for part in rel.parts:
        if _matches_any(part, excludes):
            return True
    return _matches_any(str(rel), excludes)


def is_excepted(rel_path: str, rule: str, exceptions: dict[str, list[str]]) -> bool:
    return _matches_any(rel_path, exceptions.get(rule, []))


def check_file_lines(
    filepath: Path, root: Path, max_lines: int,
) -> tuple[str, int] | None:
    try:
        count = len(filepath.read_text(errors="ignore").splitlines())
    except OSError:
        return None
    if count >= max_lines:
        rel = filepath.relative_to(root)
        msg = (
            f"{rel}:1:1: error: File has {count} lines "
            f"(limit {max_lines}) [max-file-lines]"
        )
        return (msg, count)
    return None


ANCHOR_FILES = ("__init__.py", "index.ts", "index.tsx", "index.js")


def _find_anchor_file(dirpath: Path, root: Path) -> str:
    """Find a real file inside the folder to attach the diagnostic to.

    Prefers common entry-point files (__init__.py, index.ts, etc.) so the
    error shows up inline when you open that file. Falls back to the first
    file alphabetically, then the directory path itself.
    """
    for name in ANCHOR_FILES:
        candidate = dirpath / name
        if candidate.exists():
            return str(candidate.relative_to(root))
    try:
        first = sorted(
            f for f in dirpath.iterdir()
            if f.is_file() and not f.name.startswith(".")
        )
        if first:
            return str(first[0].relative_to(root))
    except OSError:
        pass
    return str(dirpath.relative_to(root))


def check_folder_items(
    dirpath: Path, root: Path, max_items: int, excludes: list[str],
) -> tuple[str, int] | None:
    try:
        items = [
            i for i in dirpath.iterdir()
            if not i.name.startswith(".") and not _matches_any(i.name, excludes)
        ]
    except OSError:
        return None
    count = len(items)
    if count >= max_items:
        anchor = _find_anchor_file(dirpath, root)
        rel = dirpath.relative_to(root)
        msg = (
            f"{anchor}:1:1: error: Folder '{rel}' has {count} items "
            f"(limit {max_items}) [max-folder-items]"
        )
        return (msg, count)
    return None


def run_vulture(
    root: Path, min_confidence: int, error_threshold: int,
    exceptions: dict[str, list[str]],
) -> list[str]:
    """Run vulture on the Python backend and return errors in structlint format."""
    vulture_bin = root / "backend" / ".venv" / "bin" / "vulture"
    if not vulture_bin.exists():
        found = shutil.which("vulture")
        if not found:
            return []
        vulture_bin = Path(found)

    whitelist = SCRIPT_DIR / "vulture_whitelist.py"
    cmd = [str(vulture_bin), "backend", "debug.py"]
    if whitelist.exists():
        cmd.append(str(whitelist))
    cmd.extend([
        "--min-confidence", str(min_confidence),
        "--exclude", ".venv,__pycache__,data,uv-bin",
    ])

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, cwd=str(root), timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired):
        return []

    errors: list[str] = []
    for line in result.stdout.strip().splitlines():
        m = re.match(r"^(.+):(\d+): (.+)$", line)
        if not m:
            continue
        filepath, lineno, message = m.groups()
        if is_excepted(filepath, "vulture", exceptions):
            continue
        conf = re.search(r"\((\d+)% confidence\)", message)
        confidence = int(conf.group(1)) if conf else 0
        severity = "error" if confidence >= error_threshold else "warning"
        errors.append(f"{filepath}:{lineno}:1: {severity}: {message} [vulture]")
    return errors


def run_checks(root: Path) -> tuple[list[str], list[str]]:
    config = load_config()
    rules: dict[str, int] = config["rules"]
    excludes: list[str] = config["exclude"]
    exceptions: dict[str, list[str]] = config["exceptions"]
    extensions: list[str] = config["include_extensions"]

    max_lines: int = rules["max-file-lines"]
    max_items: int = rules["max-folder-items"]
    structural_errors: list[str] = []

    for dirpath_str, dirnames, filenames in os.walk(root):
        dp = Path(dirpath_str)

        if is_excluded(dp, root, excludes):
            dirnames.clear()
            continue

        rel_dir = str(dp.relative_to(root))
        if rel_dir != "." and not is_excepted(rel_dir, "max-folder-items", exceptions):
            result = check_folder_items(dp, root, max_items, excludes)
            if result:
                structural_errors.append(result[0])

        for fname in filenames:
            fp = dp / fname
            if fp.suffix not in extensions:
                continue
            if is_excluded(fp, root, excludes):
                continue
            rel_file = str(fp.relative_to(root))
            if not is_excepted(rel_file, "max-file-lines", exceptions):
                result = check_file_lines(fp, root, max_lines)
                if result:
                    structural_errors.append(result[0])

    vulture_errors: list[str] = []
    vulture_confidence = rules.get("vulture-min-confidence")
    if vulture_confidence is not None:
        vulture_error_threshold = rules.get("vulture-error-threshold", 100)
        vulture_errors = run_vulture(
            root, vulture_confidence, vulture_error_threshold, exceptions,
        )

    return sorted(structural_errors), sorted(vulture_errors)


def _print_section(name: str, errors: list[str]) -> None:
    print(f"{name}: checking...", flush=True)
    for e in errors:
        print(e, flush=True)
    print(f"{name}: done. {len(errors)} error(s) found.", flush=True)


def print_results(
    structural_errors: list[str], vulture_errors: list[str],
) -> None:
    _print_section("structlint", structural_errors)
    _print_section("vulture", vulture_errors)


def watch_loop(root: Path) -> None:
    from watchfiles import watch, DefaultFilter

    print_results(*run_checks(root))

    class SourceFilter(DefaultFilter):
        allowed_extensions = (".py", ".ts", ".tsx", ".js", ".jsx")

        def __call__(self, change: Any, path: str) -> bool:
            if not super().__call__(change, path):
                return False
            if Path(path).suffix in self.allowed_extensions:
                return True
            if Path(path).parent == SCRIPT_DIR and Path(path).suffix == ".json":
                return True
            return Path(path).is_dir()

    for _changes in watch(root, watch_filter=SourceFilter()):
        print_results(*run_checks(root))


def main() -> None:
    parser = argparse.ArgumentParser(description="Structural linter")
    parser.add_argument("--watch", action="store_true", help="Watch for changes")
    parser.add_argument("--root", type=str, default=".", help="Root directory")
    args = parser.parse_args()

    root = Path(args.root).resolve()

    if args.watch:
        watch_loop(root)
    else:
        results = run_checks(root)
        print_results(*results)
        sys.exit(1 if any(results) else 0)


if __name__ == "__main__":
    main()
