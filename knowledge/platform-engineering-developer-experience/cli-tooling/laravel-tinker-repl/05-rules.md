# Rules: Laravel Tinker REPL

## Metadata
- **Source KU:** laravel-tinker-repl
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- TINKER-RULE-001: **Limit result sets** — Use `User::limit(10)->get()` instead of `User::all()` to avoid memory exhaustion.
- TINKER-RULE-002: **Eager load relationships** — Use `with()` to prevent N+1 queries during exploration.
- TINKER-RULE-003: **Test with `->get()` before destructive ops** — Verify query returns what you expect before `->delete()` or `->update()`.
- TINKER-RULE-004: **Use `doc` and `show` commands** — Leverage PsySH commands for code exploration and documentation.
- TINKER-RULE-005: **Restart after file changes** — Exit and re-enter Tinker to pick up modified PHP files.

## Architecture Rules
- TINKER-RULE-006: **Tinker should only be in `require-dev`** — Never install as non-dev dependency.
- TINKER-RULE-007: **Use `config/tinker.php`** for command whitelist/blacklist and aliases.
- TINKER-RULE-008: **Never in production** — Tinker provides unrestricted data and service access.

## Decision Rules
- TINKER-RULE-009: **Use for ad-hoc queries, prototyping, and debugging during development.**
- TINKER-RULE-010: **Never run in production** — Equivalent to root shell access on the server.
- TINKER-RULE-011: **Use `Artisan::call()` programmatically** for automated or CI tasks.
