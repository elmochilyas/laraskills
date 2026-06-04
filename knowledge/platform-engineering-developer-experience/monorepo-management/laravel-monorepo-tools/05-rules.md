# Rules: Laravel Monorepo Tools

## Metadata
- **Source KU:** laravel-monorepo-tools
- **Subdomain:** Monorepo Management
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- MONOTOOL-RULE-001: **Use Composer path repos for development** — Symlink local packages in monorepo root composer.json for real-time cross-package feedback.
- MONOTOOL-RULE-002: **Implement change-detection testing** — Test only changed packages and their dependents. Without it, CI takes 10-50x longer.
- MONOTOOL-RULE-003: **Automate splits on tags** — Tag-based splits (not commit-based) keep operations intentional and infrequent.
- MONOTOOL-RULE-004: **Enforce acyclic package dependencies** — Circular deps create unresolvable dependency graphs. Validate in CI.
- MONOTOOL-RULE-005: **Independent package versioning** — Each package has its own version independent of monorepo root.

## Architecture Rules
- MONOTOOL-RULE-006: **Package directory layout** — `/packages/{package-name}` convention. Each has own composer.json, tests, source.
- MONOTOOL-RULE-007: **Split configuration** — `monorepo-builder.php` defines directory-to-repository mappings.
- MONOTOOL-RULE-008: **CI pipeline** — Detect changed packages → run changed tests → integration tests → on tag push, split to package repos.
- MONOTOOL-RULE-009: **Release process** — Tag in monorepo → CI validates → CI runs split → Split repos update → Split repo CI → Packagist publication.

## Security Rules
- MONOTOOL-RULE-010: **Authentication for splits** — Use deploy keys per repository or machine user with scoped tokens. Store as CI secrets.
- MONOTOOL-RULE-011: **Code review** — All monorepo changes go through PR review. Split repos are derived artifacts—never commit directly.

## Common Mistakes
- MONOTOOL-RULE-012: **Not using path repositories in development** — Slow feedback loop, frustrating cross-package development.
- MONOTOOL-RULE-013: **Circular package dependencies** — Composer resolution fails, split operations break.
- MONOTOOL-RULE-014: **Oversized monorepo** — Including unrelated projects. Slow clones, complex CI, hard to navigate.
- MONOTOOL-RULE-015: **Forgetting to split before release** — Split repos outdated, consumers can't install latest versions.

## Anti-Pattern Rules
- MONOTOOL-RULE-016: **Avoid monolith monorepo** — Everything in single directory, not structured as packages. Lose all benefits.
- MONOTOOL-RULE-017: **Avoid split-free monorepo** — Packages exist but never split. Can't be consumed independently.
- MONOTOOL-RULE-018: **Avoid manual split** — Engineer manually copies files. Error-prone and time-consuming. Automate.
