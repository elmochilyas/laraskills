# Rules: Stub Customization in Laravel

## Metadata
- **Source KU:** stub-customization-laravel
- **Subdomain:** Code Generation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- STUB-RULE-001: **Version-control stubs** — Stub changes affect all future generated code; review in PRs like code.
- STUB-RULE-002: **Keep stubs generic** — Stubs are structural templates, not business logic containers.
- STUB-RULE-003: **Use traits for behavior** — Stubs add imports and traits; traits define the actual behavior.
- STUB-RULE-004: **Test stub output** — Run `make:` commands and verify generated files after stub changes.
- STUB-RULE-005: **Document conventions** — Tell the team what conventions are encoded in stubs.
- STUB-RULE-006: **Diff after upgrades** — Compare old vs new vendor stubs after Laravel upgrades to port changes.

## Architecture Rules
- STUB-RULE-007: **Publish stubs once** — Manage via version control; never re-publish over customizations.
- STUB-RULE-008: **Organize in `stubs/`** with descriptive names: `stubs/model.stub`, `stubs/controller.stub`.
- STUB-RULE-009: **Keep stubs simple** — Placeholders for variables, not control structures.
- STUB-RULE-010: **Use `declare(strict_types=1)`** via stubs to enforce strict typing across all generated code.

## Decision Rules
- STUB-RULE-011: **Use when enforcing team coding standards** — Type hints, docblocks, `declare(strict_types=1)`.
- STUB-RULE-012: **Use when adding project-specific boilerplate** — Base classes, traits, interfaces to all generated classes.
- STUB-RULE-013: **Don't use for business logic** — Stubs are structural templates, not business logic containers.
