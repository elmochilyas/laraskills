# Rules: Custom Pint Rules

## Metadata
- **Source KU:** custom-pint-rules
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CUSTPIN-RULE-001: **Start with preset, add minimal overrides** — 3-5 custom rules for strong opinions.
- CUSTPIN-RULE-002: **Document each rule's rationale** — Explain why a rule exists in CONTRIBUTING.md.
- CUSTPIN-RULE-003: **Avoid conflicting rules** — Two rules modifying the same aspect produce unexpected results.
- CUSTPIN-RULE-004: **Test rules on codebase** — Run `pint --test` after adding rules to verify behavior.
- CUSTPIN-RULE-005: **Lock Pint version** — Custom rules depend on specific PHP-CS-Fixer behavior.

## Architecture Rules
- CUSTPIN-RULE-006: **Define custom rules in pint.json `rules` section**.
- CUSTPIN-RULE-007: **Custom fixers** — PSR-4 autoloadable, registered via Pint extensions.
- CUSTPIN-RULE-008: **Exclude generated files** — Use `notPath`/`notName` for custom rule application.
- CUSTPIN-RULE-009: **Per-directory rules** — Use nested `pint.json` files.

## Decision Rules
- CUSTPIN-RULE-010: **Skip custom rules** when preset defaults are acceptable.
- CUSTPIN-RULE-011: **Skip custom fixers** when heavy maintenance outweighs marginal formatting benefit.
