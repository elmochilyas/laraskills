# Rules: PHPStan NEON Configuration

## Metadata
- **Source KU:** phpstan-neon-configuration
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- NEON-RULE-001: **Use separate baseline file** — `includes: [phpstan-baseline.neon]` avoids inline mess.
- NEON-RULE-002: **Layered config** — Base + CI + local (gitignored) for environment flexibility.
- NEON-RULE-003: **Portable paths** — Use `%rootDir%`, `%currentWorkingDirectory%` constants.
- NEON-RULE-004: **Tag custom rules properly** — `tags: [phpstan.rules.rule]` for proper registration.
- NEON-RULE-005: **Separate baseline file** — Enables clean regeneration with `--generate-baseline`.

## Architecture Rules
- NEON-RULE-006: **Single file for simple projects**; includes hierarchy for complex ones.
- NEON-RULE-007: **Baseline as separate file** managed by `--generate-baseline`.
- NEON-RULE-008: **Local overrides** in `.gitignore`d `phpstan.local.neon`.
- NEON-RULE-009: **CI config** should include the same rules as local.

## Decision Rules
- NEON-RULE-010: **Use NEON over YAML** when registering services, extensions, or using PHP constant resolution.
- NEON-RULE-011: **Use separate baseline file always** — never inline baseline in main config.
