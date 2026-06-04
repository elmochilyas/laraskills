# ECC Standardized Knowledge — Deprecation Policy Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | Deprecation Policy Design |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Deprecation policy design defines the rules, timelines, and communication protocols for phasing out API capabilities. A well-structured policy minimizes consumer disruption, provides adequate migration windows, and maintains ecosystem trust. The policy covers announcement timing, deprecation duration, removal enforcement, and exception handling using `Deprecation` and `Sunset` HTTP headers alongside changelog and dashboard notifications.

## Core Concepts

- **Deprecation window**: Period between announcing deprecation and actual removal (typically 6-12 months). Critical endpoints (payments, auth) get 12 months; non-critical get 6 months.
- **Sunset header**: HTTP header indicating when a resource/version will be fully removed (machine-readable).
- **Deprecation header**: HTTP header marking endpoint as deprecated with timestamp.
- **Migration path**: Documented steps consumers must follow to move from deprecated to current API capabilities.
- **Grace period**: Extended window after deprecation deadline for critical consumers who cannot migrate on time.
- **End-of-life (EOL)**: Date after which deprecated feature ceases to function.

## When To Use

- Any endpoint, field, or parameter being phased out
- API versions approaching retirement
- Features being replaced by new implementations
- Breaking changes requiring consumer migration time

## When NOT To Use

- Internal-only endpoints with no external consumers (use simpler notification)
- Security fixes requiring immediate removal (bypass standard deprecation)
- Prototype/experimental endpoints explicitly documented as unstable

## Best Practices

- **Always include migration path**: Never deprecate without documented upgrade instructions.
- **Use both headers and documentation**: Deprecation and Sunset headers for machine-readability; changelog + dashboard for human visibility.
- **Multiple notification waves**: Announce at deprecation start, at midpoint, and 30 days before cutoff.
- **Feature-flag all cutoffs**: Enable emergency rollback without redeploying old code.
- **Log deprecated endpoint usage**: Monitor who is still using deprecated features for consumer outreach.
- **Use ISO 8601 dates**: Never ambiguous dates like "next quarter."

## Architecture Guidelines

- Inject Sunset/Deprecation headers via middleware scanning `#[Deprecated]` PHP attributes on routes.
- Gateway-level blocking after sunset date with progressive rate-limiting before hard cutoff.
- Deprecation window varies by endpoint criticality (critical = 12 months, standard = 6 months).
- Maintain consumer registry with contact information for proactive notification.

## Performance Considerations

- Header injection adds sub-millisecond overhead.
- Deprecation logging at gateway should use async writes.
- Grace-period tracking uses small in-memory or Redis cache of consumer-id to expiry maps.
- Stale deprecated code paths add branch complexity and cache-miss overhead.

## Security Considerations

- Deprecated endpoints may have unpatched vulnerabilities. Expedite removal for security-related deprecations.
- Consumer notification must not expose PII through deprecation tracking.
- Rollback feature flags must be access-controlled.

## Common Mistakes

- Deprecating without documented migration path.
- Setting same deprecation window for all endpoint types (reads vs writes have different migration costs).
- Forgetting to remove deprecated code after cutoff.
- Notifying consumers only via email (filtered as spam).
- Using ambiguous dates instead of ISO 8601 timestamps.

## Anti-Patterns

- **Perpetual deprecation**: Endpoints marked deprecated but never removed. Accumulated tech debt with no cleanup.
- **Silent deprecation**: Removing features without any header or notification. Consumers discover breakage at runtime.
- **Inconsistent header emission**: Some endpoints send Sunset headers while others don't, causing consumer confusion.

## Examples

- Deprecation header: `Deprecation: true` with `Sunset: Sat, 01 Nov 2026 00:00:00 GMT`.
- Migration path documentation: "Replace GET /v1/users with GET /v2/users. See migration guide at docs.example.com/v1-to-v2."

## Related Topics

- **Prerequisites**: API Changelog Maintenance, Backward Compatibility Policy
- **Closely Related**: Version Retirement Process, Breaking Change Process
- **Advanced**: Consumer migration analytics dashboard, Automated deprecation-annotation linting, Multi-tier deprecation windows

## AI Agent Notes

When designing deprecation policy: always provide migration path alongside deprecation, use Sunset/Deprecation headers, vary window by endpoint criticality (6-12 months), notify via multiple redundant channels, feature-flag all cutoffs for rollback, log deprecated endpoint usage for consumer outreach.

## Verification

Sources: Stripe deprecation policy, Google AIP-180, Sunset HTTP header RFC 8594, domain-analysis.md.
