# Breaking Change Identification — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers the operational lifecycle of breaking change management: maintaining a breaking change registry, managing intentional breaking changes, consumer impact analysis, and post-release monitoring to detect unexpected consumer breakage.

## Core Concepts
- **Breaking Change Registry:** Log of all intentional breaking changes with rationale, impact, and migration path.
- **Consumer Impact Analysis:** Estimating how many consumers will be affected by a given breaking change.
- **Graceful Breaking Changes:** Staged breaking changes with deprecation warnings before enforcement.
- **Post-Release Monitoring:** Tracking error rates and consumer behavior after breaking changes are released.

## Mental Models
- **Earthquake Scale:** Breaking changes are earthquakes. Some are minor tremors (enum additions), some are major quakes (field removals). The registry is the seismograph. Consumer impact analysis is the evacuation plan.
- **Road Construction:** Breaking changes are road closures. You announce them in advance (deprecation), post detour routes (migration guides), then close the road on the scheduled date. Traffic monitoring (error rates) tells you if your detour is working.

## Internal Mechanics
- A `BreakingChange` Eloquent model or config record stores each change with `version`, `type`, `affected_endpoints`, `migration_guide`, `enforcement_date`.
- Consumer traffic analysis queries each endpoint by version to identify active consumers.
- Error rate monitoring alerts on spikes correlated with breaking change releases.
- Consumer outreach automation: email or dashboard notification for affected consumers.

## Patterns
- Breaking change register with lifecycle status: `IDENTIFIED`, `COMMUNICATED`, `ENFORCED`, `RESOLVED`.
- Consumer impact matrix: endpoints × consumers × change type.
- Graceful enforcement: deprecation header → sunset header → 410/404.
- Post-release rollback plan: ability to revert the change or extend the deprecation window.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Registry storage | Database vs config file | Database for dynamic queries, config for simplicity |
| Consumer identification | API key or client ID tracking | Required for impact analysis |
| Enforcement timeline | Fixed vs flexible | Fixed is predictable, flexible is forgiving |
| Rollback strategy | Feature flag vs code revert | Feature flag is faster |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Database registry | Queryable, auditable | Maintenance overhead |
| Config registry | Simple, in version control | Less flexible queries |
| Fixed timeline | Consumer certainty | May need extension |
| Flexible timeline | Forgiving | Consumer uncertainty |

## Performance Considerations
- Breaking change registry lookup is rare (only on version release), no performance concern.
- Consumer impact analysis runs on request logs, not live traffic.
- Error rate monitoring is standard infrastructure, no additional overhead.

## Production Considerations
- Maintain a "no breaking changes between date X and date Y" policy around holidays.
- Breaking changes should never be shipped on a Friday.
- Include breaking change acknowledgment in consumer onboarding.
- Set up a mailing list or webhook for breaking change notifications.

## Common Mistakes
- Shipping a breaking change without consumer notification.
- Underestimating the number of affected consumers.
- Assuming monitoring will catch all breakage — silent data corruption won't trigger alerts.
- Not having a rollback plan before shipping a breaking change.

## Failure Modes
- **Surprise breakage:** Breaking change shipped without consumer knowledge.
- **Incomplete migration:** Consumers partially migrated, some endpoints broken, some working.
- **Alert fatigue:** Breaking change causes a burst of errors that resolves naturally — team stops trusting alerts.
- **Rollback failure:** Breaking change involves database migration that can't be rolled back.

## Ecosystem Usage
- **Twilio:** Breaking change notification email sent 12 months in advance with migration guide.
- **GitHub:** Breaking changes published in a dedicated GitHub Changelog with RSS feed.
- **Stripe:** Breaking changes grouped into quarterly API versions, never shipped mid-cycle.

## Related Knowledge Units
- **Prerequisites:** API monitoring, Consumer analytics
- **Related Topics:** Deprecation header implementation, Phased deprecation timeline
- **Advanced Follow-up:** Consumer contract testing, API lifecycle management platforms

## Research Notes
### Source Analysis
Stripe's "API Changelog" (2015-present) is the canonical example of breaking change communication. The "Hyrum's Law" phenomenon (given enough consumers, all behaviors are depended on by someone) is documented by Google's Hyrum Wright (2011).

### Key Insight
Hyrum's Law applies to every API: no matter how carefully you classify "non-breaking" changes, some consumer somewhere depends on the old behavior. The goal is not zero breakage — it's zero surprise breakage.

### Version-Specific Notes
Laravel 11 has no built-in breaking change detection. Use external tools like `openapi-diff` (Node.js) or `oasdiff` (Go) in CI.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization