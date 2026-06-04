# Rules: Package Skeleton Structure

## Metadata
- **Source KU:** package-skeleton-structure
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SKELETON-RULE-001: **Start from spatie/package-skeleton-laravel** — Don't build from scratch. The skeleton is the de facto standard.
- SKELETON-RULE-002: **Run configure script immediately** — Cloning without running `configure.php` leaves placeholder text that breaks autoloading.
- SKELETON-RULE-003: **Maintain .gitattributes** — Use `export-ignore` for tests, docs, CI config, and configure script. Prevents packaging irrelevant files.
- SKELETON-RULE-004: **Mirror src/ structure in tests/** — `src/Commands/MyCommand.php` → `tests/Commands/MyCommandTest.php` for discoverable organization.
- SKELETON-RULE-005: **Include auto-discovery** — Add `extra.laravel.providers` and `extra.laravel.aliases` in composer.json.

## Architecture Rules
- SKELETON-RULE-006: **Flat source structure** — Place classes directly in `src/` or use shallow subdirectories. Avoid deep nesting.
- SKELETON-RULE-007: **Service provider in src/** — Place `PackageServiceProvider.php` directly in `src/`. Single entry point.
- SKELETON-RULE-008: **Config-first design** — Default config at `config/package-name.php` with documented options. Snake_case keys.
- SKELETON-RULE-009: **Testbench setup** — `tests/TestCase.php` extends `Orchestra\Testbench\TestCase` with `getPackageProviders()`.

## Common Mistakes
- SKELETON-RULE-010: **Not running configure script** — Most common mistake. Package won't autoload or publish correctly.
- SKELETON-RULE-011: **Missing extra.laravel config** — Requires manual provider registration, poor DX.
- SKELETON-RULE-012: **PSR-4 misconfiguration** — Namespace mapping mismatch causes "class not found" errors.

## Anti-Pattern Rules
- SKELETON-RULE-013: **Avoid ignoring the skeleton** — Building structure manually from scratch misses important conventions.
- SKELETON-RULE-014: **Avoid deep src/ nesting** — More than 2-3 levels deep creates confusing structure.
- SKELETON-RULE-015: **Avoid over-customizing skeleton before first package** — Makes it harder to track upstream changes.
