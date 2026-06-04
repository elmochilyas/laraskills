# Rules: Config File Merging & Publishing

## Metadata
- **Source KU:** config-file-merging-publishing
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CONFIG-RULE-001: **mergeConfigFrom() in register()** — Always call in `register()`, never `boot()`. Config merged in `boot()` is unavailable to other providers during boot.
- CONFIG-RULE-002: **Tagged publishing** — Always use tagged publishing (`--tag=package-name-config`) so consumers can publish config independently.
- CONFIG-RULE-003: **Sensible defaults** — Package should work without publishing the config file. Every option must have a safe default.
- CONFIG-RULE-004: **env() only in published config** — Never use `env()` in unpublished default config files. `env()` may produce unexpected results when config is cached.
- CONFIG-RULE-005: **Unique config namespace** — Use package name as prefix: `config('my-package.driver')`, not `config('driver')`.

## Architecture Rules
- CONFIG-RULE-006: **Config file location** — Place at `config/package-name.php` in package root. Spatie tools' `hasConfigFile()` auto-discovers this.
- CONFIG-RULE-007: **Key conventions** — Use snake_case keys with dot-notation hierarchy for related options.
- CONFIG-RULE-008: **Namespace choice** — Single file for packages with < 20 options. Multiple files for complex packages with separable configuration domains.

## Security Rules
- CONFIG-RULE-009: **No secrets in defaults** — Never put API keys, passwords in config defaults. Use `env()` calls with fallback.
- CONFIG-RULE-010: **Sensitive config env() only** — Sensitive options should use `env()` with no fallback to force explicit configuration.

## Common Mistakes
- CONFIG-RULE-011: **env() staleness** — `env()` calls in unpublished config are evaluated during merge. When `config:cache` runs, values become stale. Only use `env()` in published files.
- CONFIG-RULE-012: **Config key collisions** — Two packages using the same top-level key will conflict. Always namespace with package name.

## Anti-Pattern Rules
- CONFIG-RULE-013: **Avoid no defaults** — Creating config options with no defaults that must all be set creates poor onboarding.
- CONFIG-RULE-014: **Avoid env() in business logic** — Access config through `config('package.key')`, not `env()` directly. Bypasses caching.
- CONFIG-RULE-015: **Avoid deeply nested config** — 4-5 levels of nested arrays makes override difficult. Keep it shallow.
