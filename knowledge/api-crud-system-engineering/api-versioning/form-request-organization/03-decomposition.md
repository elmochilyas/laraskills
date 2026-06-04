# Form Request Organization — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers maintaining form request hierarchies over time: managing rule divergence between versions, sunsetting old validation flows, migrating consumers to new required fields, and ensuring authorization consistency across versions.

## Core Concepts
- **Rule Divergence Tracking:** Monitoring how much the validation rule set differs between versions.
- **Validation Audit:** Periodic review of all versioned form requests for correctness and security.
- **Consumer Migration Support:** Deprecation notices in validation responses guiding consumers to new fields.
- **Authorization Drift Prevention:** Ensuring authorization rules remain consistent across versions unless intentionally changed.

## Mental Models
- **Immigration Policy Changes:** V1 form request is like 1990 immigration rules. V2 is 2020 immigration rules. Different documents required, different checks. But the border crossing (endpoint) is the same place.
- **Form Revision History:** Like government form revisions (Form 1040, 2023 edition vs 2024 edition). The purpose is the same, but schedules, attachments, and required fields change each year.

## Internal Mechanics
- A `RequestRuleDiff` tool extracts rules from each version and computes a diff set.
- CI workflow blocks PRs that add required fields to V1 without an `@deprecated` or migration guide.
- Version-specific validation error rates are tracked per endpoint to detect consumer confusion.
- Authorization matrix is audited quarterly to ensure V1 and V2 access controls remain appropriate.

## Patterns
- Rule diff report generated on every version release.
- Deprecated field validation: in old versions, mark field as `nullable|sometimes` to phase out requirements.
- Validation error enhancement: add `deprecated` or `migrate_to` hints in validation error responses.
- Shared rule sets extracted into versioned rule provider classes.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Rule change tracking | CI diff on PR | Catches unexpected changes |
| Required field removal | Deprecate in V{n}, remove in V{n+2} | Two-version buffer for consumers |
| Validation error format | Version-specific vs consistent | Consistent is less confusing |
| Authorization audit | Quarterly automated review | Security-critical, cannot drift |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Consistent error format | Client library simplicity | Harder to evolve format |
| Version-specific error format | Evolution flexibility | Client fragmentation |
| Proactive rule diff | Prevents regressions | Tooling setup cost |
| Reactive incident response | No upfront investment | Consumers break first |

## Performance Considerations
- Rule diff tools run in CI, no runtime cost.
- Validation error enhancement (deprecation hints) adds ~0.01ms per validation failure.
- Authorization matrix checks are automated tests, not runtime checks.

## Production Considerations
- Monitor validation failure rates per version as a consumer health signal.
- When V2 adds a required field, monitor V1 requests to that field name to estimate migration progress.
- Train support team to ask "which version are you using?" first when field errors occur.
- Include version number in validation error responses for easier debugging.

## Common Mistakes
- Adding required fields to V2 without notifying V1 consumers (they may also send data to V2 endpoints eventually).
- Changing validation error format between versions without updating client libraries.
- Removing authorization checks from V2 because "it's a newer version with different rules."
- Forgetting that V1 and V2 may need different database validation rules (unique checks scoped differently).

## Failure Modes
- **Rule bleed:** V2 inherits V1 rules that no longer apply (e.g., V2 removed a field but V1 rules still run).
- **Authorization gap:** V2 removes an `authorize()` check that existed in V1, creating a security hole.
- **Consumer confusion:** Validation error in V2 references a V1 field name, consumer looks for wrong field.
- **Silent data corruption:** V2 removes a validation rule, allowing bad data into the database.

## Ecosystem Usage
- **Stripe:** Version-specific validation documented in API reference, with clear "required in this version" indicators.
- **GitHub:** Different OAuth scopes and validation per API version, documented in migration guides.
- **Shopify:** Validation changes are a key section in their version release notes, with field-level migration examples.

## Related Knowledge Units
- **Prerequisites:** Input validation patterns, API security
- **Related Topics:** Breaking change identification, Backward-compatible changes
- **Advanced Follow-up:** Version-specific database constraints, Consumer-driven contract testing

## Research Notes
### Source Analysis
OWASP API Security (2023) emphasizes the risk of authorization drift between API versions. Stripe's API version changelog (2015-present) shows best-practice validation change communication.

### Key Insight
Form request versioning is the most security-critical aspect of API versioning. A rule gap between versions is a vulnerability, not just a bug.

### Version-Specific Notes
Laravel 11's `validated()` method returns only validated data — always use it instead of `$request->all()` to maintain version safety.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization