# Rules: Laravel Shift

## Metadata
- **Source KU:** laravel-shift
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SHIFT-RULE-001: **Upgrade incrementally** — Go through each major version sequentially, not multi-version jumps.
- SHIFT-RULE-002: **Run tests after Shift** — Shift generates correct syntax but can't verify business logic.
- SHIFT-RULE-003: **Review config diffs carefully** — Config structural changes often contain important new settings.
- SHIFT-RULE-004: **Check third-party packages** — Shift updates Laravel but not all packages; verify compatibility manually.
- SHIFT-RULE-005: **Use Shift + manual polish** — Shift handles mechanical 80%, you handle semantic 20%.
- SHIFT-RULE-006: **Test on staging first** — Never merge and deploy to production without staging verification.

## Architecture Rules
- SHIFT-RULE-007: **Upgrade PHP version in a separate step** before Laravel version upgrade.
- SHIFT-RULE-008: **Keep a clean Git history** — Shift's atomic commits document every upgrade change.
- SHIFT-RULE-009: **Plan review time** — 2-8 hours for medium-sized application per major version upgrade.
- SHIFT-RULE-010: **Run Shift as scheduled CI task** to detect deprecated usage proactively.

## Decision Rules
- SHIFT-RULE-011: **Use for every major Laravel version upgrade** — Handles 80-95% of changes.
- SHIFT-RULE-012: **Use Rector with Laravel rules** as open-source alternative if budget doesn't justify commercial service.
- SHIFT-RULE-013: **Skip for very simple codebases** where manual upgrade may be faster.
