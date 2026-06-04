# ECC Standardized Knowledge — Backward Compatibility Policy

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Backward Compatibility Policy |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Backward compatibility policy defines what changes are considered safe (non-breaking) versus breaking in an API. It provides clear rules for adding fields, parameters, and endpoints without breaking existing consumers. The policy enables API evolution while maintaining consumer trust through additive-only change principles, automated OpenAPI diffing, and contract testing in CI.

## Core Concepts

- **Additive-only changes**: New fields, endpoints, parameters can be added without breaking consumers.
- **Breaking change**: Any modification causing existing consumer requests or responses to fail or change behavior unexpectedly.
- **Tolerant reader principle**: Consumers should ignore unknown fields; servers should ignore unknown parameters.
- **Contract testing**: Automated tests verifying backward compatibility between API versions.
- **Semantic versioning for APIs**: MAJOR = breaking changes, MINOR = additive changes, PATCH = fixes.
- **Deprecation before removal**: Field/endpoint must be deprecated before removal.

## When To Use

- Every public API with external consumers
- APIs with versioning and release management
- CI/CD pipelines where API changes are validated
- Multi-team environments needing consistent compatibility rules

## When NOT To Use

- Internal-only APIs with co-located consumer teams
- Prototype APIs explicitly documented as unstable
- Emergency security fixes requiring immediate breaking change

## Best Practices

- **Automated OpenAPI diffing in CI**: Compare new spec against previous version; reject PRs with breaking changes without deprecation plan.
- **Classify every change**: Additive, evolutive, or breaking using decision tree.
- **Postel's Law**: Be conservative in what you send, liberal in what you accept.
- **Expansion points**: Use maps, lists, optional fields that can grow without breaking.
- **Semantic breakage review**: Automated tools cannot detect meaning changes. Human review required.
- **Never change defaults**: Changing default `per_page` from 100 to 20 breaks consumers not specifying it.

## Architecture Guidelines

- Breaking changes require MAJOR version bump + deprecation window.
- Contract tests run existing consumer request/response fixtures against new spec.
- Maintain previous OpenAPI spec as reference for at least 2 versions.
- Deprecate old field + add new field rather than renaming (renaming breaks deserialization).
- Enum additions are non-breaking if server handles unknown values gracefully.

## Performance Considerations

- OpenAPI diffing in CI adds 5-15 seconds per run.
- Contract tests running fixtures add 30-60 seconds — cache fixture data.
- Tolerant deserialization has zero runtime cost in most JSON parsers.

## Security Considerations

- Security fixes that break compatibility may bypass standard deprecation window.
- Semantic breakage of security-related fields (e.g., changing auth response format) is especially dangerous.
- Log when consumer sends request that would break under newer spec for proactive alerting.

## Common Mistakes

- Adding new required field to request body (breaks all existing callers).
- Changing semantic meaning of existing field without changing name.
- Making optional field required after introduction.
- Removing enum value without deprecation.
- Thinking field type changes (int to string) are safe if values look similar.

## Anti-Patterns

- **Silent breaking change**: Field type changes that parsers silently coerce. Caught only by strict contract testing.
- **Consumer reliance on bug behavior**: Bug fix changes observable output consumers depend on.
- **Versionless APIs with breaking changes**: Same version endpoint changes behavior without version bump.

## Examples

- Safe additive change: Adding optional `middle_name` field to response.
- Breaking change: Adding required `department_id` field to existing POST /users request.
- Deprecation path: Add `new_field`, deprecate `old_field`, remove after migration window.

## Related Topics

- **Prerequisites**: API Style Guide Documentation, Deprecation Policy Design
- **Closely Related**: Breaking Change Process, Team API Consistency Rules
- **Advanced**: Automated OpenAPI diff tools (oas-diff, spectral), Consumer-aware compatibility testing, Multi-version compatibility matrices

## AI Agent Notes

When defining backward compatibility: classify changes as additive/evolutive/breaking, run automated OpenAPI diff in CI, require deprecation plan for breaking changes, review semantic breakage manually, never change defaults, never add required fields to existing endpoints, use expansion points for future growth.

## Verification

Sources: Google AIP-180 (Backward Compatibility), Stripe compatibility policy, Martin Fowler's Tolerant Reader, domain-analysis.md.
