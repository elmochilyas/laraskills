# Rules: Coding Standards Documentation

## Metadata
- **Source KU:** coding-standards-documentation
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CSDOC-RULE-001: **Don't repeat Pint documentation** — Focus on what automation cannot enforce. Reference Pint config; don't duplicate it.
- CSDOC-RULE-002: **Show examples of good and bad code** — "Controllers should be thin" is ambiguous. Show thin vs fat with specific guidance.
- CSDOC-RULE-003: **Provide rationale for each standard** — Explain why so developers understand and buy in.
- CSDOC-RULE-004: **Enforce with CI what can be enforced** — Reserve human review for architectural patterns and logic.
- CSDOC-RULE-005: **Review and update quarterly** — Remove outdated conventions, add new practices based on team experience.

## Architecture Rules
- CSDOC-RULE-006: **Document location:** `docs/standards.md` — Not bloating CONTRIBUTING.md. CONTRIBUTING.md links to it.
- CSDOC-RULE-007: **Structure by file type:** Controllers, Models, Migrations, Tests with good/bad examples.
- CSDOC-RULE-008: **Enforcement levels:** Blocking (CI fails) for automated rules. Advisory (review flags) for architectural patterns.
- CSDOC-RULE-009: **Document length:** 5-10 pages. Longer docs are not read.

## Decision Rules
- CSDOC-RULE-010: **Use when team has 3+ developers** and PRs frequently include style/pattern feedback.
- CSDOC-RULE-011: **Use for onboarding** — New members need to learn "how we write code here" quickly.
- CSDOC-RULE-012: **Skip for single developer or pair programming** — Implicit alignment is sufficient.
