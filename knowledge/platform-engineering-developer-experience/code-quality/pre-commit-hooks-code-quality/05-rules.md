# Rules: Pre-commit Hooks Code Quality

## Metadata
- **Source KU:** pre-commit-hooks-code-quality
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PRECOMMIT-RULE-001: **Order hooks wisely** — Fast hooks first (Pint 2s), then PHPStan (30s), then Rector (60s).
- PRECOMMIT-RULE-002: **Run on staged files only** — `pint --test --dirty` targets only changed files.
- PRECOMMIT-RULE-003: **Use repo hooks** — Install via `pre-commit install` (not manually symlinked).
- PRECOMMIT-RULE-004: **Skip for WIP** — `SKIP=pint-format git commit` for drafts with tracked bypass.
- PRECOMMIT-RULE-005: **Version lock hooks** — Pin hook `rev:` to prevent unexpected updates.
- PRECOMMIT-RULE-006: **Install globally** — `pip install pre-commit` in developer setup script.

## Architecture Rules
- PRECOMMIT-RULE-007: **One .pre-commit-config.yaml at repo root**.
- PRECOMMIT-RULE-008: **Separate CI from pre-commit** — CI runs full analysis, hooks run incremental.
- PRECOMMIT-RULE-009: **Allow --no-verify** for emergency commits (document in team norms).

## Decision Rules
- PRECOMMIT-RULE-010: **Use for all projects with >1 developer** for instant feedback before CI.
- PRECOMMIT-RULE-011: **Skip for solo projects** where developer discipline suffices.
- PRECOMMIT-RULE-012: **Skip when CI-only enforcement is fast** (< 2 min pipeline).
