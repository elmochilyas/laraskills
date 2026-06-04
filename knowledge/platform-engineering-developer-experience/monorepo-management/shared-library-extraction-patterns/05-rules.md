# Rules: Shared Library Extraction Patterns

## Metadata
- **Source KU:** shared-library-extraction-patterns
- **Subdomain:** Monorepo Management
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- EXTRACT-RULE-001: **Apply the rule of three** — Extract after code is used in at least three places. Three usages provide enough pattern confidence for a stable API.
- EXTRACT-RULE-002: **Extract tests with code** — Without tests, extracted library is untrusted. Always migrate tests alongside source.
- EXTRACT-RULE-003: **Minimize public API** — Expose only what other packages need. Mark rest `@internal`. Each public method is a backward-compatibility promise.
- EXTRACT-RULE-004: **Extract technical infrastructure, not business logic** — Validation rules, DTOs, traits, helpers, commands. Business logic varies by app.
- EXTRACT-RULE-005: **Document the migration path** — Include before/after code examples, config changes, and upgrade scripts.

## Architecture Rules
- EXTRACT-RULE-006: **Discovery phase** — Scan for repeated patterns using static analysis. Look for exact and near-duplicates.
- EXTRACT-RULE-007: **Extraction phase** — Create package in `packages/shared/` (monorepo) or new repo. Include composer.json, tests, README.
- EXTRACT-RULE-008: **Integration phase** — Replace original code with `composer require`. Update imports and registrations. Run full test suite.
- EXTRACT-RULE-009: **Deprecation phase** — After all consumers migrate, remove original code. Maintain aliases for one cycle if needed.
- EXTRACT-RULE-010: **Package granularity** — Start coarser, split later. DTOs + validation in one package is fine initially.

## Implementation Rules
- EXTRACT-RULE-011: **Extracted library should be as simple as inlined code was** — Don't over-abstract with interfaces and factories during extraction.
- EXTRACT-RULE-012: **Follow SemVer strictly** — Extracted library has a public API consumers depend on. Deprecate in MINOR, remove in MAJOR.

## Security Rules
- EXTRACT-RULE-013: **Scan all shared libraries for vulnerable dependencies** — Vulnerability in shared lib affects all consuming applications.
- EXTRACT-RULE-014: **Private Composer repository** — Internal shared libraries in private Packagist/Satis. Never publish to public Packagist.

## Common Mistakes
- EXTRACT-RULE-015: **Extracting too early** — API changes multiple times. Churn for consumers. Wait for 2-3 independent usages.
- EXTRACT-RULE-016: **Over-abstracting during extraction** — Adding interfaces and factories the original code didn't have. Complexity without proven need.
- EXTRACT-RULE-017: **Not maintaining backward compatibility** — Changing public API in patch version breaks consumers.
- EXTRACT-RULE-018: **Forgetting to extract tests** — Untrusted library with no regression protection.

## Anti-Pattern Rules
- EXTRACT-RULE-019: **Avoid grand unified library** — One massive "common" package with everything. Leads to tight coupling. Extract focused packages.
- EXTRACT-RULE-020: **Avoid copy-paste library** — Started as copied code and never evolved. Extract properly with path repos from day one.
- EXTRACT-RULE-021: **Avoid abandoned extraction** — No maintainer, tests, or documentation. Becomes technical debt in package form.
- EXTRACT-RULE-022: **Avoid business logic library** — Application-specific logic that never generalizes. Can't change because other apps depend.
