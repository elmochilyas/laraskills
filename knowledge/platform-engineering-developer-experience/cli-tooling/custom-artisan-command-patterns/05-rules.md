# Rules: Custom Artisan Command Patterns

## Metadata
- **Source KU:** custom-artisan-command-patterns
- **Subdomain:** CLI Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CAC-RULE-001: **Single responsibility** — Each command does one thing; splits complex workflows into focused commands.
- CAC-RULE-002: **Service delegation** — `handle()` delegates to service classes for business logic; commands focus on I/O.
- CAC-RULE-003: **Explicit exit codes** — Always `return 0` on success, `return 1` on failure for CI/CD and scripting.
- CAC-RULE-004: **Idempotent design** — Check state before acting; report "nothing to do" instead of erroring.
- CAC-RULE-005: **Handle injection** — Accept services via `handle()` for testability with `$this->artisan()` assertions.
- CAC-RULE-006: **`__invoke()` for simple commands** — Use Laravel 11+ closure syntax for one-off commands.

## Architecture Rules
- CAC-RULE-007: **Keep commands in `App\Console\Commands`** namespace by default.
- CAC-RULE-008: **Register via `$commands` array** in small apps; use `load()` for modular/multi-package apps.
- CAC-RULE-009: **Constructor injection** for shared dependencies (loggers, config); handle injection for per-command services.
- CAC-RULE-010: **Never use `die()`, `exit()`, or `dd()`** in commands — always return exit codes.

## Decision Rules
- CAC-RULE-011: **Use for automating repetitive dev tasks and creating CLI interfaces for app features.**
- CAC-RULE-012: **Use `routes/console.php`** for simple one-off closures instead of full command classes.
- CAC-RULE-013: **Use queue workers or scheduler** for operations better handled by those mechanisms.
