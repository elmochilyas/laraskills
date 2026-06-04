# Rules: IDE Helper

## Metadata
- **Source KU:** ide-helper
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- IDE-RULE-001: **Run all three commands** — `generate`, `models`, `meta` for complete IDE support.
- IDE-RULE-002: **Composer script automation** — `post-update-cmd` for automatic regeneration after dependency updates.
- IDE-RULE-003: **Dev dependency only** — `require-dev` to avoid production deployment.
- IDE-RULE-004: **Gitignore generated files** — `_ide_helper.php` and `.phpstorm.meta.php`; track model annotations if inline.
- IDE-RULE-005: **Pin version** — Consistent stubs across team members by specifying exact version in composer.json.

## Architecture Rules
- IDE-RULE-006: **Facade stubs** — `_ide_helper.php` with `@method` annotations for all facades.
- IDE-RULE-007: **Model annotations** — `@property`, `@method`, `@mixin` for property/relationship completion.
- IDE-RULE-008: **PhpStorm meta** — `.phpstorm.meta.php` maps abstract types to concrete implementations.

## Decision Rules
- IDE-RULE-009: **Every Laravel project** should use IDE Helper for developer productivity.
- IDE-RULE-010: **Inline model annotations** (`--write`) for full diff visibility; separate file for clean models.
