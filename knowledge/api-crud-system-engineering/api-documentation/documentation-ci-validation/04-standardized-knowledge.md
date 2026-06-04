# ECC Standardized Knowledge — Documentation CI Validation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Documentation CI Validation |
| Difficulty | Intermediate |
| Category | CI/CD / Documentation |
| Last Updated | 2026-06-02 |

## Overview

Documentation CI validation automatically verifies API documentation quality, completeness, and accuracy in CI. Validation rules ensure documentation does not regress, all endpoints are documented, schemas match implementation, and breaking changes are surfaced before deployment — preventing silent doc drift.

## Core Concepts

- **Spec validation**: Syntax, structure, and OpenAPI compliance via tools like Redocly CLI or Spectral.
- **Completeness checks**: Every endpoint has summary, description, documented parameters, and error responses.
- **Breaking change detection**: Compare spec versions for removed paths, changed types, new required fields.
- **Contract testing**: Verify actual API responses match documented schemas (Dredd, Schemathesis).
- **Quality gate**: Block PRs that degrade documentation below configurable thresholds.

## When To Use

- Every API with a published OpenAPI spec
- Public APIs consumed by external developers
- APIs generating SDKs from their spec (spec accuracy is critical)
- CI pipelines where documentation is part of the deliverable

## When NOT To Use

- Prototype/experimental APIs with no external consumers
- Documentation maintained separately from code (no spec to validate)
- APIs without formal documentation pipeline

## Best Practices

- **Lint on every PR**: Fast (1-10 seconds), catches syntax and structural issues.
- **Breaking change detection on PRs**: Compare against latest released spec. Block breaking changes without version bump.
- **Contract tests nightly or on merge**: Slower but ensure schema accuracy. Run subset on every PR.
- **Custom rules for team standards**: Enforce operationId uniqueness, summary presence, error response documentation.
- **Required changelog check**: PRs modifying API routes must include changelog entry.
- **Documentation quality badge**: Show docs validation status in repository README.
- **Store spec as CI artifact**: Publish validated spec with each build for traceability.

## Architecture Guidelines

- Pipeline stages: lint → breaking change diff → completeness check → contract tests.
- Lint checks block PRs. Contract test failures block deployment.
- For auto-generated specs (Scramble), validate the generator output.
- For manually maintained specs, validate the spec file directly.
- Archive each version's spec for historical diff comparisons.

## Performance Considerations

- Spec lint: 1-10 seconds. Breaking change diff: 5-30 seconds.
- Contract tests: 30s-5min per endpoint. Run full suite nightly; run subset on each PR.
- Full validation for 100 endpoints: 2-10 minutes.

## Security Considerations

- Spec exposes full API surface. Protect generated specs if API is internal.
- Do not commit real credentials in contract test configurations.
- Review custom validation rules for security-relevant documentation gaps.

## Common Mistakes

- **No documentation validation**: Docs silently drift until entirely wrong.
- **Only syntax validation**: Validity ≠ completeness. Add content rules.
- **No breaking change detection**: Breaking changes discovered after deployment.
- **Contract tests only for happy path**: Error response schemas never validated.
- **Validation as bottleneck**: 15-minute checks cause developers to bypass. Split fast/slow checks.

## Anti-Patterns

- **False positive breaking changes ignored**: Developer ignores warnings due to noise, missing real breaks.
- **Stale contract test environment**: Tests pass against stale data but fail in production.

## Examples

- Redocly lint: `npx @redocly/cli lint openapi.yaml --ruleset=recommended`.
- Breaking change: `npx @redocly/cli compare openapi-latest.yaml openapi.yaml`.
- Contract test: `dredd openapi.yaml http://localhost:8000 --hookfiles=./dredd-hooks/*.js`.

## Related Topics

- **Prerequisites**: OpenAPI Spec Generation, CI/CD Pipeline Basics
- **Closely Related**: Endpoint Documentation Content, Changelog Generation, Breaking Change Identification
- **Advanced**: Custom Redocly rules, contract testing strategies, documentation quality metrics

## AI Agent Notes

When generating CI validation config: lint spec on every PR (syntax + completeness), run breaking change detection against previous version, validate changelog presence for route changes, contract-test error responses not just happy path, block PRs on validation failures.

## Verification

Sources: Redocly CLI docs, Spectral docs, Dredd docs, GitHub Actions workflows, domain-analysis.md.
