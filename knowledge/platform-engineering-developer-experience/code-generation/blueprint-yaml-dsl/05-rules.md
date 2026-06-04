# Rules: Blueprint YAML DSL

## Metadata
- **Source KU:** blueprint-yaml-dsl
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- BPYAML-RULE-001: **Use explicit relationships for non-standard FKs** — Auto-inference fails with non-standard FK names.
- BPYAML-RULE-002: **Validate before building** — Run `php artisan blueprint:validate` to catch YAML errors.
- BPYAML-RULE-003: **Keep models singular** — `User`, `Post`, `Comment` — Blueprint expects singular names.
- BPYAML-RULE-004: **Don't specify `id`** — Blueprint auto-generates auto-incrementing `id` by default.
- BPYAML-RULE-005: **Use `timestamps: false` deliberately** — Disable only on models that genuinely don't need them.
- BPYAML-RULE-006: **Group related models** — Organize YAML with logical grouping for readability.

## Architecture Rules
- BPYAML-RULE-007: **Start with models, then controllers** — Models first for data structure, controllers for CRUD.
- BPYAML-RULE-008: **Use `api: true`** on controllers for API-only apps (excludes `create`/`edit` views).
- BPYAML-RULE-009: **Utility/value objects** as models without controller sections.
- BPYAML-RULE-010: **Treat draft.yaml as source code** — Reviewed in PRs, committed to VCS.

## Decision Rules
- BPYAML-RULE-011: **Use DSL for data model definition before writing PHP** — Document architecture in machine-readable format.
- BPYAML-RULE-012: **Don't use for business logic** — DSL is for data structure, not behavior.
