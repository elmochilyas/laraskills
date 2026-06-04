# Rules: Blueprint Code Generation

## Metadata
- **Source KU:** blueprint-code-generation
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- BPGEN-RULE-001: **Version control the draft** — `draft.yaml` is the authoritative specification. Commit it, review changes in PRs.
- BPGEN-RULE-002: **Review generated code** — Always review generated migrations and controllers before committing.
- BPGEN-RULE-003: **Use `--only` flag** — Limit generation scope with `--only=model,migration` when not everything is needed.
- BPGEN-RULE-004: **Iterate in VCS** — Generate, customize, commit; regenerate only from updated draft, not over customizations.
- BPGEN-RULE-005: **Validate in CI** — `php artisan blueprint:validate` ensures the DSL is well-formed before generation.

## Architecture Rules
- BPGEN-RULE-006: **Keep draft.yaml at project root** — Override with `--path` if needed.
- BPGEN-RULE-007: **Resource controllers for web apps** — API controllers for API-first apps.
- BPGEN-RULE-008: **Generate form requests** — Let Blueprint generate validation by default.
- BPGEN-RULE-009: **Business logic in service classes** — Generated controllers stay thin; add logic separately.

## Decision Rules
- BPGEN-RULE-010: **Use for new Laravel projects** to scaffold initial application structure.
- BPGEN-RULE-011: **Use for CRUD-heavy apps** with standard patterns.
- BPGEN-RULE-012: **Don't use for existing projects** with established code that doesn't match Blueprint conventions.
- BPGEN-RULE-013: **Don't use for apps with highly custom business logic** beyond CRUD.
