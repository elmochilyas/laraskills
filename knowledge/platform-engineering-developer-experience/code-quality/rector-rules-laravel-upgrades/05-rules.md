# Rules: Rector Rules Laravel Upgrades

## Metadata
- **Source KU:** rector-rules-laravel-upgrades
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- UPGRADE-RULE-001: **Run sets incrementally** — Apply L10→L11 first, verify, then L11→L12.
- UPGRADE-RULE-002: **Review every change** — 5-10% of automated changes need manual adjustments.
- UPGRADE-RULE-003: **Version-specific config** — Separate `rector-laravel-upgrade.php` config per upgrade.
- UPGRADE-RULE-004: **Use --dry-run first** — Inspect changes before writing.
- UPGRADE-RULE-005: **Apply to app/ only** — Don't run upgrade rules on vendor or tests first pass.
- UPGRADE-RULE-006: **Combine with code quality rules** — Run coding-style rules after upgrade rules.

## Architecture Rules
- UPGRADE-RULE-007: **One-time config per upgrade**, removed after completion.
- UPGRADE-RULE-008: **Process** — Dry-run → review → apply → commit → manual verification.
- UPGRADE-RULE-009: **Run upgrade rules in feature branch**, not main.
- UPGRADE-RULE-010: **Apply style rules as separate step** after upgrade changes.

## Decision Rules
- UPGRADE-RULE-011: **Use for major Laravel version upgrades** (10→11, 11→12).
- UPGRADE-RULE-012: **Not needed for patch version upgrades** (no API changes).
- UPGRADE-RULE-013: **Not for third-party package upgrades** — Use package-specific rectors.
