# Rules: Model PHPDoc Generation

## Metadata
- **Source KU:** model-phpdoc-generation
- **Subdomain:** Developer Tooling
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- MODELDOC-RULE-001: **Run ide-helper:models** — Generates `@property` and `@method` annotations for Eloquent model columns and relationships.
- MODELDOC-RULE-002: **Dev dependency only** — `require-dev`. No runtime impact.
- MODELDOC-RULE-003: **Inline vs separate** — Use `--write` for inline annotations (visible in diffs). Use separate `_ide_helper_models.php` for clean models.
- MODELDOC-RULE-004: **Pre-requisite for PHPStan** — Model PHPDoc enables accurate static analysis of model properties and relationships.

## Architecture Rules
- MODELDOC-RULE-005: **@property annotations** — Document DB columns: `@property int $id`, `@property string $email`.
- MODELDOC-RULE-006: **Relationship annotations** — `@property-read Collection|Post[] $posts` for relationship type inference.
- MODELDOC-RULE-007: **Doctrine DBAL** — Required for reading database schema. Ensure DB connection is available.

## Decision Rules
- MODELDOC-RULE-008: **Use for all Laravel projects using Eloquent** for IDE autocompletion and static analysis.
- MODELDOC-RULE-009: **Not needed** for projects without Eloquent or in CI/production environments.
