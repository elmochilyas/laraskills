# Breaking Change Process

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
The breaking change process governs how and when breaking changes are introduced to the API. While backward compatibility policy defines *what* is breaking, this process defines *how* to approve, communicate, and execute breaking changes. It covers RFC-like proposals, stakeholder review, migration documentation, and coordinated rollout.

## Core Concepts
- **Breaking Change RFC:** A structured proposal document describing the change, rationale, impact analysis, and migration plan.
- **Impact Analysis:** Assessment of how many consumers are affected, the severity of impact, and required migration effort.
- **Migration Guide:** Step-by-step documentation for consumers to migrate from the old behavior to the new.
- **Coordinated Rollout:** The breaking change is deployed alongside the old behavior with a migration window.
- **Change Advisory Board (CAB):** Cross-functional team that reviews and approves breaking changes.
- **Exception Process:** Emergency path for security or regulatory breaking changes that cannot wait.

## Mental Models
- **Construction Detour:** Like a road closure — signs are posted well in advance (deprecation), alternative routes are published (migration guide), and the detour is enforced on a specific date (cutoff).
- **Software Patch Notes:** Breaking changes are like major OS updates — users get detailed release notes, known issues, and rollback instructions.

## Internal Mechanics
1. **RFC Drafting:** The proposing engineer writes a breaking change RFC using a standard template.
2. **Impact Analysis:** Automated tooling identifies affected consumers from the API registry and request logs.
3. **CAB Review:** The RFC is reviewed by the Change Advisory Board weekly.
4. **Approval Conditions:** The CAB may approve as-is, approve with conditions, or reject.
5. **Migration Guide Creation:** An engineering writer creates the consumer migration guide.
6. **Deprecation Window:** The change enters the standard deprecation window (6 months).
7. **Consumer Outreach:** Affected consumers are individually contacted with the migration guide and deadline.
8. **Deployment:** On the sunset date, the breaking change is deployed and old behavior is removed.
9. **Post-Migration Monitoring:** Traffic monitoring for 30 days post-cutoff to catch any missed consumers.

## Patterns
- **Dark Launch:** Deploy the breaking change behind a feature flag; test internally before announcing.
- **Versioned Coexistence:** Old and new behavior coexist under different versions for the migration window.
- **Progressive Rollout:** Breaking change is rolled out to 1% → 5% → 25% → 100% of consumers over weeks.
- **Sunset Date Promise:** Once a sunset date is published, it is treated as a contractual commitment.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Approval body | Individual / Team / CAB | CAB (3 engineers + 1 product) | Balances speed with accountability |
| RFC template | Freeform / Structured | Structured with impact analysis | Ensures all critical questions are answered |
| Emergency exception | Manual / Automated | Manual (VP approval) | Prevents abuse of exception process |
| Migration guide ownership | Engineering / Writer / Shared | Shared (engineer drafts, writer polishes) | Combines technical accuracy with readability |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Fast approval vs thorough review | Fast approval increases velocity; thorough review reduces consumer breakage risk |
| Individual vs CAB decision | Individual is fast but inconsistent; CAB is slow but accountable |
| Fixed migration window vs flexible | Fixed window is predictable; flexible window can close earlier or later based on readiness |

## Performance Considerations
- Breaking change RFC process is human-driven — no significant performance impact.
- Impact analysis queries the consumer registry and request logs — should be async and cached.
- Dark launch feature flags add minimal overhead (single boolean check per request).

## Production Considerations
- **Monitoring:** Alert on any request to the old behavior after sunset date.
- **Logging:** Log every rejected request with consumer ID, old behavior details, and a link to the migration guide.
- **Backup:** Keep old behavior code available via feature flag for 30 days post-cutoff (emergency revert).
- **Rollback:** If the breaking change causes widespread issues, re-enable old behavior via feature flag.
- **Testing:** Comprehensive integration tests on both old and new behavior during the migration window.

## Common Mistakes
- Bypassing the CAB process for "small" breaking changes.
- Underestimating the migration effort for consumers (always 2x the estimate).
- Publishing a migration guide that is too technical or too vague.
- Not tracking which consumers have successfully migrated.
- Setting a sunset date too early due to internal pressure.

## Failure Modes
- **Consumer Revolt:** Multiple consumers publicly complain about the breaking change. Mitigation: extend migration window, offer additional support.
- **Migration Guide Bugs:** The migration guide contains incorrect code examples. Mitigation: test every code example in the guide.
- **Silent Breakage:** Internal consumers (other microservices) break because they were not in the registry. Mitigation: comprehensive dependency mapping.
- **Approval Bottleneck:** CAB becomes a bottleneck because too many breaking changes are proposed. Mitigation: enforce stricter additive-only discipline to reduce volume.

## Ecosystem Usage
- **Stripe:** Requires an internal RFC for every breaking change with consumer impact analysis.
- **AWS:** Publishes "Breaking Change" posts on their blog with detailed impact analysis and migration timelines.
- **Shopify:** Has a public "Breaking Changes" page that lists all upcoming breaks with status indicators.

## Related Knowledge Units

### Prerequisites
- [Backward Compatibility Policy](ku-04-backward-compatibility-policy)
- [Deprecation Policy Design](ku-01-deprecation-policy-design)

### Related Topics
- [ADR Process for APIs](ku-07-adr-process-for-apis)
- [Version Retirement Process](ku-02-version-retirement-process)

### Advanced Follow-up Topics
- Automated consumer impact analysis tooling
- Breaking change insurance (SLA credits for affected consumers)
- Multi-team CAB orchestration across organizational boundaries

## Research Notes

### Source Analysis
Stripe's breaking change RFC process is well-documented in their engineering blog. The key innovation is the "impact analysis" phase that quantifies affected consumers before any decision is made.

### Key Insight
The most effective breaking change processes invest heavily in **impact analysis automation**. Manually identifying affected consumers is slow and error-prone. Building a consumer registry with traffic analysis is a prerequisite for a scalable breaking change process.

### Version-Specific Notes
- Laravel 11.x: Breaking changes in a Laravel API are typically version-dependent; the framework's own breaking changes are documented in the Laravel upgrade guide.
- PHP 8.4: Type system improvements (e.g., property hooks) can help enforce backward compatibility at the language level.
