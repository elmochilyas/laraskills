# Rules: Custom Artisan Make Commands

## Metadata
- **Source KU:** custom-artisan-make-commands
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CUSTMAKE-RULE-001: **Extend GeneratorCommand** — Get namespace detection, file checks, and stub processing for free.
- CUSTMAKE-RULE-002: **Use $rootNamespace** — Never hard-code `App\`. Respect the project's actual namespace.
- CUSTMAKE-RULE-003: **Respect `--force`** — Follow Laravel convention for overwriting existing files.
- CUSTMAKE-RULE-004: **Prefix custom placeholders** — Use `{{ dtoParent }}` instead of `{{ parent }}` to avoid collisions.
- CUSTMAKE-RULE-005: **Keep stubs simple** — Use placeholders for variables, not control structures.
- CUSTMAKE-RULE-006: **Version-control stubs** — Stub changes affect all future generated code; review in PRs.

## Architecture Rules
- CUSTMAKE-RULE-007: **Store custom stubs in `/stubs`** directory (version-controlled).
- CUSTMAKE-RULE-008: **Ship stubs within package** for package generators, reference with `__DIR__`.
- CUSTMAKE-RULE-009: **Override rootNamespace()** for test generators returning `Tests` namespace.
- CUSTMAKE-RULE-010: **Provide `--namespace` option** override for non-standard namespace targets.

## Decision Rules
- CUSTMAKE-RULE-011: **Use for patterns appearing 10+ times** — DTOs, Actions, Services following the same structure.
- CUSTMAKE-RULE-012: **Skip for one-off classes** — Manual creation is simpler than building a generator.
- CUSTMAKE-RULE-013: **Skip for highly variable structures** — Stubs can't express all variations.
