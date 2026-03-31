"""Check infrastructure: shared filter/match utilities."""

from __future__ import annotations

import fnmatch
from pathlib import Path


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
