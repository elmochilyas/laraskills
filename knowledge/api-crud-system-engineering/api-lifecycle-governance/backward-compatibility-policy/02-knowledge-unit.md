# Backward Compatibility Policy

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Backward compatibility policy defines what changes are considered safe (non-breaking) versus breaking in an API. It provides clear rules for adding fields, parameters, and endpoints without breaking existing consumers. The policy enables API evolution while maintaining consumer trust through additive-only change principles.

## Core Concepts
- **Additive-Only Changes:** New fields, endpoints, and parameters can be added without breaking existing consumers.
- **Breaking Change:** Any modification that would cause an existing consumer request or response to fail or change behavior unexpectedly.
- **Compatible Field Addition:** New optional fields in responses are safe; new required fields are breaking.
- **Tolerant Reader Principle:** Consumers should ignore unknown fields; servers should ignore unknown parameters.
- **Contract Testing:** Automated tests that verify backward compatibility between API versions.
- **Deprecation Before Removal:** A field or endpoint must be deprecated before it can be removed.

## Mental Models
- **House Extension:** Adding a new room (field) to a house does not break existing rooms. But removing a load-bearing wall (required field) collapses the structure.
- **Restaurant Menu:** You can add new dishes (endpoints) without affecting existing ones. Renaming or removing a dish breaks the menu the customer already knows.

## Internal Mechanics
1. **Change Classification:** Every API change is classified as additive, evolutive, or breaking using a decision tree.
2. **OpenAPI Diffing:** Automated tooling compares the new OpenAPI spec against the previous version.
3. **Breaking Change Gate:** CI rejects PRs that introduce breaking changes unless accompanied by a deprecation plan.
4. **Compatibility Annotation:** Source code annotations mark new fields as `@since` to indicate when they were introduced.
5. **Consumer Simulation:** Contract tests run existing consumer request/response fixtures against the new spec to detect regressions.

## Patterns
- **Tolerant Reader/Martin Fowler:** Servers must be accepting of unknown input; clients must be tolerant of unknown output.
- **Postel's Law (Robustness Principle):** "Be conservative in what you send, be liberal in what you accept."
- **Semantic Versioning for APIs:** MAJOR.MINOR.PATCH where MAJOR indicates breaking changes, MINOR indicates additive changes, PATCH indicates fixes.
- **Expansion Points:** Use maps, lists, and optional fields as expansion points that can grow without breaking consumers.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Breaking change detection | Manual review / Automated diff / Both | Automated OAS diff + manual review | Catches obvious breaks automatically, nuanced ones manually |
| Required field additions | Always breaking / Allow with default | Always breaking | Even with defaults, existing code may not handle the field |
| Response field renames | Allowed / Deprecate old + add new | Deprecate old + add new | Renaming breaks deserialization for strict consumers |
| Enum value additions | Always breaking / Non-breaking | Non-breaking (with server handling) | If server handles unknown values gracefully, consumers should too |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Strict vs permissive compatibility | Strict breaks fewer consumers but slows innovation; permissive risks subtle consumer breakage |
| Automated detection vs manual review | Automated catches 80% but misses context-dependent breaks; manual review catches nuance but is slow |
| Additive-only vs refactoring | Additive-only is safest but leaves dead code; refactoring cleans code but may break edge cases |

## Performance Considerations
- OpenAPI diffing in CI adds 5–15 seconds per run — acceptable for most pipelines.
- Contract tests running existing fixtures adds 30–60 seconds — cache fixture data to optimize.
- Tolerant deserialization (ignoring unknown fields) has zero runtime cost in most JSON parsers.
- Enum expansion to maps adds a small memory overhead but huge flexibility.

## Production Considerations
- **Monitoring:** Track which deprecated response fields consumers still rely on via field-access logging.
- **Logging:** Log when a consumer sends a request that would break under a newer spec (proactive alerting).
- **Backup:** Maintain the previous OpenAPI spec as a reference for at least 2 versions.
- **Rollback:** Reverting an additive-only change is safe; reverting a breaking change requires a new version.
- **Testing:** Run backward compatibility checks as part of the CI pipeline on every PR.

## Common Mistakes
- Thinking adding a new required field to a request is safe (it breaks all existing callers).
- Changing the semantic meaning of an existing field without changing its name.
- Making an optional field required after its introduction.
- Changing the format of a field (string → object) without a migration.
- Removing an enum value without deprecating it first.

## Failure Modes
- **Silent Breaking Change:** A field type changes from int to string — parsers may silently coerce. Mitigation: strict contract testing.
- **Consumer Reliance on Bug Behavior:** A bug fix changes behavior consumers depended on. Mitigation: document fixed behavior as breaking if it changes observable output.
- **Date Format Change:** ISO 8601 to Unix timestamp breaks date parsers. Mitigation: add new field with new format, deprecate old.
- **Pagination Change:** Page size default changes from 100 to 20 — consumers not specifying `per_page` break. Mitigation: never change defaults without a major version.

## Ecosystem Usage
- **Stripe:** Strict backward compatibility policy — additive-only changes within a version. Breaking changes require 6+ months deprecation.
- **Twilio:** Publishes a "Backward Compatibility Guarantee" document outlining exactly what they consider breaking.
- **Google APIs:** Follows a comprehensive "Compatibility & Breaking Changes" guide as part of AIP (API Improvement Proposals).

## Related Knowledge Units

### Prerequisites
- [API Style Guide Documentation](ku-17-api-style-guide-documentation)
- [Deprecation Policy Design](ku-01-deprecation-policy-design)

### Related Topics
- [Breaking Change Process](ku-05-breaking-change-process)
- [Team API Consistency Rules](ku-06-team-api-consistency-rules)

### Advanced Follow-up Topics
- Automated OpenAPI diff tools (oas-diff, spectral)
- Consumer-aware compatibility testing with recorded traffic
- Multi-version compatibility matrices

## Research Notes

### Source Analysis
Google's AIP-180 (Backward Compatibility) is the most comprehensive industry reference. It defines compatibility across request, response, and semantic dimensions.

### Key Insight
The most overlooked category of breaking change is **semantic breakage** — when a field name stays the same but its meaning changes. Automated tools cannot detect this; it requires human code review and clear documentation intent.

### Version-Specific Notes
- Laravel 11.x: No built-in backward compatibility checks; use `laravel-owasp` or custom CI with `openapi-diff`.
- PHP 8.4: Type declarations can help prevent accidental type changes (int → string) but cannot prevent semantic drift.
