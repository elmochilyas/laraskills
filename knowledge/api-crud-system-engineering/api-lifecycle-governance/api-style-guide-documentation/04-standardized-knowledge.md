# ECC Standardized Knowledge — API Style Guide Documentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | API Style Guide Documentation |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

The API style guide is a living document that defines the design conventions, naming patterns, error formats, pagination strategies, and other standards that all APIs must follow. It serves as the authoritative reference for API designers, developers, and reviewers. Rules are classified with RFC 2119 keywords (MUST/SHOULD/MAY) and include rationale, positive examples, and negative examples. The guide is version-controlled alongside Spectral enforcement rules.

## Core Concepts

- **Convention categories**: Naming, URLs, request/response formats, error handling, pagination, versioning, authentication, rate limiting.
- **Positive and negative examples**: Each convention includes both correct (positive) and incorrect (negative) examples.
- **Rationale**: Every convention includes why explaining the reasoning behind the rule.
- **RFC 2119 keywords**: MUST (required), SHOULD (recommended), MAY (optional) — clear enforcement levels.
- **Review checklist**: Distilled version used in code reviews.
- **Decision log**: Link each style rule to the ADR that established it.

## When To Use

- Organizations building multiple APIs
- Teams with multiple developers
- New projects establishing consistent practices
- Public APIs needing predictable consumer experience

## When NOT To Use

- Single-developer projects
- Prototype/experimental APIs
- APIs retired or in maintenance-only mode

## Best Practices

- **Opinionated rather than comprehensive**: Clearly state "use snake_case for fields" rather than discussing tradeoffs.
- **Style guide as code**: Store in repo as Markdown alongside Spectral enforcement rules in CI.
- **Example-driven documentation**: Every rule has "Good" and "Bad" examples.
- **Rule classification**: Each rule tagged MUST, SHOULD, or MAY for enforcement clarity.
- **Guide updates via PR**: Anyone can propose changes with rationale and examples.
- **Deprecation path for old conventions**: When rule changes, old rule deprecated with migration guidance.

## Architecture Guidelines

- Format: Markdown in repo, published as HTML on developer portal.
- Must include: rationale, positive example, negative example, RFC 2119 keyword per rule.
- Spectral rules enforce machine-checkable conventions in CI.
- Internal implementation details in separate section (not published to public).
- Reviewed quarterly minor updates, annual major revision.
- Rule exceptions require ADR with explicit override rationale, expire after 12 months.

## Performance Considerations

- Style guide is a static document — no runtime performance impact.
- Spectral rule enforcement adds < 10 seconds to CI pipeline.
- Style guide review: allocate 30-60 minutes per review.

## Security Considerations

- Style guide should include security conventions (auth, encryption, rate limiting).
- Internal implementation details must not be published in public style guide.
- Security rules are MUST-level (non-negotiable).
- Review style guide for accidental exposure of infrastructure details.

## Common Mistakes

- Writing generic guide ("follow REST principles") without specific conventions.
- Not updating guide when conventions change (outdated guide worse than no guide).
- No enforcement mechanism — guide becomes aspirational.
- Writing only for internal developers, ignoring that external consumers may read it.
- Guide too rigid — no room for justifiable exceptions.

## Anti-Patterns

- **No enforcement linkage**: Guide says one thing, automated rules enforce another.
- **No rationale**: Rules without why are followed inconsistently and challenged frequently.
- **Guide abandonment**: Outdated guide that nobody follows. Assign rotating steward.

## Examples

- Rule format: `### [MUST] Field naming [snake_case] - Rationale: Consistent with Laravel convention. - Good: user_name, created_at - Bad: userName, CreatedAt`.
- Review checklist: `[ ] Field names use snake_case? [ ] Endpoint paths use kebab-case? [ ] Error responses use standard format?`.
- Spectral rule: `rule: field-naming-convention: given: $.properties.*, then: field: @key, function: casing, functionOptions: type: snake_case`.

## Related Topics

- **Prerequisites**: Team API Consistency Rules, Backward Compatibility Policy
- **Closely Related**: ADR Process for APIs, API Audit Review Process
- **Advanced**: Automated style guide rule generation from traffic patterns, Style guide localization, Interactive style guide with live API examples

## AI Agent Notes

When creating API style guide: be opinionated not comprehensive, provide rationale + positive/negative examples for every rule, use RFC 2119 keywords (MUST/SHOULD/MAY), enforce via Spectral in CI, version in repository with changelog, update quarterly, assign rotating steward, link rules to ADRs.

## Verification

Sources: Google API Style Guide, Microsoft REST API Guidelines, Zalando RESTful API Guidelines, Heroku API Design Guide, domain-analysis.md.
