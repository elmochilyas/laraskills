# Deprecation Policy Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Deprecation policy design defines the rules, timelines, and communication protocols for phasing out API capabilities. A well-structured policy minimizes consumer disruption, provides adequate migration windows, and maintains ecosystem trust. The policy covers announcement timing, deprecation duration, removal enforcement, and exception handling.

## Core Concepts
- **Deprecation Window:** The period between announcing an endpoint/field as deprecated and its actual removal (typically 6–12 months).
- **Sunset Header:** `Sunset` HTTP header indicating when a resource or version will be fully removed.
- **Deprecation Header:** `Deprecation` HTTP header marking an endpoint as deprecated with a timestamp.
- **Migration Path:** The documented steps consumers must follow to move from deprecated to current API capabilities.
- **Grace Period:** An extended window after the deprecation deadline for critical consumers who cannot migrate on time.
- **End-of-Life (EOL):** The date after which the deprecated feature ceases to function.

## Mental Models
- **Public Transit Phase-Out Route:** When a bus line is discontinued, riders are notified months in advance with alternative route maps and transition schedules — exactly how API deprecation should work.
- **Product Expiration Date:** Like grocery items with "best by" dates, deprecation labels tell consumers when an API feature will no longer be reliable or available.

## Internal Mechanics
Deprecation policy enforcement relies on a combination of header-based signaling, documentation annotations, and gateway-level blocking:

1. **Annotation Phase:** Source code marks endpoints/fields with `@Deprecated(since="v2.1", forRemoval="v3.0")` or equivalent.
2. **Header Injection:** API gateway or middleware reads annotations and injects `Deprecation` and `Sunset` headers into responses automatically.
3. **Consumer Notification:** Registered consumers receive email/in-app alerts when a dependency is deprecated.
4. **Monitoring Gate:** After the sunset date, the gateway begins returning `410 Gone` and logs violation attempts.
5. **Hard Cutoff:** A scheduled task removes the deprecated code from the codebase after the grace period expires.

## Patterns
- **Linear Deprecation:** Announce → deprecate → sunset → remove, each stage with a fixed calendar duration.
- **Phased Rollback:** Deprecated features remain available but degrade (rate-limited, reduced SLA) to incentivize migration.
- **Header-Based Signaling:** Always include `Deprecation` and `Sunset` headers; never rely solely on documentation.
- **Changelog-Driven Deprecation:** Each deprecation must appear in the public changelog at announcement time.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Deprecation window length | 3mo / 6mo / 12mo | 6 months | Balances consumer migration time with engineering velocity |
| Sunset header required | Yes / No | Yes | Provides machine-readable deprecation data |
| Hard cutoff vs soft 410 | Hard / Soft | Soft 410 for 30d grace | Allows critical-path extensions without breaking consumers |
| Consumer notification channel | Email / Dashboard / Both | Both | Reduces missed-notification risk |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Longer deprecation window vs faster cleanup | Long windows reduce consumer churn but accumulate tech debt and code complexity |
| Strict cutoff vs grace periods | Strict enforcement cleans the codebase faster but risks consumer outages |
| Header-only vs documentation-only signaling | Headers are machine-readable but can be missed; docs are human-readable but not automated |
| Per-endpoint vs version-level deprecation | Per-endpoint is precise but noisy; version-level is simpler but forces migration for unchanged endpoints |

## Performance Considerations
- Header injection adds negligible overhead (sub-millisecond).
- Deprecation logging at the gateway should use async writes to avoid request-path latency.
- Grace-period tracking requires a small in-memory or Redis cache of consumer-id → expiry maps.
- Stale deprecated code paths in the application add branch complexity and cache-miss overhead.

## Production Considerations
- **Monitoring:** Alert when deprecated endpoints still receive traffic within 30 days of cutoff.
- **Logging:** Log every request to a deprecated endpoint with consumer ID and timestamp for audit trails.
- **Backup:** Maintain a rollback mechanism if a cutoff breaks a critical consumer.
- **Rollback:** Re-enable a deprecated endpoint via feature flag if an emergency arises — do not redeploy old code.
- **Testing:** Integration tests should verify `Deprecation` and `Sunset` headers appear on deprecated routes.

## Common Mistakes
- Deprecating without a documented migration path.
- Setting the same deprecation window for all endpoint types (reads vs writes have different migration costs).
- Forgetting to remove deprecated code after the cutoff date.
- Notifying consumers only via email (filtered as spam).
- Using ambiguous dates ("next quarter") instead of ISO 8601 timestamps.

## Failure Modes
- **Consumer Ignorance:** Consumer ignores deprecation notices → their integration breaks at cutoff. Mitigation: progressive rate-limiting before cutoff.
- **Cutoff Revert:** A critical consumer fails migration → deprecated feature must be re-enabled. Mitigation: feature-flag all cutoffs.
- **Inconsistent Signaling:** Some endpoints emit `Sunset` headers while others do not → consumer confusion. Mitigation: automated linting of deprecation annotations.
- **False Positives:** Non-deprecated endpoints accidentally tagged → consumer panic. Mitigation: code review + staging validation of all deprecation annotations.

## Ecosystem Usage
- **Stripe API:** Uses `Sunset` headers with explicit dates and publishes deprecation timelines on their changelog at least 6 months in advance.
- **GitHub API:** Announces deprecations via blog posts, changelog entries, and retired-version pages.
- **Twilio API:** Marks deprecated resources with headers and maintains a public deprecation calendar.

## Related Knowledge Units

### Prerequisites
- [API Changelog Maintenance](ku-03-api-changelog-maintenance)
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)

### Related Topics
- [Version Retirement Process](ku-02-version-retirement-process)
- [Breaking Change Process](ku-05-breaking-change-process)

### Advanced Follow-up Topics
- Consumer migration analytics dashboard
- Automated deprecation-annotation linting rules
- Multi-tier deprecation windows (critical vs non-critical endpoints)

## Research Notes

### Source Analysis
Stripe's deprecation policy serves as the gold standard: minimum 6-month window, machine-readable headers, clear changelog entries, and enforced cutoffs with rare exceptions.

### Key Insight
The most important factor in deprecation success is not the policy itself but the **notification delivery guarantee**. Policies fail when consumers do not receive or act on deprecation notices — multiple redundant channels (headers + dashboard + email + RSS) significantly reduce this risk.

### Version-Specific Notes
- Laravel 11.x: `@deprecated` annotation in DocBlocks is parsed by IDE but not by the framework; custom middleware or attributes are needed for runtime header injection.
- PHP 8.4: Native attributes (`#[\Deprecated]`) can be used for static analysis but require custom processing for HTTP header injection.
