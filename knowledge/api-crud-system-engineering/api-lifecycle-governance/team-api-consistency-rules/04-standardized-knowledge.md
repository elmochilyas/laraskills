# ECC Standardized Knowledge — Team API Consistency Rules

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Team API Consistency Rules |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Team API consistency rules define the conventions, naming standards, and code review checklists that ensure all APIs across teams follow a uniform design. Consistency reduces cognitive load for consumers, simplifies onboarding, and enables automated tooling that works across all services. Rules are documented as both human-readable Markdown and machine-enforceable Spectral rules with a maximum of 30 active rules.

## Core Concepts

- **Naming conventions**: Standardized patterns for resource names, field names, endpoint paths, and query parameters.
- **Code review checklist**: Structured list of consistency checks applied to every API change PR.
- **Design review board**: Lightweight approval process for new endpoint designs before implementation.
- **Automated linting**: Spectral rules validating OpenAPI specs against team conventions in CI.
- **Consistency score**: Metric tracking how many rules each service's API complies with.
- **Gradual enforcement**: New rules are recommended for 1 month, then required.

## When To Use

- Multi-team organizations building multiple APIs
- APIs sharing common consumers who benefit from uniform design
- New projects where consistency is established from the start
- Teams onboarding new members frequently

## When NOT To Use

- Single-developer APIs with no external consumers
- Prototype/experimental APIs
- APIs with fundamentally different design requirements (e.g., real-time vs CRUD)

## Best Practices

- **Style guide as code**: Store conventions as both human-readable document and Spectral rule files.
- **Design review before implementation**: Review OpenAPI spec change before writing code — cheaper to fix.
- **Consistency champion rotation**: Rotate team member as consistency champion each sprint.
- **Named authority list**: Pre-approved names for common resources to prevent bike-shedding.
- **Rule cap**: Maximum 30 active rules; remove one when adding one to prevent bloat.
- **Rule expiration**: Exceptions require 2-sentence justification in PR description and expire after 3 months.

## Architecture Guidelines

- Conventions stored as Markdown in repo + Spectral rules for CI enforcement.
- Peer review for endpoint changes; board review for new services.
- Blocking enforcement in CI for naming; advisory enforcement for design patterns.
- Rules versioned with changelog and effective dates.
- Sub-conventions allowed per team but must not contradict global conventions.

## Performance Considerations

- Spectral linting runs in CI under 10 seconds for most OpenAPI specs.
- Design review is human process — allocate 30-60 minutes.
- Consistency scoring is scheduled batch job running overnight.

## Security Considerations

- Consistency rules must not override security requirements (e.g., auth on every endpoint).
- Naming must not expose internal infrastructure details.
- Automated linting can enforce security header presence consistently.

## Common Mistakes

- Having conventions too vague ("use good names") to enforce.
- Creating conventions without automated validation (ignored over time).
- Over-constraining design (every endpoint looks identical regardless of purpose).
- Not updating conventions when team adopts new patterns.
- Enforcing internal-only API consistency as strictly as public APIs.

## Anti-Patterns

- **Rule bloat without removal**: Too many rules -> everyone ignores them. Cap at 30.
- **Contradictory rules**: Two rules conflict (use UUIDs vs use auto-increment). Track dependencies.
- **No enforcement mechanism**: Guide becomes aspirational rather than actionable.

## Examples

- Spectral rule: `rule: field-naming-convention: given: $.properties.*, then: field: @key, function: casing, functionOptions: type: snake_case`.
- Consistency score metric: `GET /internal/consistency-score returns { score: 85, passed: 26, failed: 4, total: 30 }`.

## Related Topics

- **Prerequisites**: API Style Guide Documentation, Backward Compatibility Policy
- **Closely Related**: ADR Process for APIs, API Audit Review Process
- **Advanced**: Spectral custom rule development, Multi-service consistency scoring dashboards, Automated API design review using LLMs

## AI Agent Notes

When defining team consistency rules: document as both human-readable Markdown and Spectral rules, enforce naming conventions in CI (highest impact), use design review before implementation, cap rules at 30, rotate consistency champion, expire exceptions after 3 months, use gradual enforcement (recommended -> required).

## Verification

Sources: Zalando RESTful API Guidelines, Google API Style Guide, Microsoft REST API Guidelines, domain-analysis.md.
